"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { mapearLeadParaEstudo, type LeadRespostas } from "@/lib/lead-formulario";
import { dispararWebhook, dispararWebhookComResposta } from "@/lib/webhooks";
import { padroesPorEstudo } from "@/lib/fatores-calculo";
import { gerarApelidoEstudo } from "@/lib/estudo-formulario";
import { dataBrParaDate } from "@/lib/formato";

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

  const nascimento = dataBrParaDate(dados.nasc);

  if (cliente) {
    // Se o corretor já editou o cadastro manualmente (pela página do cliente, ou digitando no
    // wizard) desde a última vez, um reenvio do link nunca mais sobrescreve nenhum desses campos
    // — `cadastroEditadoManualmente` generaliza o que antes só existia pro nome
    // (`nomeEditadoManualmente`). Ver AGENTS.md, "Captação pública".
    const protegido = cliente.cadastroEditadoManualmente;
    cliente = await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        nome: cliente.nomeEditadoManualmente ? cliente.nome : dados.nome || cliente.nome,
        telefone: protegido ? cliente.telefone : telefone || cliente.telefone,
        email: protegido ? cliente.email : email || cliente.email,
        estadoCivil: protegido ? cliente.estadoCivil : dados.estadoCivil || cliente.estadoCivil,
        nascimento: protegido ? cliente.nascimento : nascimento || cliente.nascimento,
        cenarioResposta: protegido ? cliente.cenarioResposta : dados.cenario || cliente.cenarioResposta,
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
        nascimento,
        cenarioResposta: dados.cenario || null,
        origem: origemTexto,
        utmCampanha,
        estagioFunil: "lead",
        estagioAtualizadoEm: new Date(),
        lgpdStatus: dados.lgpd ? "aceito" : "pendente",
        lgpdAceitoEm: dados.lgpd ? new Date() : null,
      },
    });
  }

  // Achado real (2026-09-09, caso do Francisco Oliveira): antes disto, reenvio do link
  // reaproveitava (sobrescrevia) o único estudo "aberto" existente — parecia seguro (evita
  // rascunho órfão), mas na prática apagava silenciosamente respostas já digitadas quando o
  // mesmo cliente preenchia o link mais de uma vez. Agora sempre cria um Estudo novo,
  // identificado por `apelido`/`origem` — o corretor vê todos na lista "Estudos em andamento" da
  // página do cliente e decide o que fazer (abrir, renomear, apagar os repetidos).
  const apelido = gerarApelidoEstudo(dados.nome || cliente.nome, new Date());
  const estudo = await prisma.estudo.create({
    data: { clienteId: cliente.id, corretorId: corretor.id, status: "aberto", dados: dados as object, lido: false, apelido, origem: origemTexto },
  });

  const notaTexto = respostas.obs ? `Observação: ${respostas.obs}` : "";

  await prisma.$transaction([
    prisma.eventoHistorico.create({
      data: {
        clienteId: cliente.id,
        corretorId: corretor.id,
        tipo: "sistema",
        texto: !leadRepetido ? "Preencheu o link de captação." : `Preencheu o link de novo. Novo pré-estudo: "${apelido}".`,
      },
    }),
    ...(notaTexto ? [prisma.notaCrm.create({ data: { clienteId: cliente.id, corretorId: corretor.id, texto: notaTexto } })] : []),
  ]);

  // webhookLead dispara sempre, sem chave (não tem toggle na tela de Integrações — igual esquecer).
  // corretorNome/corretora vão junto pra dar pro workflow assinar o e-mail de agradecimento ao
  // lead sem precisar hardcodear nada do lado do n8n.
  await dispararWebhook(corretor.webhookLead, {
    nome: dados.nome,
    telefone,
    email,
    campanha: utmCampanha,
    corretorNome: corretor.nome,
    corretora: corretor.corretora || "Setor Norte Seguros",
  });
  if (corretor.integracaoWhatsappAtiva) {
    // corretorWhatsapp: pra onde o n8n manda o aviso — sempre o WhatsApp salvo no cadastro do
    // próprio corretor (Ajustes → Perfil e marca), nunca fixo no workflow do n8n.
    await dispararWebhook(corretor.webhookNotificar, {
      tipo: leadRepetido ? "lead_repetido" : "lead_novo",
      nome: dados.nome,
      profissao: dados.profissao || null,
      origem: origemTexto,
      // Contato do lead — pra você conseguir responder na hora, sem precisar abrir o painel
      // primeiro (pedido real do Edgar, 2026-09-07: "deveria me enviar o contato do cliente").
      telefone,
      email,
      corretorWhatsapp: corretor.whatsapp,
    });
  }

  // Bug real achado em produção (2026-09-05): nenhuma das duas ações deste arquivo revalidava
  // nada — diferente de todo outro ponto do app que mexe em Cliente/Estudo/Agendamento (ver
  // src/app/painel/clientes/[id]/actions.ts). Lead novo pelo link público não aparecia no
  // dashboard/funil/clientes até alguma ação sem relação nenhuma (ex.: criar uma campanha)
  // revalidar essas rotas de raspão.
  revalidatePath("/painel/dashboard");
  revalidatePath("/painel/funil");
  revalidatePath("/painel/clientes");
  revalidatePath("/painel/captacao");
  revalidatePath(`/painel/clientes/${cliente.id}`);

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
      await dispararWebhook(corretor.webhookNotificar, { tipo: "pediu_whatsapp", nome: cliente.nome, profissao: cliente.profissao, origem: cliente.origem, telefone: cliente.telefone, email: cliente.email, corretorWhatsapp: corretor.whatsapp });
    }
    revalidatePath(`/painel/clientes/${clienteId}`);
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

  const [agendamento] = await prisma.$transaction([
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

  // Evento da agenda leva só nome e contato — nenhum valor do estudo (não-negociável). Espera
  // resposta (em vez de só disparar) porque precisa do `googleEventId` de volta — é o que o
  // `webhookEsquecer` usa depois pra cancelar esse compromisso específico se o cliente pedir
  // exclusão LGPD (ver `registrarExclusaoLgpd` em painel/ajustes/actions.ts). Best-effort: se o
  // n8n não responder ou não vier `googleEventId` (ex.: proposta em campo aberto, sem data
  // resolvida — o workflow decide não criar evento nenhum), o agendamento fica salvo do mesmo
  // jeito, só sem o vínculo com a agenda.
  if (corretor.integracaoAgendaAtiva) {
    const respostaAgenda = await dispararWebhookComResposta<{ googleEventId?: string }>(corretor.webhookAgendar, {
      nome: cliente.nome,
      contato: cliente.telefone || cliente.email,
      // `email` separado de `contato` (2026-09-09): `contato` prioriza telefone pro texto do
      // evento na agenda, então quando o cliente tem os dois, o e-mail nunca chegava no n8n — e
      // o n8n precisa dele à parte pra poder confirmar o horário por e-mail pro lead, além de
      // criar o evento. `emailAtivo` deixa isso condicionado à chave "Integração de E-mail"
      // também (não só "Integração de Agenda"), pro corretor poder ligar/desligar cada uma.
      email: cliente.email,
      emailAtivo: corretor.integracaoEmailAtiva,
      corretorNome: corretor.nome,
      data: dataHora ? dataHora.toISOString() : null,
      hora: dataHora ? dataHora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null,
      duracao: 45,
      sugestaoLivre: textoLivre,
    });
    if (respostaAgenda.ok && respostaAgenda.dados.googleEventId) {
      await prisma.agendamento.update({ where: { id: agendamento.id }, data: { googleEventId: respostaAgenda.dados.googleEventId } });
    }
  }
  if (corretor.integracaoWhatsappAtiva) {
    await dispararWebhook(corretor.webhookNotificar, { tipo: "horario_escolhido", nome: cliente.nome, profissao: cliente.profissao, origem: cliente.origem, telefone: cliente.telefone, email: cliente.email, corretorWhatsapp: corretor.whatsapp });
  }

  revalidatePath("/painel/dashboard");
  revalidatePath("/painel/funil");
  revalidatePath("/painel/captacao");
  revalidatePath(`/painel/clientes/${clienteId}`);

  return {
    canal: (escolha.tipo === "horario" ? "agenda" : "sugerido") as "agenda" | "sugerido",
    dataHora: dataHora?.toISOString() ?? null,
    textoLivre,
  };
}
