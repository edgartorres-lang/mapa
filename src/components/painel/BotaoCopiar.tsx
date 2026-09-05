"use client";

import { useState } from "react";

/** `pequeno`: variante compacta (texto simples, sem pílula) — usada nas linhas de campanha, onde
 * o botão cheio ficaria grande demais ao lado das estatísticas de cada linha. */
export function BotaoCopiar({ texto, pequeno }: { texto: string; pequeno?: boolean }) {
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

  if (pequeno) {
    return (
      <button
        type="button"
        onClick={copiar}
        style={{ font: "700 11px var(--font-interface)", color: copiado ? "var(--verde-escuro)" : "var(--azul)", background: "none", border: "none", padding: 0, cursor: "pointer", whiteSpace: "nowrap" }}
      >
        {copiado ? "Copiado ✓" : "Copiar link"}
      </button>
    );
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
