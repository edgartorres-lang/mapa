"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { editarCadastroCliente } from "@/app/painel/clientes/[id]/actions";
import { ESTADOS_CIVIS } from "@/lib/estudo-formulario";
import { CENARIOS_INVALIDEZ } from "@/lib/enums";
import { dataParaBr, mascaraData, mascaraTelefone } from "@/lib/formato";
import { textoDias } from "@/lib/funil";

/**
 * Cadastro do cliente, editável (2026-09-09) — antes só o nome era editável pela página
 * (NomeEditavel.tsx); o resto (telefone/e-mail/nascimento/profissão/estado civil/cenário) era
 * somente leitura. Um toggle só pro box inteiro (não campo por campo) — mesmo espírito de
 * NomeEditavel, mas editando vários campos de uma vez. Salvar marca
 * `cadastroEditadoManualmente`, protegendo esses campos contra reenvio do link público.
 */
export function CadastroEditavel({
  clienteId,
  telefone,
  email,
  nascimento,
  profissao,
  estadoCivil,
  cenarioResposta,
  origem,
  clienteDesde,
  diasParado,
}: {
  clienteId: string;
  telefone: string | null;
  email: string | null;
  nascimento: Date | null;
  profissao: string | null;
  estadoCivil: string | null;
  cenarioResposta: string | null;
  origem: string | null;
  clienteDesde: Date;
  diasParado: number;
}) {
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    telefone: telefone ?? "",
    email: email ?? "",
    nascimento: dataParaBr(nascimento),
    profissao: profissao ?? "",
    estadoCivil: estadoCivil ?? "",
    cenarioResposta: cenarioResposta ?? "",
  });

  function abrirEdicao() {
    setForm({
      telefone: telefone ?? "",
      email: email ?? "",
      nascimento: dataParaBr(nascimento),
      profissao: profissao ?? "",
      estadoCivil: estadoCivil ?? "",
      cenarioResposta: cenarioResposta ?? "",
    });
    setEditando(true);
  }

  async function salvar() {
    setSalvando(true);
    try {
      await editarCadastroCliente(clienteId, form);
    } finally {
      setSalvando(false);
      setEditando(false);
    }
  }

  if (!editando) {
    return (
      <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)" }}>Cadastro</div>
          <button type="button" onClick={abrirEdicao} title="Editar cadastro" style={{ font: "600 11px var(--font-interface)", color: "var(--azul)", background: "none", border: "none", cursor: "pointer" }}>
            Editar ✎
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {[
            ["Nascimento", nascimento?.toLocaleDateString("pt-BR") ?? "—"],
            ["Telefone", telefone ?? "—"],
            ["E-mail", email ?? "—"],
            ["Profissão", profissao ?? "—"],
            ["Estado civil", estadoCivil ?? "—"],
            ["Cenário de risco", cenarioResposta ?? "—"],
            ["Origem", origem ?? "—"],
            ["Cliente desde", clienteDesde.toLocaleDateString("pt-BR")],
            ["Último movimento", `${textoDias(diasParado)} atrás`],
          ].map(([rotulo, valor]) => (
            <div key={rotulo} style={{ display: "flex", justifyContent: "space-between", gap: 12, font: "400 12px var(--font-interface)" }}>
              <span style={{ color: "var(--texto-terciario)" }}>{rotulo}</span>
              <span style={{ color: "var(--texto)", fontWeight: 500, textAlign: "right" }}>{valor}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1.5px solid var(--azul-claro-borda)", borderRadius: 12, padding: "20px 22px" }}>
      <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 14 }}>Editar cadastro</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Campo rotulo="Nascimento">
          <input
            value={form.nascimento}
            placeholder="dd/mm/aaaa"
            onChange={(e) => setForm((f) => ({ ...f, nascimento: mascaraData(e.target.value) }))}
            style={inputStyle}
          />
        </Campo>
        <Campo rotulo="Telefone">
          <input value={form.telefone} placeholder="(00) 00000-0000" onChange={(e) => setForm((f) => ({ ...f, telefone: mascaraTelefone(e.target.value) }))} style={inputStyle} />
        </Campo>
        <Campo rotulo="E-mail">
          <input value={form.email} placeholder="nome@email.com" onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={inputStyle} />
        </Campo>
        <Campo rotulo="Profissão">
          <input value={form.profissao} onChange={(e) => setForm((f) => ({ ...f, profissao: e.target.value }))} style={inputStyle} />
        </Campo>
        <Campo rotulo="Estado civil">
          <select value={form.estadoCivil} onChange={(e) => setForm((f) => ({ ...f, estadoCivil: e.target.value }))} style={inputStyle}>
            <option value="">—</option>
            {ESTADOS_CIVIS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Cenário de risco">
          <select value={form.cenarioResposta} onChange={(e) => setForm((f) => ({ ...f, cenarioResposta: e.target.value }))} style={inputStyle}>
            <option value="">—</option>
            {CENARIOS_INVALIDEZ.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          style={{ font: "700 12px var(--font-interface)", color: "#fff", background: "var(--verde)", border: "none", padding: "9px 16px", borderRadius: 999, cursor: "pointer" }}
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          style={{ font: "600 12px var(--font-interface)", color: "var(--texto-secundario)", background: "none", border: "1.5px solid var(--borda)", padding: "9px 16px", borderRadius: 999, cursor: "pointer" }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "8px 10px",
  border: "1.5px solid var(--borda)",
  borderRadius: 8,
  font: "500 12.5px var(--font-interface)",
  color: "var(--texto)",
  background: "#fbfdff",
};

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ font: "600 11px var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 4 }}>{rotulo}</div>
      {children}
    </div>
  );
}
