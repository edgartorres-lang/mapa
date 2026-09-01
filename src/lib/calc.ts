/**
 * Motor de cálculo do estudo de necessidades de seguro de vida.
 *
 * Porta fiel do método `calc()` em
 * `Mapa da Proteção 1a+1b - Unificado.dc.html` (protótipo de referência, ~linha 1101).
 * Não altere as fórmulas aqui sem reconferir contra o protótipo — ele é a fonte da verdade
 * do racional, não este arquivo. Ver ESPECIFICACAO.md e README.md do handoff de design.
 *
 * Convenção: nada aqui lê relógio do sistema por padrão de produção — a data de referência
 * ("hoje") é sempre um parâmetro explícito, para o cálculo ser determinístico e testável.
 */

export type VinculoKey = "clt" | "servidor" | "autonomo";

export interface VinculoInput {
  on: boolean;
  renda: number;
}

export interface TerceiroInput {
  desc?: string;
  valor: number;
  incluir: boolean;
}

export type RelacaoDependente = "Filho(a)" | "Cônjuge" | "Pai/Mãe" | "Outro";

export interface DependenteInput {
  nome: string;
  /** dd/mm/aaaa, igual ao protótipo */
  nasc: string;
  rel: RelacaoDependente;
}

export interface ExtraInput {
  nome?: string;
  valor: number;
  /** anos fixos (1–10) ou 0 para "tempo indeterminado" (até o mais novo completar 25) */
  prazo: number;
}

export interface ObjetivoInput {
  desc?: string;
  valor: number;
  incluir: boolean;
}

export interface BemInput {
  desc?: string;
  tipo?: string;
  valor: number;
  liquidavel: boolean;
}

export interface EducacaoFases {
  pre: number;
  fund: number;
  medio: number;
  sup: number;
  pos: number;
}

/** Entradas cruas do estudo — o que fica persistido em `Estudo.dados`. Nada derivado aqui. */
export interface EstudoDados {
  nasc: string;
  estadoCivil: string;
  vinculos: Record<VinculoKey, VinculoInput>;
  rendaConjuge: number;
  incluirConjuge: boolean;
  terceiros: TerceiroInput[];
  temDep: boolean;
  deps: DependenteInput[];
  planoEdu: boolean;
  edu: EducacaoFases;
  extras: ExtraInput[];
  prazoManutencao: number;
  prazoPensao: number;
  /** múltiplo da renda anual */
  teto: number;
  objetivos: ObjetivoInput[];
  bens: BemInput[];
  /** % de custo de transmissão sucessória, ex.: 15 */
  pctSucessao: number;
  fgts: number;
  inss: number;
  prevPrivada: number;
  seguroAtual: number;
}

/** Fatores editáveis por corretor (tela Ajustes → Fatores de cálculo). */
export interface FatoresCalculo {
  fatorAutonomo: number;
  fatorPensaoServidor: number;
  anosInvalidez: number;
  fatorDoencasGraves: number;
  /** ex.: 0.7 para 70% */
  fatorDIT: number;
}

export const FATORES_PADRAO: FatoresCalculo = {
  fatorAutonomo: 1.25,
  fatorPensaoServidor: 0.6,
  anosInvalidez: 5,
  fatorDoencasGraves: 1.5,
  fatorDIT: 0.7,
};

interface VinculoDef {
  k: VinculoKey;
  fator: number;
  fpensao: number;
  invalidez: boolean;
}

// Fatores fixos por vínculo (CLT e servidor são travados a 1,00 no protótipo — só autônomo e
// o fator de pensão do servidor são editáveis, e entram via `fatores` abaixo).
const VINC: VinculoDef[] = [
  { k: "clt", fator: 1.0, fpensao: 1.0, invalidez: true },
  { k: "servidor", fator: 1.0, fpensao: 0.6, invalidez: false },
  { k: "autonomo", fator: 1.25, fpensao: 1.0, invalidez: true },
];

interface FaseDef {
  k: keyof EducacaoFases;
  a0: number;
  a1: number;
}

export const FASES: FaseDef[] = [
  { k: "pre", a0: 1, a1: 5 },
  { k: "fund", a0: 6, a1: 14 },
  { k: "medio", a0: 15, a1: 17 },
  { k: "sup", a0: 18, a1: 22 },
  { k: "pos", a0: 23, a1: 24 },
];

/**
 * Idade fracionária a partir de uma data "dd/mm/aaaa", contra uma data de referência.
 * Retorna null se a string não é uma data válida ou a idade é implausível (<0 ou >110).
 */
