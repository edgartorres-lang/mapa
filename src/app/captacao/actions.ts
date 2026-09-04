"use server";

import { prisma } from "@/lib/prisma";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { mapearLeadParaEstudo, type LeadRespostas } from "@/lib/lead-formulario";
import { dispararWebhook } from "@/lib/webhooks";
import { padroesPorEstudo } from "@/lib/fatores-calculo";

/**
 * Fim do formulário público (deixar a tela de revisão): grava cliente + estudo, dispara
 * `/webhook/lead`. "Lead repetido: telefone OU e-mail iguais reaproveitam o cadastro e abrem
 * estudo novo" (decisão do README) — não mexe no estagioFunil de quem já existe, só de quem é
 * novo (esse sim entra em 'lead', "topo do funil").
 */
export async function enviarLead(respostas: LeadRespostas, utmCampanha: string | null) {
  const corretor = await obterCorretorAtual();
  const fatores = await prisma.fatoresCalculo.findUniqueOrThrow({ where: { corretorId: corretor.id } });

  const telefone = respostas.contato.wpp || null;
  const email = respostas.contato.email || null;

  let cliente = null;
  if (telefone || email) {
    cliente = await prisma.cliente.findFirst({
      where: {
        corretorId: corretor.id,
        OR: [telefone ? { telefone } : undefined, email ? { email } : undefined].filter((x): x is { telefone: string } | { email: string } => !!x),
      },
    });
  }

  const dados = { ...mapearLeadParaEstudo(respostas), ...padroesPorEstudo(fatores) };
  const leadRepetido = !!cliente;
  const origemTexto = utmCampanha ? `Link · campanha ${utmCampanha}` : "Link de captação";

  if (cliente) {
    // Se o corretor já corrigiu o nome manualmente pela página do cliente, um reenvio do link
    // (mesmo telefone/e-mail) nunca mais sobrescreve — só telefone/e-mail e o novo estudo. Ver
    // editarNomeCliente em src/app/painel/clientes/[id]/actions.ts e AGENTS.md.
    cliente = await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        nome: cliente.nomeEditadoManualmente ? cliente.nome : dados.nome || cliente.nome,
        telefone: telefone || cliente.telefone,
        email: email || cliente.email,
        estadoCivil: dados.estadoCivil || cliente.estadoCivil,
        lgpdStatus: dados.lgpd ? "aceito" : cliente.lgpdStatus,
        lgpdAceitoEm: dados.lgpd ? new Date() : cliente.lgpdAceitoEm,
      },
    });
  } else {
    cliente = await prisma.cliente.create({
      data: {
        corretorId: corretor.id,
        nome: dados.nome || "Lead sem nome",
        telefone,
        email,
        estadoCivil: dados.estadoCivil || null,
        origem: origemTexto,
        utmCampanha,
        estagioFunil: "lead",
        estagioAtualizadoEm: new Date(),
        lgpdStatus: dados.lgpd ? "aceito" : "pendente",
        lgpdAceitoEm: dados.lgpd ? new Date() : null,
      },
    });
  }

  const estudo = await prisma.estudo.create({
    data: { clienteId: cliente.id, corretorId: corretor.id, status: "aberto", dados: dados as object },
  });

  const notaTexto = [
    respostas.cenario ? `Cenário (autoavaliação do lead): "${respostas.cenario}".` : null,
    respostas.obs ? `Observação: ${respostas.obs}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  await prisma.$transaction([
    prisma.eventoHistorico.create({
      data: {
        clienteId: cliente.id,
        corretorId: corretor.id,
        tipo: "sistema",
        texto: leadRepetido ? "Preencheu o link de novo. Cadastro reaproveitado, estudo novo aberto." : "Preencheu o link de captação.",
      },
    }),
    ...(notaTexto ? [prisma.notaCrm.create({ data: { clienteId: cliente.id, corretorId: corretor.id, texto: notaTexto } })] : []),
  ]);

  // webhookLead dispara sempre, sem chave (não tem toggle na tela de Integrações — igual esquecer).
  await dispararWebhook(corretor.webhookLead, { nome: dados.nome, telefone, email, campanha: utmCampanha });
  if (corretor.integracaoWhatsappAtiva) {
    await dispararWebhook(corretor.webhookNotificar, {
      tipo: leadRepetido ? "lead_repetido" : "lead_novo",
      nome: dados.nome,
      profissao: dados.profissao || null,
      origem: origemTexto,
    });
  }

  return { clienteId: cliente.id, estudoId: estudo.id, leadRepetido, corretorNome: corretor.nome };
}

export type EscolhaAgendamento =
  | { tipo: "horario"; ordem: number; dataHoraISO: string }
  | { tipo: "sugerido"; texto: string }
  | { tipo: "whatsapp" };

/**
 * Última tela do formulário: agenda um dos horários já resolvidos (ver
 * `resolverHorariosDisponiveis`, chamado no load de `/captacao`), ou o campo aberto, ou pede
 * retorno por WhatsApp (sem compromisso de horário — não cria Agendamento, só avisa o corretor).
 *
 * `dataHoraISO` vem pronto do cliente — é o mesmo valor que apareceu na tela, já resolvido contra
 * a agenda de verdade quando a checagem está ligada (`Corretor.aceitaHorarioOcupado` desligado).
 * Não recalcula a partir de `HorarioSugerido` de novo aqui: o resultado da checagem (qual
 * candidato — dia original ou um dos seguintes — ficou livre) só existe no momento em que a
 * página carregou, e se perderia se recomputássemos do zero. Ainda assim "conflito não bloqueia"
 * continua valendo — o corretor vê e remarca se precisar, como sempre.
 */
export async function confirmarAgendamento(clienteId: string, escolha: EscolhaAgendamento) {
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });
  const corretor = await obterCorretorAtual();

  if (escolha.tipo === "whatsapp") {
    await prisma.eventoHistorico.create({
      data: { clienteId, corretorId: corretor.id, tipo: "sistema", texto: "Pediu para ser chamado no WhatsApp em vez de agendar um horário." },
    });
    if (corretor.integracaoWhatsappAtiva) {
      await dispararWebhook(corretor.webhookNotificar, { tipo: "pediu_whatsapp", nome: cliente.nome, profissao: cliente.profissao, origem: cliente.origem });
    }
    return { canal: "whatsapp" as const };
  }

  let dataHora: Date | null = null;
  let textoLivre: string | null = null;
  let origem: string;

  if (escolha.tipo === "horario") {
    dataHora = new Date(escolha.dataHoraISO);
    if (Number.isNaN(dataHora.getTime())) throw new Error("Horário inválido.");
    origem = `horario${escolha.ordem + 1}`;
  } else {
    textoLivre = escolha.texto;
    origem = "campo_aberto";
  }

  await prisma.$transaction([
    prisma.agendamento.create({ data: { clienteId, dataHora, textoLivre, origem } }),
    prisma.eventoHistorico.create({
      data: {
        clienteId,
        corretorId: corretor.id,
        tipo: "sistema",
        texto: dataHora ? `Escolheu horário: ${dataHora.toLocaleDateString("pt-BR")} às ${dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.` : `Propôs horário: "${textoLivre}".`,
      },
    }),
  ]);

  // Evento da agenda leva só nome e contato — nenhum valor do estudo (não-negociável).
  if (corretor.integracaoAgendaAtiva) {
    await dispararWebhook(corretor.webhookAgendar, {
      nome: cliente.nome,
      contato: cliente.telefone || cliente.email,
      data: dataHora ? dataHora.toISOString() : null,
      hora: dataHora ? dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null,
      duracao: 45,
      sugestaoLivre: textoLivre,
    });
  }
  if (corretor.integracaoWhatsappAtiva) {
    await dispararWebhook(corretor.webhookNotificar, { tipo: "horario_escolhido", nome: cliente.nome, profissao: cliente.profissao, origem: cliente.origem });
  }

  return {
    canal: (escolha.tipo === "horario" ? "agenda" : "sugerido") as "agenda" | "sugerido",
    dataHora: dataHora?.toISOString() ?? null,
    textoLivre,
  };
}
