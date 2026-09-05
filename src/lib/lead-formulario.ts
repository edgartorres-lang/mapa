import type { EstudoDados, VinculoKey } from "./calc";
import { ESTUDO_VAZIO, type EstudoFormulario } from "./estudo-formulario";
import { digitosParaInteiro } from "./formato";

/**
 * Formulário público do lead — porta de `Link do Cliente - Protótipo.dc.html`. Coleta menos do
 * que o estudo completo do corretor (sem profissão, sem pós-graduação, sem INSS separado — ver
 * ESPECIFICACAO.md/README do handoff). O corretor completa o resto na reunião. Isso é intencional
 * (formulário de 16 perguntas, não 30), não um bug. Bem liquidável passou a ser perguntado aqui
 * (2026-09-03, a pedido do Edgar) — antes o formulário público não distinguia, e todo item de
 * patrimônio virava "não liquidável" na conta, mesmo sendo, por exemplo, uma reserva em
 * aplicação. Ver `mapearLeadParaEstudo`.
 */

export const VINCULOS_LEAD = [
  "Carteira assinada (CLT)",
  "Servidor público",
  "Por conta própria / empresário",
  "Aposentado(a) ou pensionista",
] as const;
export type VinculoLead = (typeof VINCULOS_LEAD)[number];

export const RELS_LEAD = ["Filho(a)", "Cônjuge", "Pai/Mãe", "Outro"] as const;
export const PRAZOS_LEAD = ["1 ano", "2 anos", "3 anos", "5 anos", "10 anos", "até concluir os estudos", "por tempo indeterminado"] as const;
export const ESTADOS_CIVIS_LEAD = ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"] as const;

export interface LeadRespostas {
  nome: string;
  contato: { wpp: string; email: string };
  lgpd: boolean;
  nasc: string;
  civil: string;
  vinculo: string[];
  renda: string; // dinheiro em texto, ex.: "R$ 15.000"
  fontes: Record<string, string>;
  deps: { nome: string; nasc: string; rel: string }[];
  rendaConj: string;
  estudos: { on: boolean | null; pre: string; fund: string; medio: string; sup: string };
  extras: { desc: string; valor: string; prazo: string }[];
  rendas: { desc: string; valor: string }[]; // terceiros permanentes
  patr: { desc: string; valor: string; liquidavel: boolean }[]; // patrimônio
  res: { fgts: string; prev: string; seg: string };
  cenario: string;
  obs: string;
}

export const LEAD_VAZIO: LeadRespostas = {
  nome: "",
  contato: { wpp: "", email: "" },
  lgpd: false,
  nasc: "",
  civil: "",
  vinculo: [],
  renda: "",
  fontes: {},
  deps: [],
  rendaConj: "",
  estudos: { on: null, pre: "", fund: "", medio: "", sup: "" },
  extras: [],
  rendas: [],
  patr: [],
  res: { fgts: "", prev: "", seg: "" },
  cenario: "",
  obs: "",
};

export interface PerguntaLead {
  key: keyof LeadRespostas;
  grupo: string;
  label: string;
  help: string;
  tipo: "date" | "choice" | "multi" | "money" | "fontes" | "people" | "phases" | "extras" | "items" | "group" | "note";
  opts?: readonly string[];
  cond?: (a: LeadRespostas) => boolean;
}

export const PERGUNTAS_LEAD: PerguntaLead[] = [
  { key: "nasc", grupo: "Você", label: "Qual a sua data de nascimento?", help: "Serve para calcular os prazos das coberturas.", tipo: "date" },
  { key: "civil", grupo: "Você", label: "Qual o seu estado civil?", help: "", tipo: "choice", opts: ESTADOS_CIVIS_LEAD },
  { key: "vinculo", grupo: "Trabalho", label: "Como você trabalha hoje?", help: "Marque tudo que se aplica. É comum trabalhar por conta própria e ter também um cargo ou outra fonte de renda.", tipo: "multi", opts: VINCULOS_LEAD },
  { key: "renda", grupo: "Trabalho", label: "Quanto você recebe por mês pelo seu trabalho?", help: "Some apenas o que vem de atividade remunerada: salário, pró-labore, retiradas, comissões. Aluguéis, dividendos e outras rendas recorrentes entram mais adiante, em outra pergunta.", tipo: "money" },
  { key: "fontes", grupo: "Trabalho", label: "Quanto vem de cada fonte?", help: "Separe o valor por origem — isso muda o cálculo, porque cada vínculo tem uma rede de proteção diferente.", tipo: "fontes", cond: (a) => (a.vinculo || []).length > 1 },
  { key: "deps", grupo: "Família", label: "Quem depende da sua renda hoje?", help: "Qualquer pessoa que sentiria falta desse dinheiro no mês seguinte.", tipo: "people" },
  { key: "rendaConj", grupo: "Família", label: "Quanto a outra pessoa da casa contribui por mês?", help: "Se preferir não informar, pode pular — conversamos depois.", tipo: "money", cond: (a) => a.civil === "Casado(a)" || a.civil === "União estável" },
  { key: "estudos", grupo: "Família", label: "Vocês pagam escola ou faculdade?", help: "Se sim, informe o valor de um filho só. Se dois estiverem na mesma fase, eu multiplico aqui.", tipo: "phases", cond: (a) => (a.deps || []).length > 0 },
  { key: "extras", grupo: "Família", label: "Tem outras despesas de estudo que você quer incluir?", help: "Inglês, esporte, música, intercâmbio, cursinho. Opcional — só o que você quiser que entre na conta.", tipo: "extras", cond: (a) => (a.deps || []).length > 0 },
  { key: "rendas", grupo: "Renda", label: "Entra alguma renda todo mês sem depender do seu trabalho?", help: "Aluguel, dividendos, sociedade. Continua entrando mesmo se você parar.", tipo: "items" },
  {
    key: "patr",
    grupo: "Patrimônio",
    label: "O que a família tem hoje de patrimônio?",
    help: "Imóveis, veículos, aplicações. Valor aproximado de cada um. Marque também se é um bem liquidável — ou seja, algo que a família consegue vender rápido numa emergência financeira.",
    tipo: "items",
  },
  { key: "res", grupo: "Reservas", label: "Vocês já têm alguma reserva guardada?", help: "Isso reduz o que falta proteger — vale informar.", tipo: "group" },
  { key: "cenario", grupo: "Cenário", label: "Se você ficasse um ano sem poder trabalhar, quem sustentaria a casa?", help: "Escolha a opção mais próxima da sua realidade.", tipo: "choice", opts: ["Ninguém — a renda é toda minha", "Meu cônjuge, em parte", "Temos reservas para um tempo", "Não sei dizer"] },
  { key: "obs", grupo: "Para terminar", label: "Quer deixar alguma observação para o corretor?", help: "Opcional. Pode seguir sem escrever nada.", tipo: "note" },
];

