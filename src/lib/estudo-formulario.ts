import type { EstudoDados } from "./calc";

/**
 * O formulário completo do estudo — o que fica em `Estudo.dados` (JSON) no banco.
 *
 * `EstudoDados` (calc.ts) é só o subconjunto que entra nas fórmulas. Aqui juntamos identidade,
 * contato e consentimento — campos que aparecem no formulário mas o `calc()` nunca lê. Porta de
 * `VAZIO` no protótipo (`Mapa da Proteção 1a+1b - Unificado.dc.html`, ~linha 1002).
 */
export interface EstudoFormulario extends EstudoDados {
  nome: string;
  sexo: "F" | "M";
  profissao: string;
  idadeApos: number;
  /** "Confirmo que revisei este bloco com o cliente" — etapa Custos e patrimônio. */
  revisado: boolean;
  whats: string;
  email: string;
  lgpd: boolean;
  assunto: string;
  anexos: { resumo: boolean; a4: boolean; slides: boolean; ia: boolean };
}

export const ESTUDO_VAZIO: EstudoFormulario = {
  nome: "",
  nasc: "",
  sexo: "F",
  estadoCivil: "Solteiro(a)",
  profissao: "",
  idadeApos: 65,
  vinculos: {
    clt: { on: false, renda: 0 },
    servidor: { on: false, renda: 0 },
    autonomo: { on: false, renda: 0 },
  },
  rendaConjuge: 0,
  incluirConjuge: true,
  terceiros: [],
  temDep: true,
  deps: [{ nome: "", nasc: "", rel: "Filho(a)" }],
  planoEdu: true,
  edu: { pre: 0, fund: 0, medio: 0, sup: 0, pos: 0 },
  extras: [],
  prazoManutencao: 5,
  prazoPensao: 15,
  teto: 8,
  objetivos: [],
  bens: [{ desc: "", tipo: "Imóvel", valor: 0, liquidavel: false }],
  pctSucessao: 15,
  fgts: 0,
  inss: 0,
  prevPrivada: 0,
  seguroAtual: 0,
  revisado: false,
  whats: "",
  email: "",
  lgpd: false,
  assunto: "",
  anexos: { resumo: true, a4: true, slides: false, ia: false },
};

/**
 * Normaliza `Estudo.dados` (JSON cru do banco) pra um `EstudoFormulario` completo, preenchendo
 * qualquer campo ausente com o padrão de `ESTUDO_VAZIO` — inclusive dentro de `vinculos`/`edu`/
 * `anexos`, que são objetos aninhados.
 *
 * Rede de segurança, não o caminho normal: todo estudo criado pela aplicação (`criarEstudoNovo`,
 * `enviarLead`) já nasce com o formato completo. Existe por causa de dados legados/semeados com
 * `dados` incompleto ou `{}` (visto de verdade: um cliente de teste da Etapa 1 com `dados: {}`
 * quebrava `calc()` — "Cannot read properties of undefined (reading 'clt')" — tanto ao abrir o
 * estudo quanto, pior, ao **duplicar** um mapa gerado a partir dele, porque `duplicarEstudo`
 * copiava o JSON cru sem validar o formato). Use em qualquer lugar que leia `estudo.dados` do
 * banco antes de passar pra `calc()`/`EstudoShell`/`duplicarEstudo` — nunca faça o cast direto
 * (`as unknown as EstudoFormulario`) de novo.
 */
export function paraEstudoFormulario(bruto: unknown): EstudoFormulario {
  const d = (bruto && typeof bruto === "object" ? bruto : {}) as Partial<EstudoFormulario>;
  return {
    ...ESTUDO_VAZIO,
    ...d,
    vinculos: { ...ESTUDO_VAZIO.vinculos, ...(d.vinculos ?? {}) },
    edu: { ...ESTUDO_VAZIO.edu, ...(d.edu ?? {}) },
    anexos: { ...ESTUDO_VAZIO.anexos, ...(d.anexos ?? {}) },
  };
}

export const ESTADOS_CIVIS = ["Solteiro(a)", "Casado(a)", "União estável", "Divorciado(a)", "Viúvo(a)"] as const;
export const RELACOES_DEPENDENTE = ["Filho(a)", "Cônjuge", "Pai/Mãe", "Outro"] as const;
export const TIPOS_BEM = ["Imóvel", "Veículo", "Investimento", "Empresa", "Outro"] as const;

/** Pendências por etapa (0-3) — porta de `pendencias()` do protótipo. Etapa 4 (Resultado) não
 * tem pendência própria: ela é bloqueada se qualquer uma das quatro anteriores tiver pendência. */
export function pendenciasPorEtapa(d: EstudoFormulario, hoje: Date): string[][] {
  const p: string[][] = [[], [], [], []];

  if (!(d.nome || "").trim()) p[0].push("nome");
  const idadeDeSegurado = calcularIdade(d.nasc, hoje);
  if (idadeDeSegurado === null) p[0].push("data de nascimento");
  const temVinculoComRenda =
    (d.vinculos.clt.on && d.vinculos.clt.renda > 0) ||
    (d.vinculos.servidor.on && d.vinculos.servidor.renda > 0) ||
    (d.vinculos.autonomo.on && d.vinculos.autonomo.renda > 0);
  if (!temVinculoComRenda) p[0].push("vínculo com renda");
  if (!(d.profissao || "").trim()) p[0].push("profissão");

  if (d.temDep) {
    const completos = d.deps.filter((x) => (x.nome || "").trim() && calcularIdade(x.nasc, hoje) !== null).length;
    const incompletos = d.deps.filter(
      (x) => (((x.nome || "").trim() ? 1 : 0) + (calcularIdade(x.nasc, hoje) !== null ? 1 : 0)) === 1,
    ).length;
    if (!completos) p[1].push("pelo menos um dependente");
    if (incompletos) p[1].push(`${incompletos} dependente(s) incompleto(s)`);
    if (d.planoEdu && !Object.values(d.edu).some((v) => v > 0)) p[1].push("custo de alguma fase escolar");
  }

  if (!d.bens.some((b) => b.valor > 0)) p[2].push("pelo menos um bem");
  if (!d.revisado) p[2].push("confirmação de revisão");

  if (!(d.whats || "").trim() && !(d.email || "").trim()) p[3].push("WhatsApp ou e-mail");
  if (!d.lgpd) p[3].push("autorização LGPD");

  return p;
}

function calcularIdade(str: string, hoje: Date): number | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((str || "").trim());
  if (!m) return null;
  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  if (isNaN(d.getTime())) return null;
  const anos = (hoje.getTime() - d.getTime()) / (365.2425 * 24 * 3600 * 1000);
  return anos < 0 || anos > 110 ? null : anos;
}
