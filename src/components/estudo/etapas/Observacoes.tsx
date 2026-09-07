"use client";

import type { EstudoFormulario } from "@/lib/estudo-formulario";
import { Cartao } from "@/components/ui/Campos";

/**
 * Etapa 4 — antes "Contato e consentimento". WhatsApp e e-mail migraram pro Perfil (2026-09-06);
 * o consentimento LGPD deixou de ter checkbox aqui — vira automático (`lgpdStatus: "verbal"`) no
 * momento em que o corretor cria o cliente/estudo direto, ver `criarEstudoNovo`/
 * `criarClienteRapido` em src/app/estudo/actions.ts. O formulário público do lead (captação)
 * continua com o checkbox explícito, que ali é obrigatório por lei.
 *
 * O que sobrou é só isto: um campo livre e opcional, que vira contexto extra no payload da IA
 * (Resumo para o cliente / Análise interna) — nunca bloqueia o Resultado.
 */
export function Observacoes({
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
        <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)" }}>
          Observações{" "}
          <span style={{ font: "600 10px var(--font-interface)", color: "var(--texto-terciario)", background: "var(--fundo)", padding: "3px 7px", borderRadius: 5, marginLeft: 6 }}>
            OPCIONAL
          </span>
        </div>
        <div style={{ font: "400 11.5px/1.5 var(--font-interface)", color: "var(--texto-terciario)", margin: "5px 0 14px" }}>
          Qualquer coisa que ajude a entender esse perfil melhor — ex.: &quot;filho autista&quot;, &quot;sócio em
          empresa&quot;, &quot;já teve doença grave na família&quot;. Vai como contexto extra pro Resumo para o
          cliente e pra Análise interna, não aparece em mais lugar nenhum.
        </div>
        <textarea
          value={dados.observacoes}
          onChange={(e) => set({ observacoes: e.target.value })}
          placeholder="Ex.: filho mais novo é autista; tem sócio em uma empresa de fora; já passou por uma doença grave na família."
          rows={6}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 14px",
            border: "1.5px solid var(--borda)",
            borderRadius: 9,
            font: "400 13px/1.6 var(--font-interface)",
            color: "var(--texto)",
            background: "#fbfdff",
            resize: "vertical",
          }}
        />
      </Cartao>
    </fieldset>
  );
}
