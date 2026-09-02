"use client";

import { useState } from "react";

const EFEITOS_PADRAO = [
  "O mapa atual continua travado e visível no histórico do cliente, com a data em que foi gerado.",
  "O estudo novo nasce com todas as respostas do mapa atual e volta a recalcular com os fatores de hoje.",
  "Ao gerar de novo, ele vira a próxima versão do Mapa da Proteção e passa a ser o mapa atual.",
];

/** Modal de duplicar — porta de `modalDuplicar` em Ciclo do Estudo.dc.html. Único caminho de
 * correção depois que o Mapa foi gerado. */
export function ModalDuplicar({
  rotuloBotao = "Duplicar estudo",
  clienteNome,
  acaoConfirmar,
}: {
  rotuloBotao?: string;
  clienteNome: string;
  acaoConfirmar: () => void | Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto-secundario)", border: "1.5px solid var(--borda)", background: "#fff", padding: "10px 18px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap" }}
      >
        {rotuloBotao}
      </button>

      {aberto && (
        <div onClick={() => setAberto(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,61,99,.42)", display: "grid", placeItems: "center", zIndex: 20, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: "28px 30px", width: 500, maxWidth: "100%", boxSizing: "border-box" }}>
            <div style={{ font: "600 20px var(--font-titulo)", color: "var(--marinho)", marginBottom: 8 }}>Duplicar o estudo de {clienteNome}?</div>
            <div style={{ font: "400 12.5px/1.75 var(--font-interface)", color: "var(--texto)", marginBottom: 16 }}>
              Todas as respostas vão para um estudo novo, em aberto. Você altera o que precisa e gera de novo quando quiser.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
              {EFEITOS_PADRAO.map((texto) => (
                <div key={texto} style={{ display: "flex", gap: 10, alignItems: "flex-start", font: "400 12px/1.65 var(--font-interface)", color: "var(--texto)" }}>
                  <span style={{ color: "var(--verde)", fontWeight: 700, flex: "none" }}>✓</span>
                  {texto}
                </div>
              ))}
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
                <button type="submit" style={{ font: "700 12.5px var(--font-interface)", color: "#fff", background: "var(--azul)", border: "none", padding: "12px 20px", borderRadius: 999, cursor: "pointer" }}>
                  Duplicar e abrir o estudo novo
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
