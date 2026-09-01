import { describe, expect, it } from "vitest";
import { calc, FATORES_PADRAO, type EstudoDados } from "./calc";

/**
 * Caso de teste obrigatório: Marina Albuquerque.
 * Fonte: README.md ("Conferência obrigatória") + EXEMPLO em
 * `Mapa da Proteção 1a+1b - Unificado.dc.html` (~linha 1015) + `D`/`c` em
 * `Ciclo do Estudo.dc.html` (~linha 364), do handoff de design.
 *
 * "hoje" é fixado em 31/08/2026 só para as idades dos filhos caírem em 14 e 11 anos completos,
 * que é o que os documentos de referência assumem. Qualquer data entre 15/03/2026 e 29/10/2026
 * dá o mesmo resultado (o cálculo usa idade em anos completos, não a data exata).
 */
const HOJE_MARINA = new Date(2026, 7, 31); // 31/08/2026

const ESTUDO_MARINA: EstudoDados = {
  nasc: "12/07/1983",
  estadoCivil: "Casado(a)",
  vinculos: {
    clt: { on: true, renda: 6000 },
    servidor: { on: false, renda: 0 },
    autonomo: { on: true, renda: 9000 },
  },
  rendaConjuge: 4000,
  incluirConjuge: true,
  terceiros: [{ desc: "Aluguel de sala comercial", valor: 2000, incluir: true }],
  temDep: true,
  deps: [
    { nome: "Theo", nasc: "30/10/2011", rel: "Filho(a)" },
    { nome: "João", nasc: "14/03/2015", rel: "Filho(a)" },
  ],
  planoEdu: true,
  edu: { pre: 0, fund: 2000, medio: 2500, sup: 3200, pos: 0 },
  extras: [
    { nome: "Curso de inglês", valor: 600, prazo: 3 },
    { nome: "Natação", valor: 320, prazo: 0 }, // indeterminado
  ],
  prazoManutencao: 5,
  prazoPensao: 15,
  teto: 8,
  objetivos: [{ desc: "Quitar empréstimo pessoal", valor: 40000, incluir: true }],
  bens: [
    { desc: "Casa onde a família mora", tipo: "Imóvel", valor: 750000, liquidavel: false },
    { desc: "Apartamento alugado", tipo: "Imóvel", valor: 350000, liquidavel: false },
    { desc: "Fundo de renda fixa", tipo: "Investimento", valor: 90000, liquidavel: true },
  ],
  pctSucessao: 15,
  fgts: 25000,
  inss: 80000,
  prevPrivada: 45000,
  seguroAtual: 150000,
};

describe("calc() — caso da Marina (conferência obrigatória do README)", () => {
  const r = calc(ESTUDO_MARINA, FATORES_PADRAO, HOJE_MARINA);

  it("despesa de educação hoje = R$ 4.920/mês", () => {
    // 2.000 (Theo, fundamental) + 2.000 (João, fundamental) + 600 + 320 (extras) = 4.920
    expect(r.eduHoje).toBe(4920);
  });

  it("custo educacional total = R$ 759.360", () => {
    // 684.000 de escola (Theo 306.000 + João 378.000) + 75.360 de despesas extras
    expect(r.custoEducacaoTotal).toBe(759360);
  });

  it("renda e participação batem com o racional", () => {
    expect(r.rendaMensal).toBe(15000); // 6.000 CLT + 9.000 autônomo
    expect(r.rendaEquiv).toBe(17250); // 6.000×1,00 + 9.000×1,25
    expect(r.fatorPensao).toBe(1); // CLT e autônomo têm fator de pensão 1,00
    expect(r.rendaFamiliar).toBe(21000); // 15.000 + 4.000 cônjuge + 2.000 terceiros
    expect(r.participacao).toBeCloseTo(15000 / 21000, 10);
  });

  it("cobertura vitalícia = R$ 358.500", () => {
    // patrimônio total 1.190.000 × 15% = 178.500, + 12 meses de renda (180.000)
    expect(r.vitalicia).toBe(358500);
  });

  it("cobertura temporária ≈ R$ 389.285,71", () => {
    // Nota: o mock de CRM em `Painel do Corretor.dc.html` arredonda isso para 389.285 (para
    // baixo) — é dado ilustrativo de tela de cliente, não a fonte de verdade do cálculo.
    // O valor exato, recalculado à mão a partir do racional, é 2.725.000 / 7.
    expect(r.temporaria).toBeCloseTo(2725000 / 7, 6);
  });

  it("capital em seguro de vida (vitalícia + temporária) ≈ R$ 747.785,71", () => {
    expect(r.totalVida).toBeCloseTo(358500 + 2725000 / 7, 6);
  });

  it("pensão de educação ≈ R$ 3.013,33/mês", () => {
    // 759.360 × 1,00 × (5/7) / (15×12) = 542.400 / 180
    expect(r.pensaoMensal).toBeCloseTo(542400 / 180, 6);
    expect(Math.round(r.pensaoMensal)).toBe(3013);
  });

  it("teto de razoabilidade não é atingido", () => {
    expect(r.tetoAtingido).toBe(false);
  });

  it("invalidez aplicável (CLT e autônomo cobrem)", () => {
    expect(r.invalidezAplicavel).toBe(true);
  });
});

