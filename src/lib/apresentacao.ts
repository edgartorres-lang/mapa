import type { Corretor, FatoresCalculo as FatoresCalculoDb } from "@prisma/client";
import type { CalcResultado } from "./calc";
import type { EstudoFormulario } from "./estudo-formulario";
import { brl, brlCurto, idadeDe, linkWhatsapp, primeiroNome } from "./formato";
import { notaPensaoCriacao, notaTemporaria } from "./notas-calculo";

/**
 * Monta o objeto de apresentação (`r`) consumido pelas três saídas — porta fiel do trecho final
 * de `renderVals()` em `Mapa da Proteção 1a+1b - Unificado.dc.html` (~linha 1407-1489). Único
 * lugar onde essa tradução número→texto acontece, pra apresentação/proposta/e-mail nunca
 * divergirem entre si.
 *
 * `fatoresDb` vem do snapshot travado em `Mapa.fatoresUsados` (nunca dos fatores atuais do
 * corretor) — os textos de invalidez/DIT/doenças graves citam prazo e percentual reais, não
 * fixos, mas ainda assim os do momento em que o Mapa foi gerado, igual a todo o resto da saída.
 */
export function construirApresentacao(
  dados: EstudoFormulario,
  c: CalcResultado,
  corretor: Corretor,
  geradoEm: Date,
  fatoresDb: Pick<FatoresCalculoDb, "anosInvalidez" | "pctDit" | "fatorDoencasGraves">,
) {
  const idadeC = idadeDe(dados.nasc, geradoEm);
  const cores = ["#0F3D63", "#1B72BE", "#39CC00", "#D9A400"];
  const maxCat = Math.max(c.vitalicia, c.temporaria, c.custoEducacaoTotal, Math.max(c.invalidezAcidente, c.doencasGraves), 1);
  const largProt = c.necessidadeMorte > 0 ? Math.min(100, Math.round((c.receitasLiquidaveis / c.necessidadeMorte) * 100)) : 0;
  const excedente = c.capitalAProteger < 0;

  // "dependentes" aqui é a lista completa (não só filhos) — mesma fonte que o cabeçalho usa.
  const dependentesTexto = dados.temDep
    ? dados.deps
        .filter((d) => (d.nome || "").trim() && idadeDe(d.nasc, geradoEm) !== null)
        .map((d, i) => ({
          texto: `${primeiroNome(d.nome)}, ${Math.floor(idadeDe(d.nasc, geradoEm)!)} anos · ${d.rel}`,
          cor: cores[i % 4],
        }))
        .slice(0, 4)
    : [];

  const filhos = dados.temDep ? dados.deps.filter((d) => d.rel === "Filho(a)" && idadeDe(d.nasc, geradoEm) !== null) : [];
  const ativos: string[] = [];
  if (dados.vinculos.clt.on && dados.vinculos.clt.renda > 0) ativos.push("clt");
  if (dados.vinculos.servidor.on && dados.vinculos.servidor.renda > 0) ativos.push("servidor");
  if (dados.vinculos.autonomo.on && dados.vinculos.autonomo.renda > 0) ativos.push("autonomo");

  const rodapeLegal = corretor.razaoSocial || `${corretor.corretora ?? "Setor Norte Seguros"} · ${corretor.susep ?? ""}`;

  // Resumo para o cliente (5 frases) — porta fiel de `textos(c).cliente` em
  // "Wizard 1a - Protótipo funcional v3.dc.html" (~linha 1265). É texto determinístico, gerado
  // só a partir dos números já calculados — nunca chamou IA nem webhook nenhum, no protótipo ou
  // aqui. Fica sempre visível na apresentação (slide "Resumo para o cliente"), diferente da tela
  // do estudo, onde o mesmo rótulo ainda fica atrás do botão "Gerar" (stub da Etapa 5/Ajustes,
  // não mexido aqui — ver AGENTS.md).
  const primeiroNomeCliente = primeiroNome(dados.nome) || "Você";
  const vincTexto = ativos.map((a) => (a === "clt" ? "CLT" : a === "servidor" ? "servidor público" : "autônomo")).join(" e ");
  const participacaoTexto = `${Math.round(c.participacao * 100)}%`;

  // Abertura pessoal (1-2 frases, sem valor nenhum) — vem logo depois do "Ponto de partida" na
  // apresentação (slide 3), antes de qualquer número. É a versão curta e calorosa do que o
  // "Resumo para o cliente" completo (abaixo) já conta em detalhe lá pela metade da apresentação;
  // a decisão de manter as duas, cada uma no seu lugar, em vez de só mover o resumo completo pra
  // cá, foi pra não citar valores (ex.: "sua parte vitalícia é R$X") antes dos slides que
  // introduzem e explicam cada um desses valores.
  const nomesFilhos = filhos.map((f) => primeiroNome(f.nome)).filter(Boolean);
  const filhosPlural = nomesFilhos.length > 1;
  const listaFilhos = filhosPlural
    ? `${nomesFilhos.slice(0, -1).join(", ")} e ${nomesFilhos[nomesFilhos.length - 1]}`
    : (nomesFilhos[0] ?? "");
  const aberturaPessoal =
    nomesFilhos.length > 0
      ? `${primeiroNomeCliente}, este estudo existe por um motivo simples: garantir que ${listaFilhos} continue${filhosPlural ? "m" : ""} com a vida que ${filhosPlural ? "têm" : "tem"} hoje, não importa o que aconteça com você.`
      : dados.temDep
        ? `${primeiroNomeCliente}, este estudo existe por um motivo simples: garantir que quem depende de você não perca o chão, não importa o que aconteça.`
        : `${primeiroNomeCliente}, este estudo existe por um motivo simples: garantir que tudo que você construiu continue de pé, não importa o que aconteça.`;

  const resumoParaOCliente = [
    `${primeiroNomeCliente}, a sua renda de ${brl(c.rendaMensal)} por mês vem de ${vincTexto || "trabalho"} e representa ${participacaoTexto} da renda da casa, que hoje soma ${brl(c.rendaFamiliar)}. Essa participação é o que define o tamanho da proteção: o seguro cobre a fatia que depende de você, não o total da família.`,
    `A parte vitalícia, de ${brl(c.vitalicia)}, existe porque patrimônio não vira dinheiro no dia seguinte. São ${brl(c.modSucessao)} de custo de transmissão sobre ${brl(c.patrimonioTotal)} em bens, mais um ano da sua renda para a família atravessar o inventário sem vender nada às pressas.`,
    c.temDep
      ? `A parte temporária, de ${brl(c.temporaria)}, substitui sua renda ajustada de ${brl(c.rendaEquiv)} por ${dados.prazoManutencao} anos — o tempo pra família se reorganizar sem precisar mudar de vida da noite pro dia${c.modObjetivos > 0 ? `, mais ${brl(c.modObjetivos)} dos projetos que você listou` : ""}. Dela já foram descontados ${brl(c.receitasLiquidaveis)} de patrimônio liquidável, FGTS, INSS, previdência e seguro atual.`
      : "Sem dependentes financeiros informados, a manutenção de padrão de vida não entra neste estudo.",
    c.custoEducacaoTotal > 0
      ? `Os estudos somam ${brl(c.custoEducacaoTotal)} até o fim da formação, o equivalente a ${brl(c.mediaAteFormar)} por mês de média até ${filhos.length > 1 ? "os filhos se formarem" : "a formatura"}. Contratada como pensão por ${c.prazoPensao} anos, a mensalidade cobre a sua fatia disso — ${Math.round(c.participacao * 100)}% do custo, na mesma proporção da sua participação na renda da casa${c.fatorPensao < 1 ? ", com um abatimento a mais porque parte da sua renda já garante pensão automática pelo RPPS" : ""} — e fica em ${brl(c.pensaoMensal)}/mês, chegando quando a mensalidade vence, sem depender de alguém administrar um valor grande num momento difícil.`
      : "Nenhum custo de criação foi informado, então a pensão de criação não entra neste estudo.",
    `Além da morte, o estudo dimensiona invalidez em ${brl(c.invalidezAcidente)} por acidente (${brl(c.invalidezDoenca)} por doença), doenças graves em ${brl(c.doencasGraves)} e ${brl(c.dit)} por mês de diária por incapacidade temporária. São eventos que interrompem a renda sem interromper as despesas.`,
  ];

  return {
    nome: dados.nome || "Cliente sem nome",
    subtitulo: [
      dados.profissao || null,
      idadeC !== null ? `${Math.floor(idadeC)} anos` : null,
      dados.estadoCivil || null,
      ativos.length ? ativos.map((a) => (a === "clt" ? "CLT" : a === "servidor" ? "servidor público" : "autônomo")).join(" + ") : null,
      filhos.length ? filhos.map((f) => `${primeiroNome(f.nome)} (${Math.floor(idadeDe(f.nasc, geradoEm)!)})`).join(" e ") : null,
    ]
      .filter(Boolean)
      .join(" · "),
    dataCurta: geradoEm.toLocaleDateString("pt-BR"),
    dataLonga: geradoEm.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),

    rendaMensal: brl(c.rendaMensal),
    rendaNota: `por mês · ${Math.round(c.participacao * 100)}% da renda da casa`,

    totalVida: brlCurto(c.totalVida),
    vitalicia: brlCurto(c.vitalicia),
    temporaria: brlCurto(c.temporaria),
    pensaoMensal: brl(c.pensaoMensal),

    necessidade: brlCurto(c.necessidadeMorte),
    protegido: brlCurto(c.receitasLiquidaveis),
    aProteger: brlCurto(Math.abs(c.capitalAProteger)),
    rotuloFalta: excedente ? "Capital excedente" : "Capital a proteger",
    larguraProtegido: `${largProt}%`,

    tetoAtingido: c.tetoAtingido,
    tetoAviso: `A necessidade líquida de ${brl(c.necessidadeLiquida)} ultrapassou o teto de razoabilidade de ${dados.teto}× a renda anual (${brl(c.teto)}). O valor apresentado está limitado ao teto.`,

    categorias: [
      { rotulo: "Proteção vitalícia", valor: brl(c.vitalicia), cor: cores[0], largura: `${Math.round((c.vitalicia / maxCat) * 100)}%`, nota: `${brl(c.modSucessao)} de transmissão + 1 ano de renda` },
      { rotulo: "Proteção temporária", valor: brl(c.temporaria), cor: cores[1], largura: `${Math.round((c.temporaria / maxCat) * 100)}%`, nota: `${dados.prazoManutencao} anos de padrão de vida${c.modObjetivos ? ` + ${brl(c.modObjetivos)} de objetivos` : ""}` },
      { rotulo: "Pensão de Criação", valor: brl(c.custoEducacaoTotal), cor: cores[2], largura: `${Math.round((c.custoEducacaoTotal / maxCat) * 100)}%`, nota: `referência; pago como pensão de ${brl(c.pensaoMensal)}/mês` },
      { rotulo: "Capacidade de renda", valor: brl(Math.max(c.invalidezAcidente, c.doencasGraves)), cor: cores[3], largura: `${Math.round((Math.max(c.invalidezAcidente, c.doencasGraves) / maxCat) * 100)}%`, nota: "maior entre invalidez por acidente e doenças graves" },
    ],
    necessidadeLinhas: [
      { rotulo: "Vitalícia — transmissão sucessória e um ano de renda", valor: brl(c.vitalicia) },
      { rotulo: "Temporária — padrão de vida e objetivos", valor: brl(c.temporaria) },
      { rotulo: "Pensão de Criação — custo total de criar o(s) filho(s)", valor: brl(c.custoEducacaoTotal) },
    ],
    protegidoLinhas: [
      { rotulo: "Patrimônio liquidável", valor: brl(c.patrimonioLiquidavel) },
      { rotulo: "Saldo FGTS", valor: brl(dados.fgts) },
      { rotulo: "Acumulado INSS/outros", valor: brl(dados.inss) },
      { rotulo: "Previdência privada", valor: brl(dados.prevPrivada) },
      { rotulo: "Seguro de vida existente", valor: brl(dados.seguroAtual) },
    ],
    notasContexto: [
      { rotulo: "Renda do segurado", valor: `${brl(c.rendaMensal)}/mês` },
      { rotulo: "Renda familiar total", valor: `${brl(c.rendaFamiliar)}/mês` },
      { rotulo: "Participação do segurado", valor: `${Math.round(c.participacao * 100)}%` },
      { rotulo: "Patrimônio declarado", valor: brl(c.patrimonioTotal) },
      { rotulo: "Despesa de criação hoje", valor: `${brl(c.eduHoje)}/mês` },
    ],
    coberturas: [
      { titulo: "Vida — vitalícia (sucessão e um ano de renda)", valor: brl(c.vitalicia), nota: `${brl(c.patrimonioTotal)} de patrimônio × ${dados.pctSucessao}% de custo de transmissão = ${brl(c.modSucessao)}, mais ${brl(c.modUmAnoRenda)} de um ano de renda.` },
      { titulo: `Vida — temporária (padrão de vida por ${dados.prazoManutencao} anos)`, valor: brl(c.temporaria), nota: notaTemporaria(c, dados.prazoManutencao) },
      { titulo: "Pensão de Criação", valor: `${brl(c.pensaoMensal)}/mês`, nota: c.pensaoMensal > 0 ? notaPensaoCriacao(c) : "Sem plano de criação informado." },
      { titulo: "Invalidez total por acidente", valor: brl(c.invalidezAcidente), nota: `${fatoresDb.anosInvalidez} anos de renda (${brl(c.rendaMensal)} × 12 × ${fatoresDb.anosInvalidez}).` },
      { titulo: "Invalidez por doença", valor: brl(c.invalidezDoenca), nota: "50% do capital de invalidez por acidente." },
      { titulo: "Renda vitalícia por invalidez", valor: c.rendaInvalidezVitalicia > 0 ? `${brl(c.rendaInvalidezVitalicia)}/mês` : "não se aplica", nota: c.rendaInvalidezVitalicia > 0 ? "50% da renda mensal, contínua." : "Servidor público já recebe aposentadoria por invalidez pelo RPPS." },
      { titulo: "Diária por incapacidade temporária (DIT)", valor: `${brl(c.dit)}/mês`, nota: `${Math.round(fatoresDb.pctDit)}% da renda mensal enquanto durar o afastamento.` },
      { titulo: "Doenças graves", valor: brl(c.doencasGraves), nota: `${String(fatoresDb.fatorDoencasGraves).replace(".", ",")} × a renda anual, pago no diagnóstico, para tratar sem consumir reservas.` },
    ],

    premissas: [
      { rotulo: "Renda bruta mensal do segurado", valor: brl(c.rendaMensal) },
      { rotulo: "Renda ajustada pelo fator de vínculo", valor: brl(c.rendaEquiv) },
      { rotulo: "Renda familiar total considerada", valor: brl(c.rendaFamiliar) },
      { rotulo: "Participação do segurado na renda", valor: `${Math.round(c.participacao * 100)}%` },
      { rotulo: "Fator de pensão aplicado", valor: `${Math.round(c.fatorPensao * 100)}%` },
      { rotulo: "Prazo de manutenção de padrão de vida", valor: `${dados.prazoManutencao} anos` },
      { rotulo: "Prazo da Pensão de Criação", valor: `${c.prazoPensao} anos` },
      { rotulo: "Teto de razoabilidade", valor: `${dados.teto}× a renda anual (${brl(c.teto)})` },
      { rotulo: "Custo de transmissão sucessória", valor: `${dados.pctSucessao}% de ${brl(c.patrimonioTotal)}` },
      { rotulo: "Custo de criação total", valor: brl(c.custoEducacaoTotal) },
      { rotulo: "Receitas liquidáveis abatidas", valor: brl(c.receitasLiquidaveis) },
    ],

    aberturaPessoal,
    resumoParaOCliente,

    dependentes: dependentesTexto,
    slide2Titulo: `${dependentesTexto.length || 1} ${dependentesTexto.length === 1 ? "pessoa vive dessa renda." : "pessoas vivem dessa renda."}`,
    slide2Nota: ativos.includes("autonomo")
      ? "Parte da renda vem de trabalho autônomo: sem afastamento pago, sem pensão automática. É a família que absorve a queda."
      : `A rotina da casa está apoiada nessa renda, que responde por ${Math.round(c.participacao * 100)}% do total familiar.`,

    corretorNome: corretor.nome,
    corretorCargo: corretor.cargo || "Consultor de proteção familiar",
    corretorContato: [corretor.whatsapp, corretor.emailContato].filter(Boolean).join(" · "),
    whatsappLink: linkWhatsapp(corretor.whatsapp),
    corretora: corretor.corretora || "Setor Norte Seguros",
    susep: corretor.susep || "",
    rodapeLegal,
    fotoUrl: corretor.fotoUrl,
    logoClaroUrl: corretor.logoClaroUrl,
    logoEscuroUrl: corretor.logoEscuroUrl,
    anexoNome: `Mapa_de_Protecao_${(dados.nome || "Cliente").trim().replace(/\s+/g, "_")}.pdf`,
    assuntoPadrao: `${primeiroNome(dados.nome) || "Olá"}, seu mapa de proteção está pronto`,
  };
}

export type Apresentacao = ReturnType<typeof construirApresentacao>;
