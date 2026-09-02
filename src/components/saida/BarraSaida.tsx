"use client";

import Link from "next/link";
import { imprimirComo } from "@/lib/imprimir";

/**
 * Barra de topo (não imprime — .noprint) com voltar + botão de imprimir. Troca a regra @page
 * antes de chamar window.print(), igual ao protótipo: `imprimir(modo)` em
 * Mapa da Proteção 1a+1b - Unificado.dc.html (~linha 1075).
 */
export function BarraSaida({
  estudoId,
  modo,
  rotuloBotao,
  notaDireita,
}: {
  estudoId: string;
  modo: "slides" | "a4";
  rotuloBotao: string;
  notaDireita?: string;
}) {
  return (
    <div className="noprint" style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
      <Link
        href={`/estudo/${estudoId}`}
        style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto-secundario)", border: "1.5px solid var(--borda)", background: "#fff", padding: "10px 18px", borderRadius: 999, display: "inline-block" }}
      >
        ← Voltar ao resumo
      </Link>
      <button
        type="button"
        onClick={() => imprimirComo(modo)}
        style={{ font: "700 12.5px var(--font-interface)", color: "#fff", background: "var(--azul)", border: "none", padding: "11px 20px", borderRadius: 999, cursor: "pointer" }}
      >
        {rotuloBotao}
      </button>
      {notaDireita && <span style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-terciario)" }}>{notaDireita}</span>}
    </div>
  );
}