/** Converte o prazo em texto do formulário público pro número que calc.ts espera (0 = indeterminado). */
function prazoLeadParaNumero(prazo: string): number {
  const m = /^(\d+)\s*anos?$/.exec(prazo.trim());
  if (m) return parseInt(m[1], 10);
  return 0; // "até concluir os estudos" ou "por tempo indeterminado" — mais perto de indeterminado
}

const ROTULO_PARA_VINCULO: Record<VinculoLead, VinculoKey | null> = {
  "Carteira assinada (CLT)": "clt",
  "Servidor público": "servidor",
  "Por conta própria / empresário": "autonomo",
  "Aposentado(a) ou pensionista": null, // sem equivalente em calc() — ver AGENTS.md
};

/**
 * Monta o `EstudoFormulario` de partida a partir das respostas do lead. Campos que o formulário
 * público não pergunta (profissão, aposenta aos, sexo, tipo/liquidável de cada bem, INSS) ficam
 * no padrão de `ESTUDO_VAZIO` — o corretor completa na reunião. `cenario`/`obs` não fazem parte
 * do cálculo; quem chama isto grava os dois como NotaCrm à parte.
 */
export function mapearLeadParaEstudo(a: LeadRespostas): EstudoFormulario {
  const vinculos: EstudoDados["vinculos"] = {
    clt: { on: false, renda: 0 },
    servidor: { on: false, renda: 0 },
    autonomo: { on: false, renda: 0 },
  };

  const vinculosValidos = (a.vinculo || []).map((v) => ROTULO_PARA_VINCULO[v as VinculoLead]).filter((v): v is VinculoKey => v !== null);

  if (vinculosValidos.length === 1) {
    vinculos[vinculosValidos[0]] = { on: true, renda: digitosParaInteiro(a.renda) };
  } else if (vinculosValidos.length > 1) {
    for (const v of vinculosValidos) {
      const rotulo = (Object.entries(ROTULO_PARA_VINCULO) as [VinculoLead, VinculoKey | null][]).find(([, k]) => k === v)?.[0];
      const valor = rotulo ? digitosParaInteiro(a.fontes[rotulo] || "") : 0;
      vinculos[v] = { on: true, renda: valor };
    }
  }

  const casado = a.civil === "Casado(a)" || a.civil === "União estável";

  return {
    ...ESTUDO_VAZIO,
    nome: a.nome,
    nasc: a.nasc,
    estadoCivil: a.civil || ESTUDO_VAZIO.estadoCivil,
    vinculos,
    rendaConjuge: casado ? digitosParaInteiro(a.rendaConj) : 0,
    incluirConjuge: true,
    terceiros: (a.rendas || []).filter((r) => r.desc || r.valor).map((r) => ({ desc: r.desc, valor: digitosParaInteiro(r.valor), incluir: true })),
    temDep: (a.deps || []).length > 0,
    deps: (a.deps || []).length > 0 ? a.deps.map((d) => ({ nome: d.nome, nasc: d.nasc, rel: (d.rel || "Filho(a)") as EstudoFormulario["deps"][number]["rel"] })) : ESTUDO_VAZIO.deps,
    planoEdu: a.estudos?.on === true,
    edu: { pre: digitosParaInteiro(a.estudos?.pre), fund: digitosParaInteiro(a.estudos?.fund), medio: digitosParaInteiro(a.estudos?.medio), sup: digitosParaInteiro(a.estudos?.sup), pos: 0 },
    extras: (a.extras || []).filter((x) => x.desc || x.valor).map((x) => ({ nome: x.desc, valor: digitosParaInteiro(x.valor), prazo: prazoLeadParaNumero(x.prazo || "") })),
    bens: (a.patr || []).filter((p) => p.desc || p.valor).map((p) => ({ desc: p.desc, tipo: "Outro", valor: digitosParaInteiro(p.valor), liquidavel: !!p.liquidavel })),
    fgts: digitosParaInteiro(a.res?.fgts),
    prevPrivada: digitosParaInteiro(a.res?.prev),
    seguroAtual: digitosParaInteiro(a.res?.seg),
    whats: a.contato.wpp,
    email: a.contato.email,
    lgpd: a.lgpd,
  };
}
