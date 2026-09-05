"use client";

import { useState } from "react";
import { salvarRetencao, registrarExclusaoLgpd } from "@/app/painel/ajustes/actions";
import type { CanalLgpd } from "@/lib/enums";

const CANAIS: { valor: CanalLgpd; rotulo: string }[] = [
  { valor: "whatsapp", rotulo: "WhatsApp" },
  { valor: "email", rotulo: "E-mail" },
  { valor: "verbal", rotulo: "Verbal" },
];

/**
 * Campo de dias de retenção (Ajustes → LGPD e retenção). Isolado num componente próprio só
 * porque precisa de estado local pro input — o resto da aba é lido direto do servidor.
 *
 * Salva em três gatilhos (Enter, sair do campo, e o botão) em vez de só um — é o único campo da
 * tela sem botão de "Salvar" visível ao lado, então o clique explícito garante que sempre existe
 * um jeito de confirmar que funciona de verdade, mesmo que o navegador não dispare blur nesse
 * momento (aconteceu durante o teste desta etapa).
 */
export function RetencaoInput({ diasIniciais }: { diasIniciais: number }) {
  const [dias, setDias] = useState(String(diasIniciais));
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function salvar() {
    const n = parseInt(dias, 10);
    if (!n || n < 1) return;
    setSalvando(true);
    try {
      await salvarRetencao(n);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
      <input
        type="text"
        value={dias}
        onChange={(e) => {
          setDias(e.target.value.replace(/\D/g, ""));
          setSalvo(false);
        }}
        onBlur={salvar}
        onKeyDown={(e) => {
          if (e.key === "Enter") salvar();
        }}
        style={{ width: 66, padding: "10px 11px", border: "1.5px solid var(--borda)", borderRadius: 8, font: "700 13.5px var(--font-interface)", color: "var(--marinho)", background: "#fbfdff", textAlign: "center", boxSizing: "border-box" }}
      />
      <span style={{ font: "500 12px var(--font-interface)", color: "var(--texto-secundario)" }}>dias sem movimento no CRM</span>
      <button
        type="button"
        onClick={salvar}
        disabled={salvando}
        style={{ cursor: "pointer", font: "600 11px var(--font-interface)", color: "var(--azul)", background: "none", border: "1px solid var(--azul-claro-borda)", borderRadius: 999, padding: "6px 12px" }}
      >
        {salvando ? "salvando…" : salvo ? "✓ salvo" : "Salvar"}
      </button>
    </div>
  );
}

interface ClienteOpcao {
  id: string;
  nome: string;
  telefone: string | null;
}

/** Pedido de exclusão LGPD — a ação mais destrutiva da tela: apaga o cadastro inteiro, sem
 * volta. Dois passos de propósito: escolher o cliente + canal primeiro, confirmar depois, com
 * o nome escrito por extenso no modal (não só um clique). */
export function ExclusaoLgpdForm({ clientes, diasRetencao }: { clientes: ClienteOpcao[]; diasRetencao: number }) {
  const [clienteId, setClienteId] = useState("");
  const [canal, setCanal] = useState<CanalLgpd>("whatsapp");
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [feito, setFeito] = useState(false);

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;

  async function confirmar() {
    if (!cliente) return;
    setExcluindo(true);
    try {
      await registrarExclusaoLgpd(cliente.id, canal);
      setFeito(true);
      setConfirmando(false);
      setClienteId("");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={clienteId}
          onChange={(e) => {
            setClienteId(e.target.value);
            setFeito(false);
          }}
          style={{ flex: "1 1 260px", padding: "11px 13px", border: "1.5px solid var(--borda)", borderRadius: 9, font: "500 12.5px var(--font-interface)", background: "#fbfdff", boxSizing: "border-box" }}
        >
          <option value="">Nome ou telefone do cliente que pediu exclusão</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}{c.telefone ? ` · ${c.telefone}` : ""}
            </option>
          ))}
        </select>
        <select
          value={canal}
          onChange={(e) => setCanal(e.target.value as CanalLgpd)}
          style={{ padding: "11px 13px", border: "1.5px solid var(--borda)", borderRadius: 9, font: "500 12.5px var(--font-interface)", background: "#fbfdff" }}
        >
          {CANAIS.map((c) => (
            <option key={c.valor} value={c.valor}>{c.rotulo}</option>
          ))}
        </select>
        <button
          type="button"
          disabled={!clienteId}
          onClick={() => setConfirmando(true)}
          style={{ font: "700 12px var(--font-interface)", color: "#fff", background: clienteId ? "var(--texto)" : "var(--cinza-inativo)", border: "none", padding: "12px 18px", borderRadius: 999, cursor: clienteId ? "pointer" : "default", whiteSpace: "nowrap" }}
        >
          Registrar pedido
        </button>
      </div>
      {feito && <div style={{ marginTop: 10, font: "600 12px var(--font-interface)", color: "var(--verde-escuro)" }}>✓ Cadastro excluído. Ficou só o registro do pedido, sem nome, telefone ou e-mail.</div>}

      {confirmando && cliente && (
        <div onClick={() => setConfirmando(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,61,99,.42)", display: "grid", placeItems: "center", zIndex: 20, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: "28px 30px", width: 520, maxWidth: "100%", boxSizing: "border-box" }}>
            <div style={{ font: "600 20px var(--font-titulo)", color: "var(--texto)", marginBottom: 8 }}>Excluir o cadastro de {cliente.nome}?</div>
            <div style={{ font: "400 12.5px/1.75 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 16 }}>
              Pedido registrado por {CANAIS.find((c) => c.valor === canal)?.rotulo.toLowerCase()}. Isto não é a mesma coisa que excluir um mapa — não tem volta e não passa pela fila dos {diasRetencao} dias.
            </div>
            <div style={{ background: "#fff", border: "1px solid var(--texto)", borderRadius: 10, padding: "15px 17px", marginBottom: 20 }}>
              <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--texto)", marginBottom: 9 }}>O que vai embora</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "Sai tudo: cadastro, estudos, mapas e histórico.",
                  "Fica só o registro do pedido, com data — a prova de que você atendeu.",
                  `Não tem volta e não passa pela fila dos ${diasRetencao} dias.`,
                ].map((t) => (
                  <div key={t} style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--texto)" }}>{t}</div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto-secundario)", border: "1.5px solid var(--borda)", background: "#fff", padding: "11px 18px", borderRadius: 999, cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={excluindo}
                style={{ font: "700 12.5px var(--font-interface)", color: "#fff", background: "var(--texto)", border: "none", padding: "12px 20px", borderRadius: 999, cursor: "pointer" }}
              >
                {excluindo ? "Excluindo…" : "Excluir cadastro e manter só o registro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
