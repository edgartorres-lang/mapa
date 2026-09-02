"use client";

import type { EstudoFormulario } from "@/lib/estudo-formulario";
import { mascaraTelefone } from "@/lib/formato";
import { Cartao } from "@/components/ui/Campos";

export function ContatoConsentimento({
  dados,
  set,
  somenteLeitura,
}: {
  dados: EstudoFormulario;
  set: (patch: Partial<EstudoFormulario>) => void;
  somenteLeitura: boolean;
}) {
  return (
    <fieldset disabled={somenteLeitura} style={{ border: "none", padding: 0, margin: 0 }}>
      <Cartao>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div>
            <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 6 }}>WhatsApp</div>
            <input
              type="text"
              placeholder="(00) 00000-0000"
              value={dados.whats}
              onChange={(e) => set({ whats: mascaraTelefone(e.target.value) })}
              style={{ padding: "10px 12px", border: "1.5px solid var(--borda)", borderRadius: 9, font: "600 14px var(--font-interface)", color: "var(--texto)", background: "#fbfdff", width: "100%" }}
            />
          </div>
          <div>
            <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 6 }}>E-mail</div>
            <input
              type="text"
              placeholder="nome@email.com"
              value={dados.email}
              onChange={(e) => set({ email: e.target.value })}
              style={{ padding: "10px 12px", border: "1.5px solid var(--borda)", borderRadius: 9, font: "600 14px var(--font-interface)", color: "var(--texto)", background: "#fbfdff", width: "100%" }}
            />
          </div>
        </div>
        <div
          onClick={() => set({ lgpd: !dados.lgpd })}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            cursor: "pointer",
            marginTop: 18,
            padding: "14px 16px",
            border: `1.5px solid ${dados.lgpd ? "var(--azul)" : "var(--borda)"}`,
            borderRadius: 9,
            background: dados.lgpd ? "var(--azul-claro-fundo)" : "#fbfdff",
          }}
        >
          <span
            style={{
              width: 17,
              height: 17,
              flex: "none",
              marginTop: 1,
              borderRadius: 4,
              display: "grid",
              placeItems: "center",
              fontSize: 10,
              color: "#fff",
              background: dados.lgpd ? "var(--azul)" : "transparent",
              border: `1.5px solid ${dados.lgpd ? "var(--azul)" : "var(--cinza-inativo)"}`,
            }}
          >
            {dados.lgpd ? "✓" : ""}
          </span>
          <span style={{ font: "400 12px/1.6 var(--font-interface)", color: "var(--texto)" }}>
            Autorizo o uso dos meus dados para a elaboração deste estudo e o contato do corretor. Posso
            pedir a exclusão a qualquer momento.
          </span>
        </div>
      </Cartao>
    </fieldset>
  );
}
