"use client";

import { useState, useTransition } from "react";
import { alterarStatusMapa } from "@/app/painel/clientes/[id]/actions";
import { STATUS_COMERCIAL_MAPA, type StatusComercialMapa } from "@/lib/enums";

const ROTULOS: Record<StatusComercialMapa, string> = {
  criado: "Criado",
  apresentado: "Apresentado",
  negociando: "Em negociação",
  fechado: "Fechado",
  descartado: "Descartado",
};

/**
 * Status comercial de um Mapa específico (2026-09-09) — muda direto no `onChange`, sem botão de
 * salvar separado (mesmo espírito dos botões de "Estágio no funil" já existentes, um clique só).
 * Se for o Mapa mais recente do cliente, isto também move `Cliente.estagioFunil` — ver
 * `alterarStatusMapa` em painel/clientes/[id]/actions.ts.
 */
export function SeletorStatusMapa({ mapaId, statusAtual }: { mapaId: string; statusAtual: StatusComercialMapa }) {
  const [status, setStatus] = useState(statusAtual);
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const novo = e.target.value as StatusComercialMapa;
        setStatus(novo);
        startTransition(() => {
          alterarStatusMapa(mapaId, novo);
        });
      }}
      style={{
        font: "700 10.5px var(--font-interface)",
        color: "var(--marinho)",
        border: "1.5px solid var(--borda)",
        borderRadius: 999,
        padding: "4px 8px",
        background: "#fff",
        cursor: pending ? "default" : "pointer",
      }}
    >
      {STATUS_COMERCIAL_MAPA.map((s) => (
        <option key={s} value={s}>
          {ROTULOS[s]}
        </option>
      ))}
    </select>
  );
}
