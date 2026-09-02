import { ESTAGIOS_FUNIL, type EstagioFunil } from "./enums";

/** Metadados de cada estágio do funil — cores exatas do README (seção "Design tokens"). */
export const ESTAGIO_INFO: Record<EstagioFunil, { nome: string; cor: string; vazio: string }> = {
  lead: { nome: "Lead", cor: "#8FA0AF", vazio: "Leads novos aparecem aqui" },
  estudo: { nome: "Estudo", cor: "#1B72BE", vazio: "Nenhum estudo em aberto" },
  apresentado: { nome: "Apresentado", cor: "#0F3D63", vazio: "Nada apresentado ainda" },
  cotando: { nome: "Cotando", cor: "#D9A400", vazio: "Nenhuma cotação aberta" },
  fechado: { nome: "Fechado", cor: "#39CC00", vazio: "Nenhuma apólice este mês" },
  perdido: { nome: "Perdido", cor: "#C4570B", vazio: "Nada perdido" },
};

export { ESTAGIOS_FUNIL };

/**
 * `Cliente.estagioFunil` sai do Prisma como `string | null` (é `String` no schema, não `enum` —
 * ver "SQLite local × Postgres de produção" no AGENTS.md). Esta função valida contra
 * `ESTAGIOS_FUNIL` e estreita o tipo; um valor fora da lista vira `null` ("fora do funil") em vez
 * de estourar.
 */
export function comoEstagio(valor: string | null | undefined): EstagioFunil | null {
  return valor && (ESTAGIOS_FUNIL as readonly string[]).includes(valor) ? (valor as EstagioFunil) : null;
}

export function infoDoEstagio(valor: string | null | undefined) {
  const estagio = comoEstagio(valor);
  return estagio ? ESTAGIO_INFO[estagio] : null;
}

export function corDoEstagio(estagio: string | null | undefined): string {
  return infoDoEstagio(estagio)?.cor ?? "#8FA0AF";
}

export function nomeDoEstagio(estagio: string | null | undefined): string {
  return infoDoEstagio(estagio)?.nome ?? "Fora do funil";
}

/** Fundo suave pra badge/pílula, na mesma lógica de `suave()` do protótipo (Painel do Corretor). */
export function fundoSuaveDoEstagio(estagio: string | null | undefined): string {
  switch (comoEstagio(estagio)) {
    case "lead":
      return "#F3F6FA";
    case "estudo":
    case "apresentado":
      return "#E7F0FA";
    case "cotando":
      return "#FCF3D9";
    case "fechado":
      return "#EAFBE3";
    case "perdido":
      return "#FDF1E7";
    default:
      return "#F3F6FA";
  }
}

const MS_POR_DIA = 24 * 3600 * 1000;

/** Dias desde `data` até `agora` (padrão: agora de verdade). Nunca negativo. */
export function diasDesde(data: Date, agora: Date = new Date()): number {
  return Math.max(0, Math.floor((agora.getTime() - data.getTime()) / MS_POR_DIA));
}

export function textoDias(dias: number): string {
  if (dias === 0) return "hoje";
  if (dias === 1) return "ontem";
  return `${dias} dias`;
}

/** `N` dias antes de `agora` — extraída à parte pra não chamar Date.now()/new Date() direto no
 * corpo de um componente (regra de pureza do React Compiler). */
export function dataDiasAtras(dias: number, agora: Date = new Date()): Date {
  return new Date(agora.getTime() - dias * MS_POR_DIA);
}

export function corDias(dias: number): string {
  if (dias >= 120) return "#C4570B";
  if (dias >= 30) return "#D9A400";
  return "#5B6B7A";
}
