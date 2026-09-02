"use client";

import { useState } from "react";

export function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível (permissão negada, contexto não seguro) — sem crash, só não copia.
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      style={{ font: "700 12.5px var(--font-interface)", color: "#fff", background: copiado ? "var(--verde)" : "var(--azul)", border: "none", padding: "11px 18px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap" }}
    >
      {copiado ? "Copiado ✓" : "Copiar"}
    </button>
  );
}
