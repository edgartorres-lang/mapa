import type { Corretor } from "@prisma/client";
import type { CalcResultado } from "./calc";
import type { EstudoFormulario } from "./estudo-formulario";
import { brl, brlCurto, idadeDe, primeiroNome } from "./formato";

/**
 * Monta o objeto de apresentação (`r`) consumido pelas três saídas — porta fiel do trecho final
 * de `renderVals()` em `Mapa da Proteção 1a+1b - Unificado.dc.html` (~linha 1407-1489). Único
 * lugar onde essa tradução número→texto acontece, pra apresentação/proposta/e-mail nunca
 * divergirem entre si.
 */
export function construirApresentacao(dados: EstudoFormulario, c: CalcResultado, corretor: Corretor, geradoEm: Date) {
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
      { rotulo: "Educação dos filhos", valor: brl(c.custoEducacaoTotal), cor: cores[2], largura: `${Math.round((c.custoEducacaoTotal / maxCat) * 100)}%`, nota: `referência; pago como pensão de ${brl(c.pensaoMensal)}/mês` },
      { rotulo: "Capacidade de renda", valor: brl(Math.max(c.invalidezAcidente, c.doencasGraves)), cor: cores[3], largura: `${Math.round((Math.max(c.invalidezAcidente, c.doencasGraves) / maxCat) * 100)}%`, nota: "maior entre invalidez por acidente e doenças graves" },
    ],
    necessidadeLinhas: [
      { rotulo: "Vitalícia — transmissão sucessória e um ano de renda", valor: brl(c.vitalicia) },
      { rotulo: "Temporária — padrão de vida e objetivos", valor: brl(c.temporaria) },
      { rotulo: "Educação — custo total até a formação", valor: brl(c.custoEducacaoTotal) },
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
      { rotulo: "Despesa de educação hoje", valor: `${brl(c.eduHoje)}/mês` },
    ],
    coberturas: [
      { titulo: "Vida — vitalícia (sucessão e um ano de renda)", valor: brl(c.vitalicia), nota: `${brl(c.patrimonioTotal)} de patrimônio × ${dados.pctSucessao}% de custo de transmissão = ${brl(c.modSucessao)}, mais ${brl(c.modUmAnoRenda)} de um ano de renda.` },
      { titulo: `Vida — temporária (padrão de vida por ${dados.prazoManutencao} anos)`, valor: brl(c.temporaria), nota: c.temDep ? `${brl(c.rendaEquiv)} de renda ajustada × ${Math.round(c.participacao * 100)}% de participação × ${dados.prazoManutencao * 12} meses, menos ${brl(c.receitasLiquidaveis)} de receitas liquidáveis${c.modObjetivos ? `, mais ${brl(c.modObjetivos)} de projetos e objetivos` : ""}.` : "Sem dependentes financeiros; entra apenas o valor de projetos e objetivos." },
      { titulo: "Pensão por morte — educação", valor: `${brl(c.pensaoMensal)}/mês`, nota: c.pensaoMensal > 0 ? `${brl(c.custoEducacaoTotal)} de custo educacional × ${Math.round(c.fatorPensao * 100)}% de fator de pensão × ${Math.round(c.participacao * 100)}% de participação, diluídos em ${c.prazoPensao} anos. Média sem diluição: ${brl(c.mediaAteFormar)}/mês até a formação.` : "Sem planejamento educacional informado." },
      { titulo: "Invalidez total por acidente", valor: brl(c.invalidezAcidente), nota: `5 anos de renda (${brl(c.rendaMensal)} × 12 × 5).` },
      { titulo: "Invalidez por doença", valor: brl(c.invalidezDoenca), nota: "50% do capital de invalidez por acidente." },
      { titulo: "Renda vitalícia por invalidez", valor: c.rendaInvalidezVitalicia > 0 ? `${brl(c.rendaInvalidezVitalicia)}/mês` : "não se aplica", nota: c.rendaInvalidezVitalicia > 0 ? "50% da renda mensal, contínua." : "Servidor público já recebe aposentadoria por invalidez pelo RPPS." },
      { titulo: "Diária por incapacidade temporária (DIT)", valor: `${brl(c.dit)}/mês`, nota: "70% da renda mensal enquanto durar o afastamento." },
      { titulo: "Doenças graves", valor: brl(c.doencasGraves), nota: "1,5 × a renda anual, pago no diagnóstico, para tratar sem consumir reservas." },
    ],

    premissas: [
      { rotulo: "Renda bruta mensal do segurado", valor: brl(c.rendaMensal) },
      { rotulo: "Renda ajustada pelo fator de vínculo", valor: brl(c.rendaEquiv) },
      { rotulo: "Renda familiar total considerada", valor: brl(c.rendaFamiliar) },
      { rotulo: "Participação do segurado na renda", valor: `${Math.round(c.participacao * 100)}%` },
      { rotulo: "Fator de pensão aplicado", valor: `${Math.round(c.fatorPensao * 100)}%` },
      { rotulo: "Prazo de manutenção de padrão de vida", valor: `${dados.prazoManutencao} anos` },
      { rotulo: "Prazo da pensão por morte", valor: `${c.prazoPensao} anos` },
      { rotulo: "Teto de razoabilidade", valor: `${dados.teto}× a renda anual (${brl(c.teto)})` },
      { rotulo: "Custo de transmissão sucessória", valor: `${dados.pctSucessao}% de ${brl(c.patrimonioTotal)}` },
      { rotulo: "Custo educacional total", valor: brl(c.custoEducacaoTotal) },
      { rotulo: "Receitas liquidáveis abatidas", valor: brl(c.receitasLiquidaveis) },
    ],

    dependentes: dependentesTexto,
    slide2Titulo: `${dependentesTexto.length || 1} ${dependentesTexto.length === 1 ? "pessoa vive dessa renda." : "pessoas vivem dessa renda."}`,
    slide2Nota: ativos.includes("autonomo")
      ? "Parte da renda vem de trabalho autônomo: sem afastamento pago, sem pensão automática. É a família que absorve a queda."
      : `A rotina da casa está apoiada nessa renda, que responde por ${Math.round(c.participacao * 100)}% do total familiar.`,

    corretorNome: corretor.nome,
    corretorCargo: corretor.cargo || "Consultor de proteção familiar",
    corretorContato: [corretor.whatsapp, corretor.emailContato].filter(Boolean).join(" · "),
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
