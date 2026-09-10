"use client";

import { useState } from "react";
import { renomearEstudo } from "@/app/painel/clientes/[id]/actions";

/**
 * Apelido de um estudo "em andamento", editável inline — mesmo padrão de NomeEditavel.tsx.
 * 2026-09-09, junto com o box "Estudos em andamento": o apelido automático
 * ("Estudo · Nome · DD/MM HHhMM") é só ponto de partida, o corretor pode deixar mais claro.
 */
export function EstudoApelidoEditavel({ estudoId, apelido }: { estudoId: string; apelido: string }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(apelido);
  const [salvando, setSalvando] = useState(false);

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => {
          setValor(apelido);
          setEditando(true);
        }}
        title="Renomear estudo"
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto)" }}>{apelido}</span>
        <span style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)" }}>✎</span>
      </button>
    );
  }

  async function salvar() {
    const limpo = valor.trim();
    if (!limpo || limpo === apelido) {
      setEditando(false);
      return;
    }
    setSalvando(true);
    try {
      await renomearEstudo(estudoId, limpo);
    } finally {
      setSalvando(false);
      setEditando(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input
        autoFocus
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") salvar();
          if (e.key === "Escape") setEditando(false);
        }}
        style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto)", border: "1.5px solid var(--borda)", borderRadius: 7, padding: "5px 8px", minWidth: 200 }}
      />
      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        style={{ font: "700 11px var(--font-interface)", color: "#fff", background: "var(--verde)", border: "none", padding: "6px 10px", borderRadius: 999, cursor: "pointer" }}
      >
        {salvando ? "…" : "Salvar"}
      </button>
      <button
        type="button"
        onClick={() => setEditando(false)}
        style={{ font: "600 11px var(--font-interface)", color: "var(--texto-secundario)", background: "none", border: "1.5px solid var(--borda)", padding: "6px 10px", borderRadius: 999, cursor: "pointer" }}
      >
        Cancelar
      </button>
    </div>
  );
}
