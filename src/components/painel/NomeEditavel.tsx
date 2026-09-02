"use client";

import { useState } from "react";
import { editarNomeCliente } from "@/app/painel/clientes/[id]/actions";

/**
 * Nome do cliente, editável inline pela página do cliente. Ao salvar, marca
 * `nomeEditadoManualmente` no banco (via editarNomeCliente) — a partir daí um reenvio do link de
 * captação nunca mais sobrescreve esse nome. Ver AGENTS.md, "Captação pública".
 */
export function NomeEditavel({ clienteId, nome }: { clienteId: string; nome: string }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(nome);
  const [salvando, setSalvando] = useState(false);

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => {
          setValor(nome);
          setEditando(true);
        }}
        title="Corrigir nome"
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        <span style={{ font: "600 19px var(--font-titulo)", color: "var(--marinho)" }}>{nome}</span>
        <span style={{ font: "400 12px var(--font-interface)", color: "var(--texto-terciario)" }}>✎</span>
      </button>
    );
  }

  async function salvar() {
    const limpo = valor.trim();
    if (!limpo || limpo === nome) {
      setEditando(false);
      return;
    }
    setSalvando(true);
    try {
      await editarNomeCliente(clienteId, limpo);
    } finally {
      setSalvando(false);
      setEditando(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        autoFocus
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") salvar();
          if (e.key === "Escape") setEditando(false);
        }}
        style={{ font: "600 16px var(--font-interface)", color: "var(--marinho)", border: "1.5px solid var(--borda)", borderRadius: 8, padding: "6px 10px", minWidth: 220 }}
      />
      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        style={{ font: "700 12px var(--font-interface)", color: "#fff", background: "var(--verde)", border: "none", padding: "8px 14px", borderRadius: 999, cursor: "pointer" }}
      >
        {salvando ? "Salvando…" : "Salvar"}
      </button>
      <button
        type="button"
        onClick={() => setEditando(false)}
        style={{ font: "600 12px var(--font-interface)", color: "var(--texto-secundario)", background: "none", border: "1.5px solid var(--borda)", padding: "8px 14px", borderRadius: 999, cursor: "pointer" }}
      >
        Cancelar
      </button>
    </div>
  );
}
