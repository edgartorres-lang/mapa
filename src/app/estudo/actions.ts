"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { calc } from "@/lib/calc";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { paraFatoresCalc, padroesPorEstudo } from "@/lib/fatores-calculo";
import { ESTUDO_VAZIO, paraEstudoFormulario, type EstudoFormulario } from "@/lib/estudo-formulario";
import { dispararWebhookComResposta } from "@/lib/webhooks";
import { carregarSaida } from "@/lib/carregar-saida";

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

/**
 * Botão "+ Novo estudo" chamado de dentro da página de um cliente específico (`clienteId` vem do
 * pathname, ver `BotaoNovoEstudo`) — corrige um bug real: o botão do menu lateral sempre criava
 * um cliente novo em branco, mesmo com o corretor olhando pra um cliente já aberto na tela.
 *
 * Três casos, igual à lógica que "Duplicar" já usa pra decidir quando aparecer:
 * 1. Cliente já tem estudo em aberto → só abre ele, não cria nada (evita dois estudos abertos ao
 *    mesmo tempo pro mesmo cliente, mesma regra do botão Duplicar).
 * 2. Cliente já tem Mapa gerado mas nenhum estudo aberto → o caminho certo é "Duplicar" (mantém
 *    a linhagem via `duplicadoDeEstudoId`), não criar um estudo solto por fora dela — manda de
 *    volta pra página do cliente, onde o botão de duplicar já está.
 * 3. Cliente novo, sem estudo nem mapa nenhum → cria de verdade, pré-preenchido com o que já se
 *    sabe do cadastro (nome/contato/profissão/estado civil/sexo).
 */
export async function abrirOuCriarEstudoDoCliente(clienteId: string) {
  const corretor = await obterCorretorAtual();
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });
  if (cliente.corretorId !== corretor.id) throw new Error("Cliente não pertence a este corretor.");

  const estudoAberto = await prisma.estudo.findFirst({ where: { clienteId, status: "aberto" } });
  if (estudoAberto) redirect(`/estudo/${estudoAberto.id}`);

  const temMapa = await prisma.mapa.count({ where: { clienteId } });
  if (temMapa > 0) redirect(`/painel/clientes/${clienteId}`);

  const fatores = await prisma.fatoresCalculo.findUniqueOrThrow({ where: { corretorId: corretor.id } });
  const dadosIniciais: EstudoFormulario = {
    ...ESTUDO_VAZIO,
    ...padroesPorEstudo(fatores),
    nome: cliente.nome === "Novo estudo" ? "" : cliente.nome,
    whats: cliente.telefone ?? "",
    email: cliente.email ?? "",
    profissao: cliente.profissao ?? "",
    estadoCivil: cliente.estadoCivil ?? ESTUDO_VAZIO.estadoCivil,
    sexo: cliente.sexo === "M" || cliente.sexo === "F" ? cliente.sexo : ESTUDO_VAZIO.sexo,
  };

  const estudo = await prisma.estudo.create({
    data: { clienteId, corretorId: corretor.id, status: "aberto", dados: dadosIniciais as object },
  });

  await prisma.$transaction([
    prisma.cliente.update({ where: { id: clienteId }, data: { estagioFunil: "estudo", estagioAtualizadoEm: new Date() } }),
    prisma.eventoHistorico.create({
      data: { clienteId, corretorId: corretor.id, tipo: "sistema", texto: "Estudo iniciado pelo corretor." },
    }),
  ]);

  revalidatePath(`/painel/clientes/${clienteId}`);
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