describe("calc() — casos de borda do racional", () => {
  const base: EstudoDados = {
    nasc: "01/01/1990",
    estadoCivil: "Solteiro(a)",
    vinculos: {
      clt: { on: false, renda: 0 },
      servidor: { on: false, renda: 0 },
      autonomo: { on: false, renda: 0 },
    },
    rendaConjuge: 0,
    incluirConjuge: true,
    terceiros: [],
    temDep: false,
    deps: [],
    planoEdu: false,
    edu: { pre: 0, fund: 0, medio: 0, sup: 0, pos: 0 },
    extras: [],
    prazoManutencao: 5,
    prazoPensao: 15,
    teto: 8,
    objetivos: [],
    bens: [],
    pctSucessao: 15,
    fgts: 0,
    inss: 0,
    prevPrivada: 0,
    seguroAtual: 0,
  };
  const hoje = new Date(2026, 7, 31);

  it("servidor público sozinho: sem invalidez aplicável, fator de pensão 0,60", () => {
    const d: EstudoDados = { ...base, vinculos: { ...base.vinculos, servidor: { on: true, renda: 10000 } } };
    const r = calc(d, FATORES_PADRAO, hoje);
    expect(r.invalidezAplicavel).toBe(false);
    expect(r.fatorPensao).toBe(0.6);
    expect(r.rendaInvalidezVitalicia).toBe(0); // não se aplica a servidor
  });

  it("sem dependentes financeiros: temporária é só os objetivos incluídos", () => {
    const d: EstudoDados = {
      ...base,
      vinculos: { ...base.vinculos, clt: { on: true, renda: 5000 } },
      objetivos: [{ desc: "Dívida informal", valor: 20000, incluir: true }],
    };
    const r = calc(d, FATORES_PADRAO, hoje);
    expect(r.temDep).toBe(false);
    expect(r.necessidadeBruta).toBe(0);
    expect(r.temporaria).toBe(20000);
    expect(r.pensaoMensal).toBe(0);
  });

  it("teto de razoabilidade corta a manutenção quando estourado", () => {
    const d: EstudoDados = {
      ...base,
      vinculos: { ...base.vinculos, autonomo: { on: true, renda: 3000 } },
      temDep: true,
      deps: [{ nome: "Filha", nasc: "01/01/2020", rel: "Filho(a)" }],
      prazoManutencao: 30, // exagerado de propósito para estourar o teto
      teto: 8,
    };
    const r = calc(d, FATORES_PADRAO, hoje);
    expect(r.tetoAtingido).toBe(true);
    expect(r.modManutencao).toBe(r.teto);
    expect(r.temporaria).toBe(r.teto); // sem objetivos incluídos aqui
  });

  it("renda de terceiros não marcada não entra na renda familiar", () => {
    const d: EstudoDados = {
      ...base,
      vinculos: { ...base.vinculos, clt: { on: true, renda: 8000 } },
      terceiros: [{ desc: "Aluguel", valor: 3000, incluir: false }],
    };
    const r = calc(d, FATORES_PADRAO, hoje);
    expect(r.rendaFamiliar).toBe(8000);
    expect(r.participacao).toBe(1);
  });

  it("extra com prazo indeterminado usa anos até o filho mais novo completar 25", () => {
    const d: EstudoDados = {
      ...base,
      vinculos: { ...base.vinculos, clt: { on: true, renda: 5000 } },
      temDep: true,
      planoEdu: false, // sem plano educacional, só a despesa extra
      deps: [{ nome: "Filho", nasc: "01/01/2016", rel: "Filho(a)" }], // 10 anos em 31/08/2026
      extras: [{ nome: "Música", valor: 100, prazo: 0 }],
    };
    const r = calc(d, FATORES_PADRAO, hoje);
    // idade completa = 10, anosAte25 = max(1, ceil(25-10)) = 15
    expect(r.anosAte25).toBe(15);
    expect(r.custoEducacaoTotal).toBe(100 * 12 * 15);
  });
});
