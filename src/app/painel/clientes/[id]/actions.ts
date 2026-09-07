"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { ESTAGIOS_FUNIL, type EstagioFunil } from "@/lib/enums";

/** Avançar/mudar estágio no funil é ação de CRM (Etapa 3), diferente de gerar/duplicar/excluir
 * mapa (Etapa 4). "Mudança de estágio" é um dos eventos que conta como movimento (decisão 4). */
export async function mudarEstagio(clienteId: string, novoEstagio: EstagioFunil) {
  if (!ESTAGIOS_FUNIL.includes(novoEstagio)) throw new Error("Estágio inválido.");
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });

  await prisma.$transaction([
    prisma.cliente.update({
      where: { id: clienteId },
      data: { estagioFunil: novoEstagio, estagioAtualizadoEm: new Date() },
    }),
    prisma.eventoHistorico.create({
      data: {
        clienteId,
        corretorId: cliente.corretorId,
        tipo: "sistema",
        texto: `Estágio alterado para "${novoEstagio}".`,
      },
    }),
  ]);

  revalidatePath(`/painel/clientes/${clienteId}`);
  revalidatePath("/painel/funil");
  revalidatePath("/painel/dashboard");
}

/**
 * Corrigir o nome do cliente pela página dele. Marca `nomeEditadoManualmente`: a partir daqui,
 * um reenvio do link de captação com o mesmo telefone/e-mail (lead repetido) nunca mais
 * sobrescreve o nome — só telefone/e-mail e o novo estudo. Ver `enviarLead` em
 * src/app/captacao/actions.ts e AGENTS.md, "Captação pública".
 */
export async function editarNomeCliente(clienteId: string, novoNome: string) {
  const limpo = novoNome.trim();
  if (!limpo) return;
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });
  if (limpo === cliente.nome) return;

  await prisma.$transaction([
    prisma.cliente.update({ where: { id: clienteId }, data: { nome: limpo, nomeEditadoManualmente: true } }),
    prisma.eventoHistorico.create({
      data: { clienteId, corretorId: cliente.corretorId, tipo: "manual", texto: `Nome corrigido: "${cliente.nome}" → "${limpo}".` },
    }),
  ]);

  revalidatePath(`/painel/clientes/${clienteId}`);
  revalidatePath("/painel/clientes");
  revalidatePath("/painel/dashboard");
}

/** Anotações de venda — nunca entram em PDF nem e-mail. Criar uma também conta como movimento. */
export async function criarNota(clienteId: string, texto: string) {
  const limpo = texto.trim();
  if (!limpo) return;
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });

  await prisma.$transaction([
    prisma.notaCrm.create({ data: { clienteId, corretorId: cliente.corretorId, texto: limpo } }),
    prisma.eventoHistorico.create({
      data: { clienteId, corretorId: cliente.corretorId, tipo: "manual", texto: "Anotação adicionada." },
    }),
  ]);

  revalidatePath(`/painel/clientes/${clienteId}`);
}

/**
 * Excluir mapa isolado: pela página do cliente, apaga só aquele mapa e o estudo que o gerou
 * (cascade cuida do Mapa). Os demais mapas do cliente ficam intactos. Se era o único, o cliente
 * sai do funil — vira só um contato na lista (não-negociável).
 */
export async function excluirMapaIsolado(estudoId: string) {
  const estudo = await prisma.estudo.findUniqueOrThrow({ where: { id: estudoId }, include: { mapa: true } });
  if (!estudo.mapa) throw new Error("Este estudo não tem mapa gerado — nada a excluir por aqui.");

  const restantes = await prisma.estudo.count({ where: { clienteId: estudo.clienteId, id: { not: estudoId } } });

  await prisma.$transaction([
    prisma.estudo.delete({ where: { id: estudoId } }), // cascade: apaga o Mapa junto
    prisma.eventoHistorico.create({
      data: {
        clienteId: estudo.clienteId,
        corretorId: estudo.corretorId,
        tipo: "sistema",
        texto: `Mapa da Proteção v${estudo.mapa.numeroVersao} excluído.`,
      },
    }),
    ...(restantes === 0
      ? [prisma.cliente.update({ where: { id: estudo.clienteId }, data: { estagioFunil: null, estagioAtualizadoEm: new Date() } })]
      : []),
  ]);

  revalidatePath(`/painel/clientes/${estudo.clienteId}`);
  revalidatePath("/painel/funil");
  revalidatePath("/painel/dashboard");
  redirect(`/painel/clientes/${estudo.clienteId}`);
}

/**
 * Fila dos 120 dias: exclusão SÓ com autorização explícita do corretor (não-negociável — nunca
 * automática). Leva o histórico inteiro do cliente — todos os mapas e estudos, mantendo o
 * cadastro (decisão 3 do README do handoff). `EventoHistorico` e `NotaCrm` não são apagados: são
 * o registro de que aquilo aconteceu, não fazem parte do "mapa e estudo".
 */
export async function excluirHistoricoCompleto(clienteId: string) {
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });
  const estudos = await prisma.estudo.findMany({ where: { clienteId }, select: { id: true, mapa: { select: { id: true } } } });
  const quantidadeMapas = estudos.filter((e) => e.mapa).length;

  await prisma.$transaction([
    prisma.estudo.deleteMany({ where: { clienteId } }), // cascade: apaga todos os Mapa junto
    prisma.cliente.update({ where: { id: clienteId }, data: { estagioFunil: null, estagioAtualizadoEm: new Date() } }),
    prisma.eventoHistorico.create({
      data: {
        clienteId,
        corretorId: cliente.corretorId,
        tipo: "sistema",
        texto: `Histórico excluído por autorização do corretor (fila dos 120 dias): ${quantidadeMapas} mapa(s), ${estudos.length} estudo(s). Cadastro mantido, fora do funil.`,
      },
    }),
  ]);

  revalidatePath("/painel/dashboard");
  revalidatePath("/painel/funil");
  revalidatePath("/painel/clientes");
  revalidatePath(`/painel/clientes/${clienteId}`);
}

/**
 * Excluir cadastro (2026-09-07) — diferente do pedido de exclusão LGPD (Ajustes → LGPD e
 * retenção, que é a rota certa quando é o CLIENTE quem pede pra sair da base, sempre deixando um
 * registro de auditoria em `ExclusaoLgpd`). Esta aqui é a faxina de cadastro de teste/engano do
 * próprio corretor — só aparece na UI quando `mapas.length === 0` (nunca existiu nada de valor
 * pra perder) e apaga de vez, sem deixar rastro nenhum: cadastro, estudo(s) em aberto e histórico
 * juntos (cascade do Prisma). Trava no servidor se já existir Mapa gerado, mesmo que a tela não
 * mostre o botão nesse caso — defesa contra chamar isto direto por engano.
 */
export async function excluirCadastroSemMapa(clienteId: string) {
  const corretor = await obterCorretorAtual();
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });
  if (cliente.corretorId !== corretor.id) throw new Error("Cliente não pertence a este corretor.");

  const temMapa = await prisma.mapa.count({ where: { clienteId } });
  if (temMapa > 0) throw new Error("Este cliente já tem Mapa gerado — use \"Excluir mapa\" por versão, ou o pedido de exclusão LGPD em Ajustes.");

  await prisma.cliente.delete({ where: { id: clienteId } }); // cascade: estudos, eventos, notas, agendamentos

  revalidatePath("/painel/dashboard");
  revalidatePath("/painel/funil");
  revalidatePath("/painel/clientes");
  redirect("/painel/clientes");
}
