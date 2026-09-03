import type { FatoresCalculo as FatoresCalculoDb } from "@prisma/client";

/** Os 14 campos de "Ajustes → Fatores de cálculo" (tab 1). `diasRetencao` fica de fora — mora na
 * aba "LGPD e retenção" (tab 3), não na de fatores, seguindo Ajustes.dc.html. */
export type FatoresCalculoEditavel = Pick<
  FatoresCalculoDb,
  | "pctCustoTransmissao"
  | "mesesVitalicia"
  | "prazoManutencaoAnos"
  | "tetoMultiplicador"
  | "prazoPensaoAnosPadrao"
  | "idadeIndependencia"
  | "fatorClt"
  | "fatorServidor"
  | "fatorPensaoServidor"
  | "fatorAutonomo"
  | "anosInvalidez"
  | "pctInvalidezDoenca"
  | "pctRendaInvalidez"
  | "pctDit"
  | "fatorDoencasGraves"
>;

/** Espelha os `@default(...)` do schema (prisma/schema.prisma, model FatoresCalculo) — usado pelo
 * botão "Restaurar". Se o default do schema mudar, mude aqui também. */
export const FATORES_PADRAO_AJUSTES: FatoresCalculoEditavel = {
  pctCustoTransmissao: 15,
  mesesVitalicia: 12,
  prazoManutencaoAnos: 5,
  tetoMultiplicador: 8,
  prazoPensaoAnosPadrao: 15,
  idadeIndependencia: 25,
  fatorClt: 1,
  fatorServidor: 1,
  fatorPensaoServidor: 0.6,
  fatorAutonomo: 1.25,
  anosInvalidez: 5,
  pctInvalidezDoenca: 50,
  pctRendaInvalidez: 50,
  pctDit: 70,
  fatorDoencasGraves: 1.5,
};

/**
 * Em que camada cada campo vive, na prática — três comportamentos bem diferentes escondidos atrás
 * da mesma tela de edição, e o motivo de existir este arquivo em vez de só ler o schema:
 *
 * - **"live"**: `calc.ts` lê direto do corretor a cada cálculo (via `paraFatoresCalc`). Muda um
 *   estudo em aberto assim que a tela dele recarrega — sem precisar duplicar nada.
 * - **"padrao"**: vira o valor inicial de `Estudo.dados` só em estudos *criados depois de salvar*
 *   (via `padroesPorEstudo`, em `src/app/captacao/actions.ts` e onde mais um estudo nasce).
 *   Estudos já abertos guardaram sua própria cópia no momento em que nasceram e **não mudam**
 *   retroativamente — o racional já permite trocar caso a caso dentro do próprio estudo.
 * - **"travado"**: campo mostrado desabilitado, sempre 1,00 — decisão de design, não limitação.
 * - **"inerte"**: existe no schema e na tela (fidelidade ao design original), mas `calc.ts` nunca
 *   leu esse valor — conferido contra `calc()` no protótipo mestre
 *   (`Mapa da Proteção 1a+1b - Unificado.dc.html`, ~linha 1101), que também nunca o usa. Editar
 *   aqui não muda nenhum número ainda. Ver AGENTS.md, "Ajustes (Etapa 6)".
 */
export type CamadaFator = "live" | "padrao" | "travado" | "inerte";

export interface CampoFator {
  chave: keyof FatoresCalculoEditavel;
  rotulo: string;
  unidade: string;
  nota: string;
  camada: CamadaFator;
  decimal?: boolean;
}

export interface GrupoFatores {
  nome: string;
  sub: string;
  campos: CampoFator[];
}

export const GRUPOS_FATORES: GrupoFatores[] = [
  {
    nome: "Cobertura vitalícia",
    sub: "Patrimônio × custo de transmissão, mais um bloco de renda para a família atravessar o inventário.",
    campos: [
      { chave: "pctCustoTransmissao", rotulo: "Custo de transmissão sucessória", unidade: "%", nota: "ITCMD, custas e honorários sobre o patrimônio total.", camada: "padrao" },
      { chave: "mesesVitalicia", rotulo: "Meses de renda somados", unidade: "meses", nota: "Tempo de casa custeado enquanto o inventário corre.", camada: "inerte" },
    ],
  },
  {
    nome: "Cobertura temporária",
    sub: "Manutenção do padrão de vida, limitada pelo teto de razoabilidade.",
    campos: [
      { chave: "prazoManutencaoAnos", rotulo: "Prazo de manutenção", unidade: "anos", nota: "Por quanto tempo a família mantém a rotina atual.", camada: "padrao" },
      { chave: "tetoMultiplicador", rotulo: "Teto de razoabilidade", unidade: "× ano", nota: "Múltiplo da renda anual. Acima disso, o valor é cortado e o estudo avisa.", camada: "padrao" },
    ],
  },
  {
    nome: "Educação",
    sub: "Custo total até a formação, transformado em pensão mensal.",
    campos: [
      { chave: "prazoPensaoAnosPadrao", rotulo: "Prazo padrão da pensão", unidade: "anos", nota: "Sugestão inicial; o estudo permite trocar caso a caso.", camada: "padrao" },
      { chave: "idadeIndependencia", rotulo: "Idade de independência", unidade: "anos", nota: "Até quando o custo educacional é contado.", camada: "inerte" },
    ],
  },
  {
    nome: "Fatores de risco por vínculo",
    sub: "Incidem sobre a renda de cada vínculo, não sobre o total.",
    campos: [
      { chave: "fatorClt", rotulo: "CLT", unidade: "×", nota: "Sem majoração.", camada: "travado", decimal: true },
      { chave: "fatorServidor", rotulo: "Servidor público", unidade: "×", nota: "Sem majoração de renda.", camada: "travado", decimal: true },
      { chave: "fatorPensaoServidor", rotulo: "Fator de pensão do servidor", unidade: "×", nota: "O RPPS já paga parte; reduz a pensão de educação.", camada: "live", decimal: true },
      { chave: "fatorAutonomo", rotulo: "Autônomo, liberal, empresário", unidade: "×", nota: "Sem rede formal de proteção.", camada: "live", decimal: true },
    ],
  },
  {
    nome: "Invalidez e complementares",
    sub: "Eventos que interrompem a renda sem interromper as despesas.",
    campos: [
      { chave: "anosInvalidez", rotulo: "Invalidez por acidente", unidade: "anos", nota: "Anos de renda que compõem o capital.", camada: "live" },
      { chave: "pctInvalidezDoenca", rotulo: "Invalidez por doença", unidade: "%", nota: "Percentual do capital de invalidez por acidente.", camada: "inerte" },
      { chave: "pctRendaInvalidez", rotulo: "Renda vitalícia por invalidez", unidade: "%", nota: "Da renda mensal. Não se aplica a servidor.", camada: "inerte" },
      { chave: "pctDit", rotulo: "DIT", unidade: "%", nota: "Da renda mensal, enquanto durar o afastamento.", camada: "live" },
      { chave: "fatorDoencasGraves", rotulo: "Doenças graves", unidade: "× ano", nota: "Múltiplo da renda anual, pago no diagnóstico.", camada: "live", decimal: true },
    ],
  },
];

export const NOTA_CAMADA: Record<CamadaFator, string | null> = {
  live: null,
  padrao: "Vira o padrão de estudos novos — os já abertos guardaram seu próprio valor e não mudam (dá pra trocar caso a caso dentro do estudo).",
  travado: null,
  inerte: "Ainda não afeta o cálculo — mostrado por fidelidade ao design, sem efeito em nenhum número hoje.",
};