/**
 * Botão "Gerar textos" (tela do estudo, etapa Resultado) — pede pro n8n escrever "Resumo para o
 * cliente" e "Análise interna" a partir dos números já calculados. Diferente dos outros
 * webhooks (lead, agendar, notificar, esquecer — dispare e esqueça): este espera resposta, porque
 * o texto que ele devolve é o que aparece na tela. `analiseInterna` é gravada aqui mas nunca sai
 * daqui — não entra em `carregarSaida`/apresentação/proposta/e-mail em nenhuma hipótese
 * (não-negociável).
 *
 * Best-effort igual aos outros: sem URL configurada, ou se o n8n não responder, devolve um erro
 * pra tela mostrar — nunca lança exceção que derrubaria a etapa Resultado inteira.
 */
export async function gerarTextosEstudo(estudoId: string) {
  const estudo = await prisma.estudo.findUniqueOrThrow({ where: { id: estudoId } });
  if (estudo.status !== "aberto") throw new Error("Este estudo já virou Mapa da Proteção — os textos travaram junto com o snapshot.");

  const corretor = await obterCorretorAtual();
  if (!corretor.integracaoIaAtiva) {
    return { sucesso: false as const, erro: "A integração de IA está desligada em Ajustes → Acesso e Integrações." };
  }

  const fatoresDb = await prisma.fatoresCalculo.findUniqueOrThrow({ where: { corretorId: corretor.id } });
  const dados = paraEstudoFormulario(estudo.dados);
  const c = calc(dados, paraFatoresCalc(fatoresDb), new Date());

  const payload = {
    perfil: { nome: dados.nome, nasc: dados.nasc, sexo: dados.sexo, estadoCivil: dados.estadoCivil, profissao: dados.profissao },
    dependentes: dados.temDep ? dados.deps.map((d) => ({ nome: d.nome, nasc: d.nasc, rel: d.rel })) : [],
    numeros: {
      rendaMensal: c.rendaMensal,
      rendaFamiliar: c.rendaFamiliar,
      participacao: c.participacao,
      vitalicia: c.vitalicia,
      temporaria: c.temporaria,
      pensaoMensal: c.pensaoMensal,
      custoEducacaoTotal: c.custoEducacaoTotal,
      capitalAProteger: c.capitalAProteger,
      invalidezAcidente: c.invalidezAcidente,
      invalidezDoenca: c.invalidezDoenca,
      rendaInvalidezVitalicia: c.rendaInvalidezVitalicia,
      dit: c.dit,
      doencasGraves: c.doencasGraves,
    },
  };

  const r = await dispararWebhookComResposta<{ cliente?: string[]; interna?: string[] }>(corretor.webhookGerarTexto, payload);
  if (!r.ok) return { sucesso: false as const, erro: r.erro };

  const cliente = Array.isArray(r.dados.cliente) ? r.dados.cliente : [];
  const interna = Array.isArray(r.dados.interna) ? r.dados.interna : [];
  if (!cliente.length && !interna.length) return { sucesso: false as const, erro: "O webhook respondeu, mas sem os parágrafos esperados (campos cliente/interna)." };

  await prisma.estudo.update({ where: { id: estudoId }, data: { resumoParaVoce: cliente.join("\n"), analiseInterna: interna.join("\n") } });
  revalidatePath(`/estudo/${estudoId}`);
  return { sucesso: true as const, cliente, interna };
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
  const dados = paraEstudoFormulario(estudo.dados);
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
        // Trava junto com o snapshot — cópia do que o estudo tinha no momento de gerar (decisão
        // 7 do README do handoff). Se o corretor regenerar os textos depois com um "Duplicar",
        // o estudo novo já nasce com esta mesma cópia (dados: estudo.dados via
        // paraEstudoFormulario) e pode gerar textos de novo à vontade, sem tocar neste Mapa.
        resumoParaVoce: estudo.resumoParaVoce,
        analiseInterna: estudo.analiseInterna,
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

/**
 * Duplicar: único caminho de correção depois que o Mapa foi gerado. Copia todas as respostas
 * pra um estudo novo, em aberto — o mapa anterior continua intacto e visível no histórico do
 * cliente. Porta de `efeitosDup` em Ciclo do Estudo.dc.html: "o estudo novo nasce com todas as
 * respostas ... e volta a recalcular com os fatores atuais".
 */
export async function duplicarEstudo(estudoId: string) {
  const estudo = await prisma.estudo.findUniqueOrThrow({ where: { id: estudoId } });
  if (estudo.status !== "gerado") {
    throw new Error("Só faz sentido duplicar um estudo que já virou Mapa da Proteção.");
  }

  const novoEstudo = await prisma.estudo.create({
    data: {
      clienteId: estudo.clienteId,
      corretorId: estudo.corretorId,
      status: "aberto",
      duplicadoDeEstudoId: estudo.id,
      // mesmas respostas; recalcula com os fatores atuais a partir daqui. Passa por
      // paraEstudoFormulario (não copia o JSON cru) — um `dados` incompleto no estudo original
      // (visto de verdade em cliente de teste antigo, `dados: {}`) faria o estudo duplicado
      // nascer quebrado e derrubar calc() ao abrir. Ver o comentário em paraEstudoFormulario.
      dados: paraEstudoFormulario(estudo.dados) as object,
    },
  });

  await prisma.eventoHistorico.create({
    data: {
      clienteId: estudo.clienteId,
      corretorId: estudo.corretorId,
      tipo: "sistema",
      texto: "Estudo duplicado para correção — novo estudo em aberto.",
    },
  });

  revalidatePath(`/painel/clientes/${estudo.clienteId}`);
  redirect(`/estudo/${novoEstudo.id}`);
}

export interface AnexosEmail {
  resumo: boolean;
  a4: boolean;
  slides: boolean;
  ia: boolean;
}

/**
 * Botão "Enviar agora" do compositor de e-mail — dispara `webhookEnviarMapa`. O app nunca manda
 * e-mail direto (não-negociável); o n8n é quem tem o remetente/domínio verificado e decide como
 * montar a mensagem. `anexos.ia` controla só se o "Resumo para o cliente" entra no corpo — a
 * análise interna **nunca** faz parte deste payload, em nenhuma hipótese, mesmo que
 * `Mapa.analiseInterna` exista no banco.
 */
export async function enviarMapaPorEmail(estudoId: string, destinatario: string, assunto: string, anexos: AnexosEmail) {
  if (!destinatario.trim()) return { sucesso: false as const, erro: "Informe o e-mail do destinatário." };

  const { mapa, r, corretor } = await carregarSaida(estudoId);
  if (!corretor.integracaoEmailAtiva) {
    return { sucesso: false as const, erro: "A integração de e-mail está desligada em Ajustes → Acesso e Integrações." };
  }

  const payload = {
    destinatario: destinatario.trim(),
    assunto: assunto.trim() || r.assuntoPadrao,
    corpo: {
      nome: r.nome,
      totalVida: r.totalVida,
      vitalicia: r.vitalicia,
      temporaria: r.temporaria,
      pensaoMensal: r.pensaoMensal,
      categorias: r.categorias,
      resumoParaOCliente: anexos.ia && mapa.resumoParaVoce ? mapa.resumoParaVoce.split("\n").filter(Boolean) : null,
    },
    anexos: { a4: anexos.a4, slides: anexos.slides, resumoNoCorpoAtivo: anexos.resumo },
    anexoNome: r.anexoNome,
    corretor: { nome: r.corretorNome, contato: r.corretorContato },
  };

  const resultado = await dispararWebhookComResposta(corretor.webhookEnviarMapa, payload);
  if (!resultado.ok) return { sucesso: false as const, erro: resultado.erro };

  await prisma.eventoHistorico.create({
    data: { clienteId: mapa.clienteId, corretorId: corretor.id, tipo: "sistema", texto: `E-mail do mapa enviado para ${destinatario.trim()}.` },
  });
  revalidatePath(`/painel/clientes/${mapa.clienteId}`);

  return { sucesso: true as const };
}
