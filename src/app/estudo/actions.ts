"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { calc } from "@/lib/calc";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { paraFatoresCalc, padroesPorEstudo } from "@/lib/fatores-calculo";
import { ESTUDO_VAZIO, type EstudoFormulario } from "@/lib/estudo-formulario";

/** Botão "+ Novo estudo": cria o cliente e o estudo em aberto, e manda pro estudo. */
export async function criarEstudoNovo() {
  const corretor = await obterCorretorAtual();
  const fatores = await prisma.fatoresCalculo.findUniqueOrThrow({ where: { corretorId: corretor.id } });

  const dadosIniciais: EstudoFormulario = { ...ESTUDO_VAZIO, ...padroesPorEstudo(fatores) };

  const cliente = await prisma.cliente.create({
    data: { corretorId: corretor.id, nome: "Novo estudo", estagioFunil: "estudo" },
  });
  const estudo = await prisma.estudo.create({
    data: {
      clienteId: cliente.id,
      corretorId: corretor.id,
      status: "aberto",
      dados: dadosIniciais as object,
    },
  });

  redirect(`/estudo/${estudo.id}`);
}

/** Autosave: grava o formulário inteiro (debounced no cliente) e mantém o Cliente em sincronia
 * pros campos de identidade que o CRM (Etapa 3) vai precisar. Só funciona em estudo aberto —
 * mapa gerado é travado, sem rota de edição nenhuma. */
export async function salvarDados(estudoId: string, dados: EstudoFormulario) {
  const estudo = await prisma.estudo.findUniqueOrThrow({ where: { id: estudoId } });
  if (estudo.status !== "aberto") {
    throw new Error("Este estudo já virou Mapa da Proteção — travado, não aceita alteração.");
  }

  await prisma.$transaction([
    prisma.estudo.update({ where: { id: estudoId }, data: { dados: dados as object } }),
    prisma.cliente.update({
      where: { id: estudo.clienteId },
      data: {
        nome: dados.nome || "Novo estudo",
        telefone: dados.whats || null,
        email: dados.email || null,
        profissao: dados.profissao || null,
        estadoCivil: dados.estadoCivil || null,
        sexo: dados.sexo || null,
      },
    }),
  ]);

  revalidatePath(`/estudo/${estudoId}`);
  return { salvoEm: new Date().toISOString() };
}

/** Gera o Mapa da Proteção: congela o snapshot de calc() + os fatores em vigor, e trava o
 * estudo pra sempre (status=gerado). Não existe — e não deve existir — rota de desfazer isto. */
export async function gerarMapa(estudoId: string) {
  const estudo = await prisma.estudo.findUniqueOrThrow({ where: { id: estudoId } });
  if (estudo.status !== "aberto") {
    throw new Error("Este estudo já tem um Mapa da Proteção gerado.");
  }

  const corretor = await obterCorretorAtual();
  const fatoresDb = await prisma.fatoresCalculo.findUniqueOrThrow({ where: { corretorId: corretor.id } });
  const dados = estudo.dados as unknown as EstudoFormulario;
  const resultado = calc(dados, paraFatoresCalc(fatoresDb), new Date());

  const mapasAnteriores = await prisma.mapa.count({ where: { clienteId: estudo.clienteId } });

  await prisma.$transaction([
    prisma.mapa.create({
      data: {
        estudoId: estudo.id,
        clienteId: estudo.clienteId,
        corretorId: estudo.corretorId,
        numeroVersao: mapasAnteriores + 1,
        capitalAProteger: resultado.capitalAProteger,
        vitalicia: resultado.vitalicia,
        temporaria: resultado.temporaria,
        custoEducacionalTotal: resultado.custoEducacaoTotal,
        pensaoMensal: resultado.pensaoMensal,
        derivados: resultado as object,
        fatoresUsados: fatoresDb as object,
      },
    }),
    prisma.estudo.update({
      where: { id: estudo.id },
      data: { status: "gerado", geradoEm: new Date() },
    }),
    // Não muda estagioFunil aqui: "apresentado" é uma ação do corretor na reunião (ver o mock
    // de Painel do Corretor — mapa gerado em 25/08, apresentado só em 26/08), não automática ao
    // gerar. Avançar o estágio é UI da Etapa 3 (Painel), ainda não construída.
    prisma.eventoHistorico.create({
      data: {
        clienteId: estudo.clienteId,
        corretorId: estudo.corretorId,
        tipo: "sistema",
        texto: `Mapa da Proteção v${mapasAnteriores + 1} gerado.`,
      },
    }),
  ]);

  revalidatePath(`/estudo/${estudoId}`);
  redirect(`/estudo/${estudoId}`);
}
