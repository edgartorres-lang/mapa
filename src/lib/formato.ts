/** Formatação de moeda e texto — porta de brl()/brlCurto() do protótipo. */

export function brl(n: number | null | undefined): string {
  return "R$ " + Math.round(n || 0).toLocaleString("pt-BR");
}

export function brlCurto(n: number | null | undefined): string {
  const v = Math.round(n || 0);
  if (Math.abs(v) >= 1_000_000) {
    return "R$ " + (v / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " mi";
  }
  if (Math.abs(v) >= 1000) {
    return "R$ " + Math.round(v / 1000) + " mil";
  }
  return brl(v);
}

/** Converte texto digitado (com ou sem formatação) num número. */
export function num(v: unknown): number {
  const n = parseFloat(String(v ?? "").replace(",", ".").replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

/** Só dígitos → inteiro, pra campos de dinheiro (mesmo padrão do protótipo: digita, formata). */
export function digitosParaInteiro(v: string): number {
  const dig = (v || "").replace(/\D/g, "");
  return dig ? parseInt(dig, 10) : 0;
}

const REGEX_DATA = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** Idade fracionária a partir de "dd/mm/aaaa", contra uma data de referência. */
export function idadeDe(str: string, hoje: Date = new Date()): number | null {
  const m = REGEX_DATA.exec((str || "").trim());
  if (!m) return null;
  const d = new Date(+m[3], +m[2] - 1, +m[1]);
  if (isNaN(d.getTime())) return null;
  const anos = (hoje.getTime() - d.getTime()) / (365.2425 * 24 * 3600 * 1000);
  if (anos < 0 || anos > 110) return null;
  return anos;
}

/** Máscara de data enquanto digita: só números, insere as barras. */
export function mascaraData(v: string): string {
  const d = (v || "").replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return d.slice(0, 2) + "/" + d.slice(2);
  return d.slice(0, 2) + "/" + d.slice(2, 4) + "/" + d.slice(4);
}

/** Máscara de telefone brasileiro enquanto digita. */
export function mascaraTelefone(v: string): string {
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
  if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
  return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
}

export function primeiroNome(s: string | null | undefined): string {
  return (s || "").trim().split(" ")[0] || "";
}
