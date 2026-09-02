"use client";

import { useState } from "react";
import type { CalcResultado } from "@/lib/calc";
import { brl } from "@/lib/formato";
import styles from "@/components/ui/campos.module.css";

/** Modal de gerar — porta de `modalGerar` em Ciclo do Estudo.dc.html: lista o que trava antes de
 * confirmar. Depois de fechado, não existe caminho de voltar atrás — só duplicar. */
export function ModalGerar({ c, gerando, onConfirmar }: { c: CalcResultado; gerando: boolean; onConfirmar: () => void }) {
  const [aberto, setAberto] = useState(false);

  const travados = [
    { rotulo: "Capital sugerido em seguro de vida", valor: brl(c.totalVida) },
    { rotulo: "Cobertura vitalícia", valor: brl(c.vitalicia) },
    { rotulo: "Cobertura temporária", valor: brl(c.temporaria) },
    { rotulo: "Pensão de educação", valor: `${brl(c.pensaoMensal)}/mês` },
  ];

  return (
    <>
      <button type="button" onClick={() => setAberto(true)} disabled={gerando} className={styles.botaoPrimario}>
        {gerando ? "Gerando…" : "Gerar Mapa da Proteção"}
      </button>

      {aberto && (
        <div onClick={() => !gerando && setAberto(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,61,99,.42)", display: "grid", placeItems: "center", zIndex: 20, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: "28px 30px", width: 520, maxWidth: "100%", boxSizing: "border-box" }}>
            <div style={{ font: "600 20px var(--font-titulo)", color: "var(--marinho)", marginBottom: 8 }}>Gerar o Mapa da Proteção?</div>
            <div style={{ font: "400 12.5px/1.75 var(--font-interface)", color: "var(--texto)", marginBottom: 16 }}>
              Os valores abaixo ficam congelados nesta data. Mudanças em Ajustes deixam de afetar este mapa.
            </div>
            <div style={{ background: "var(--fundo-alt-2)", borderRadius: 10, padding: "16px 18px", marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {travados.map((tv) => (
                  <div key={tv.rotulo} style={{ display: "flex", justifyContent: "space-between", gap: 12, font: "500 12px var(--font-interface)", color: "var(--texto-secundario)" }}>
                    <span>{tv.rotulo}</span>
                    <span style={{ fontWeight: 700, color: "var(--marinho)" }}>{tv.valor}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "var(--sucesso-fundo)", border: "1px solid var(--sucesso-borda)", borderRadius: 9, padding: "12px 14px", font: "400 11.5px/1.65 var(--font-interface)", color: "var(--verde-escuro)", marginBottom: 20 }}>
              Depois de gerar, o caminho para qualquer correção é duplicar o estudo. Os mapas anteriores continuam visíveis na página do cliente.
            </div>
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setAberto(false)}
                disabled={gerando}
                style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto-secundario)", border: "1.5px solid var(--borda)", background: "#fff", padding: "11px 18px", borderRadius: 999, cursor: "pointer" }}
              >
                Continuar editando
              </button>
              <button
                type="button"
                onClick={onConfirmar}
                disabled={gerando}
                style={{ font: "700 12.5px var(--font-interface)", color: "#fff", background: "var(--marinho)", border: "none", padding: "12px 20px", borderRadius: 999, cursor: "pointer" }}
              >
                {gerando ? "Gerando…" : "Gerar e travar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