export function idadeDe(str: string, hoje: Date): number | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((str || "").trim());
  if (!m) return null;
  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  if (isNaN(d.getTime())) return null;
  const anos = (hoje.getTime() - d.getTime()) / (365.2425 * 24 * 3600 * 1000);
  if (anos < 0 || anos > 110) return null;
  return anos;
}

export interface CalcResultado {
  rendaMensal: number;
  rendaAnual: number;
  rendaEquiv: number;
  fatorPensao: number;
  invalidezAplicavel: boolean;
  rendaConjugeIncl: number;
  terceirosIncl: number;
  rendaFamiliar: number;
  participacao: number;

  temDep: boolean;
  quantidadeFilhos: number;
  maisNovo: number | null;
  anosAte25: number;

  custoEducacaoTotal: number;
  eduHoje: number;
  mediaAteFormar: number;

  patrimonioTotal: number;
  patrimonioLiquidavel: number;
  modSucessao: number;
  modUmAnoRenda: number;
  vitalicia: number;

  receitasLiquidaveis: number;

  necessidadeBruta: number;
  necessidadeLiquida: number;
  teto: number;
  modManutencao: number;
  tetoAtingido: boolean;
  modObjetivos: number;
  temporaria: number;
  totalVida: number;

  prazoPensao: number;
  pensaoMensal: number;

  invalidezAcidente: number;
  invalidezDoenca: number;
  rendaInvalidezVitalicia: number;
  dit: number;
  doencasGraves: number;

  necessidadeMorte: number;
  /** "Capital a proteger" do glossário. Se negativo, a UI mostra "Capital excedente" com o valor absoluto. */
  capitalAProteger: number;
}

