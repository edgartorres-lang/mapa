"use client";

import { useState, useTransition } from "react";
import { criarClienteRapido } from "@/app/estudo/actions";
import { mascaraTelefone } from "@/lib/formato";
import { Campo, CampoTexto } from "@/components/ui/Campos";

const VAZIO = { nome: "", telefone: "", email: "", profissao: "" };

/**
 * Botão "+ Novo cliente" — cadastro rápido, sem estudo nenhum (diferente de "+ Novo estudo", que
 * já leva pro wizard). O cliente fica como "lead" até alguém abrir o estudo de verdade a partir
 * da página dele. Ver `criarClienteRapido` em src/app/estudo/actions.ts.
 */
export function BotaoNovoCliente() {
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState(VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function fechar() {
    if (pending) return;
    setAberto(false);
    setDados(VAZIO);
    setErro(null);
  }

  function salvar() {
    if (!dados.nome.trim()) {
      setErro("Nome é obrigatório.");
      return;
    }
    setErro(null);
    // Sem try/catch de propósito: `criarClienteRapido` termina com `redirect()`, que no Next
    // funciona lançando um erro especial que precisa subir sem ser interceptado (mesmo padrão
    // de BotaoNovoEstudo.tsx). A validação de nome vazio já é feita acima, então o "throw" de
    // verdade do server (defesa redundante) só aconteceria em uso fora desta tela.
    startTransition(async () => {
      await criarClienteRapido(dados);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        style={{ width: "100%", font: "700 12.5px var(--font-interface)", color: "#fff", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.3)", padding: "10px", borderRadius: 999, cursor: "pointer", marginBottom: 8 }}
      >
        + Novo cliente
      </button>

      {aberto && (
        <div onClick={fechar} style={{ position: "fixed", inset: 0, background: "rgba(15,61,99,.42)", display: "grid", placeItems: "center", zIndex: 20, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: "28px 30px", width: 440, maxWidth: "100%", boxSizing: "border-box" }}>
            <div style={{ font: "600 20px var(--font-titulo)", color: "var(--marinho)", marginBottom: 6 }}>Novo cliente</div>
            <div style={{ font: "400 12.5px/1.7 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 18 }}>
              Só o cadastro — fica como lead até você abrir o estudo de verdade na página dele.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Campo rotulo="Nome">
                <CampoTexto placeholder="Nome completo" value={dados.nome} onChange={(v) => setDados({ ...dados, nome: v })} />
              </Campo>
              <Campo rotulo="WhatsApp">
                <CampoTexto placeholder="(00) 00000-0000" value={dados.telefone} onChange={(v) => setDados({ ...dados, telefone: mascaraTelefone(v) })} />
              </Campo>
              <Campo rotulo="E-mail">
                <CampoTexto placeholder="nome@email.com" value={dados.email} onChange={(v) => setDados({ ...dados, email: v })} />
              </Campo>
              <Campo rotulo="Profissão">
                <CampoTexto placeholder="Profissão" value={dados.profissao} onChange={(v) => setDados({ ...dados, profissao: v })} />
              </Campo>
            </div>
            {erro && <div style={{ font: "600 12px var(--font-interface)", color: "var(--alerta-texto)", marginTop: 14 }}>{erro}</div>}
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 20 }}>
              <button
                type="button"
                onClick={fechar}
                disabled={pending}
                style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto-secundario)", border: "1.5px solid var(--borda)", background: "#fff", padding: "11px 18px", borderRadius: 999, cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvar}
                disabled={pending}
                style={{ font: "700 12.5px var(--font-interface)", color: "#fff", background: "var(--marinho)", border: "none", padding: "12px 20px", borderRadius: 999, cursor: "pointer" }}
              >
                {pending ? "Criando…" : "Criar cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
