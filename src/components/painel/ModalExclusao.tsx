"use client";

import { useState } from "react";

/**
 * Modal de exclusão genérico — usado tanto pra excluir um mapa isolado (página do cliente)
 * quanto pra excluir o histórico inteiro (fila dos 120 dias, dashboard). Sempre separa "o que
 * vai embora" × "o que fica", como o não-negociável exige. `acaoConfirmar` é uma server action
 * já vinculada ao id certo (`.bind(null, id)`), sem argumento — o botão "Confirmar" só existe
 * dentro de um `<form>`, então mesmo sem JavaScript o clique ainda funciona.
 */
export function ModalExclusao({
  rotuloBotao,
  corBotao = "var(--alerta-texto)",
  titulo,
  subtitulo,
  vaiEmbora,
  oQueFica,
  rotuloConfirmar,
  acaoConfirmar,
}: {
  rotuloBotao: string;
  corBotao?: string;
  titulo: string;
  subtitulo?: string;
  vaiEmbora: string[];
  oQueFica: string[];
  rotuloConfirmar: string;
  acaoConfirmar: () => void | Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        style={{ font: "600 11.5px var(--font-interface)", color: corBotao, border: `1.5px solid ${corBotao}`, background: "#fff", padding: "6px 12px", borderRadius: 999, cursor: "pointer" }}
      >
        {rotuloBotao}
      </button>

      {aberto && (
        <div onClick={() => setAberto(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,61,99,.42)", display: "grid", placeItems: "center", zIndex: 20, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: "28px 30px", width: 500, maxWidth: "100%", boxSizing: "border-box" }}>
            <div style={{ font: "600 20px var(--font-titulo)", color: "var(--alerta-texto)", marginBottom: 8 }}>{titulo}</div>
            {subtitulo && <div style={{ font: "400 12.5px/1.75 var(--font-interface)", color: "var(--texto)", marginBottom: 14 }}>{subtitulo}</div>}

            <div style={{ background: "var(--alerta-fundo)", border: "1px solid var(--alerta-borda)", borderRadius: 9, padding: "14px 16px", marginBottom: 16 }}>
              <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--alerta-texto)", marginBottom: 8 }}>O que vai embora</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {vaiEmbora.map((texto) => (
                  <div key={texto} style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--alerta-texto)" }}>{texto}</div>
                ))}
              </div>
            </div>
            <div style={{ background: "var(--sucesso-fundo)", border: "1px solid var(--sucesso-borda)", borderRadius: 9, padding: "14px 16px", marginBottom: 20 }}>
              <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--verde-escuro)", marginBottom: 8 }}>O que fica</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {oQueFica.map((texto) => (
                  <div key={texto} style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--verde-escuro)" }}>{texto}</div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setAberto(false)}
                style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto-secundario)", border: "1.5px solid var(--borda)", background: "#fff", padding: "11px 18px", borderRadius: 999, cursor: "pointer" }}
              >
                Cancelar
              </button>
              <form action={acaoConfirmar}>
                <button type="submit" style={{ font: "700 12.5px var(--font-interface)", color: "#fff", background: "var(--alerta-texto)", border: "none", padding: "12px 20px", borderRadius: 999, cursor: "pointer" }}>
                  {rotuloConfirmar}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