export function calc(
  d: EstudoDados,
  fatores: FatoresCalculo = FATORES_PADRAO,
  hoje: Date = new Date(),
): CalcResultado {
  const ativos = VINC.filter((v) => d.vinculos[v.k]?.on && d.vinculos[v.k].renda > 0).map((v) => {
    const fator = v.k === "autonomo" ? fatores.fatorAutonomo : v.fator;
    const fp = v.k === "servidor" ? fatores.fatorPensaoServidor : 1;
    const renda = d.vinculos[v.k].renda;
    return { k: v.k, renda, fator, fp, invalidez: v.invalidez, equiv: renda * fator };
  });

  const rendaMensal = ativos.reduce((a, v) => a + v.renda, 0);
  const rendaAnual = rendaMensal * 12;
  const rendaEquiv = ativos.reduce((a, v) => a + v.equiv, 0);
  const fatorPensao = rendaMensal > 0 ? ativos.reduce((a, v) => a + v.renda * v.fp, 0) / rendaMensal : 1;
  const invalidezAplicavel = ativos.length ? ativos.some((v) => v.invalidez) : true;

  const casado = d.estadoCivil === "Casado(a)" || d.estadoCivil === "União estável";
  const rendaConjugeIncl = casado && d.incluirConjuge ? d.rendaConjuge : 0;
  const terceirosIncl = d.terceiros.filter((t) => t.incluir).reduce((a, t) => a + t.valor, 0);
  const rendaFamiliar = rendaMensal + rendaConjugeIncl + terceirosIncl;
  const participacao = rendaFamiliar > 0 ? rendaMensal / rendaFamiliar : 1;

  const dependentes = d.temDep
    ? d.deps
        .filter((x) => (x.nome || "").trim() && idadeDe(x.nasc, hoje) !== null)
        .map((x) => {
          const idade = idadeDe(x.nasc, hoje)!;
          return { nome: x.nome, rel: x.rel, idade, anos: Math.floor(idade) };
        })
    : [];
  const temDep = dependentes.length > 0;
  const filhos = dependentes.filter((x) => x.rel === "Filho(a)");
  const maisNovo = filhos.length ? Math.min(...filhos.map((x) => x.idade)) : null;
  const anosAte25 = maisNovo === null ? 0 : Math.max(1, Math.ceil(25 - maisNovo));

  // Custo educacional total: por filho, por fase ainda não vencida, anos restantes na fase.
  let custoEducacaoTotal = 0;
  if (d.planoEdu) {
    for (const filho of filhos) {
      let subtotal = 0;
      for (const fase of FASES) {
        if (filho.anos <= fase.a1) {
          const anosNaFase = fase.a1 - Math.max(filho.anos, fase.a0) + 1;
          if (anosNaFase > 0) subtotal += (d.edu[fase.k] || 0) * 12 * anosNaFase;
        }
      }
      custoEducacaoTotal += subtotal;
    }
  }
  const extrasDet = d.extras
    .filter((x) => x.valor > 0)
    .map((x) => {
      const anos = x.prazo > 0 ? x.prazo : anosAte25 || 1;
      return { valor: x.valor, anos, total: x.valor * 12 * anos };
    });
  const extrasTotal = extrasDet.reduce((a, x) => a + x.total, 0);
  custoEducacaoTotal += extrasTotal;

  // Despesa de educação HOJE (diferente do total): valor da fase atual de cada filho + extras mensais.
  let eduHoje = 0;
  if (d.planoEdu) {
    for (const filho of filhos) {
      const fase = FASES.find((f) => filho.anos >= f.a0 && filho.anos <= f.a1);
      if (fase) eduHoje += d.edu[fase.k] || 0;
    }
  }
  const extrasMes = extrasDet.reduce((a, x) => a + x.valor, 0);
  eduHoje += extrasMes;
  const mediaAteFormar = anosAte25 ? custoEducacaoTotal / (anosAte25 * 12) : 0;

  // Vitalícia
  const patrimonioTotal = d.bens.reduce((a, b) => a + b.valor, 0);
  const patrimonioLiquidavel = d.bens.filter((b) => b.liquidavel).reduce((a, b) => a + b.valor, 0);
  const modSucessao = patrimonioTotal * (d.pctSucessao / 100);
  const modUmAnoRenda = rendaMensal * 12;
  const vitalicia = modSucessao + modUmAnoRenda;

  const receitasLiquidaveis = patrimonioLiquidavel + d.fgts + d.inss + d.prevPrivada + d.seguroAtual;

  // Temporária
  const prazoManut = d.prazoManutencao || 0;
  const necessidadeBruta = temDep ? rendaEquiv * participacao * prazoManut * 12 : 0;
  const necessidadeLiquida = Math.max(0, necessidadeBruta - receitasLiquidaveis);
  const teto = rendaAnual * d.teto;
  const modManutencao = teto > 0 ? Math.min(necessidadeLiquida, teto) : necessidadeLiquida;
  const tetoAtingido = teto > 0 && necessidadeLiquida > teto;
  const modObjetivos = d.objetivos.filter((o) => o.incluir).reduce((a, o) => a + o.valor, 0);
  const temporaria = temDep ? modManutencao + modObjetivos : modObjetivos;
  const totalVida = vitalicia + temporaria;

  // Pensão de educação
  const prazoPensao = d.prazoPensao || 15;
  const pensaoMensal =
    temDep && d.planoEdu && prazoPensao > 0
      ? (custoEducacaoTotal * fatorPensao * participacao) / (prazoPensao * 12)
      : 0;

  // Invalidez e complementares
  const invalidezAcidente = rendaMensal * 12 * fatores.anosInvalidez;
  const invalidezDoenca = invalidezAcidente * 0.5;
  const rendaInvalidezVitalicia = invalidezAplicavel ? rendaMensal * 0.5 : 0;
  const dit = rendaMensal * fatores.fatorDIT;
  const doencasGraves = rendaAnual * fatores.fatorDoencasGraves;

  const necessidadeMorte = vitalicia + temporaria + custoEducacaoTotal;
  const capitalAProteger = necessidadeMorte - receitasLiquidaveis;

  return {
    rendaMensal,
    rendaAnual,
    rendaEquiv,
    fatorPensao,
    invalidezAplicavel,
    rendaConjugeIncl,
    terceirosIncl,
    rendaFamiliar,
    participacao,
    temDep,
    quantidadeFilhos: filhos.length,
    maisNovo,
    anosAte25,
    custoEducacaoTotal,
    eduHoje,
    mediaAteFormar,
    patrimonioTotal,
    patrimonioLiquidavel,
    modSucessao,
    modUmAnoRenda,
    vitalicia,
    receitasLiquidaveis,
    necessidadeBruta,
    necessidadeLiquida,
    teto,
    modManutencao,
    tetoAtingido,
    modObjetivos,
    temporaria,
    totalVida,
    prazoPensao,
    pensaoMensal,
    invalidezAcidente,
    invalidezDoenca,
    rendaInvalidezVitalicia,
    dit,
    doencasGraves,
    necessidadeMorte,
    capitalAProteger,
  };
}
