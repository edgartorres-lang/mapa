"use client";

import { useState } from "react";

/**
 * "O botão de excluir abre confirmação; nunca exclui direto" (não-negociável). A exclusão de
 * verdade — apagar mapa/estudo, decidir se é por cliente inteiro ou um mapa isolado — é da
 * Etapa 4 (Ciclo do estudo), ainda não construída. Este modal já mostra a separação exigida
 * (o que vai embora × o que fica), mas o botão de confirmar é um stub.
 */
export function ExcluirMapaBotao({ clienteNome }: { clienteNome: string }) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        style={{ font: "600 11.5px var(--font-interface)", color: "var(--alerta-texto)", border: "1.5px solid var(--alerta-borda)", background: "#fff", padding: "6px 12px", borderRadius: 999, cursor: "pointer" }}
      >
        Excluir mapa
      </button>

      {aberto && (
        <div
          onClick={() => setAberto(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,61,99,.35)", display: "grid", placeItems: "center", zIndex: 20 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 24, width: 440, boxSizing: "border-box" }}>
            <div style={{ font: "600 17px var(--font-titulo)", color: "var(--marinho)", marginBottom: 4 }}>Excluir mapa de {clienteNome}?</div>
            <div style={{ font: "400 12px var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 16 }}>
              Isto não apaga o cadastro do cliente — só o mapa e o estudo que o gerou.
            </div>

            <div style={{ background: "var(--alerta-fundo)", border: "1px solid var(--alerta-borda)", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--alerta-texto)", marginBottom: 6 }}>Vai embora</div>
              <div style={{ font: "400 12px/1.6 var(--font-interface)", color: "var(--texto)" }}>O mapa gerado, o estudo que o gerou, e o histórico ligado a ele.</div>
            </div>
            <div style={{ background: "var(--sucesso-fundo)", border: "1px solid var(--sucesso-borda)", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
              <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--verde-escuro)", marginBottom: 6 }}>Fica</div>
              <div style={{ font: "400 12px/1.6 var(--font-interface)", color: "var(--texto)" }}>O cadastro do cliente, os mapas anteriores (se houver) e as anotações.</div>
            </div>

            <div style={{ background: "var(--nota-fundo)", border: "1px solid var(--nota-borda)", borderRadius: 9, padding: "10px 12px", marginBottom: 16, font: "400 11.5px/1.6 var(--font-interface)", color: "var(--nota-texto)" }}>
              A exclusão de verdade é da Etapa 4 (Ciclo do estudo), ainda não construída — este botão só mostra o que aconteceria.
            </div>

            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setAberto(false)}
                style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto-secundario)", border: "1.5px solid var(--borda)", background: "#fff", padding: "10px 16px", borderRadius: 999, cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled
                title="Etapa 4, ainda não construída"
                style={{ font: "700 12.5px var(--font-interface)", color: "#fff", background: "var(--cinza-inativo)", border: "none", padding: "10px 16px", borderRadius: 999, cursor: "not-allowed" }}
              >
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
