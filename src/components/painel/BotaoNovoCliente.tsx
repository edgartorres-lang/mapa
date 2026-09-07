"use client";

import { useState, useTransition } from "react";
import { criarClienteRapido } from "@/app/estudo/actions";
import { mascaraTelefone, mascaraData } from "@/lib/formato";
import { ESTADOS_CIVIS } from "@/lib/estudo-formulario";
import { Campo, CampoTexto, CampoSelect } from "@/components/ui/Campos";

const VAZIO = { nome: "", telefone: "", email: "", profissao: "", nascimento: "", estadoCivil: "" };

/**
 * Botão "+ Novo cliente" — único jeito de criar alguém a partir da sidebar (2026-09-07; o antigo
 * "+ Novo estudo" saiu daqui, a página do cliente tem seu próprio botão "Iniciar novo estudo").
 * Nome e telefone são obrigatórios, o resto é o que já se sabe na hora. CPF ficou de fora de
 * propósito — campo sensível demais pra essa etapa tão inicial; entra quando o estudo virar
 * proposta de verdade, se um dia for preciso.
 */
export function BotaoNovoCliente() {
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState(VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Qual dos dois botões foi clicado — só pra mostrar o rótulo de carregando no botão certo
  // (os dois compartilham o mesmo `pending` do useTransition).
  const [emAndamento, setEmAndamento] = useState<"salvar" | "iniciar" | null>(null);

  function fechar() {
    if (pending) return;
    setAberto(false);
    setDados(VAZIO);
    setErro(null);
  }

  function validar() {
    if (!dados.nome.trim()) return "Nome é obrigatório.";
    if (!dados.telefone.trim()) return "Telefone é obrigatório.";
    return null;
  }

  function salvar(iniciarEstudo: boolean) {
    const msg = validar();
    if (msg) {
      setErro(msg);
      return;
    }
    setErro(null);
    setEmAndamento(iniciarEstudo ? "iniciar" : "salvar");
    startTransition(async () => {
      try {
        await criarClienteRapido(dados, iniciarEstudo);
      } catch (e) {
        // `criarClienteRapido` termina com `redirect()`, que no Next funciona lançando um erro
        // especial (`digest` começando com "NEXT_REDIRECT") que precisa subir sem ser
        // interceptado — senão a navegação nunca acontece. Só trata como erro de verdade o que
        // não for isso (ex.: a defesa redundante do server pra nome/telefone vazio).
        if (e instanceof Error && "digest" in e && typeof e.digest === "string" && e.digest.startsWith("NEXT_REDIRECT")) throw e;
        setErro(e instanceof Error ? e.message : "Erro ao criar cliente.");
        setEmAndamento(null);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        style={{ width: "100%", font: "700 12.5px var(--font-interface)", color: "#fff", background: "var(--verde)", border: "none", padding: "11px", borderRadius: 999, cursor: "pointer", marginBottom: 14 }}
      >
        + Novo cliente
      </button>

      {aberto && (
        <div onClick={fechar} style={{ position: "fixed", inset: 0, background: "rgba(15,61,99,.42)", display: "grid", placeItems: "center", zIndex: 20, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: "28px 30px", width: 480, maxWidth: "100%", boxSizing: "border-box" }}>
            <div style={{ font: "600 20px var(--font-titulo)", color: "var(--marinho)", marginBottom: 6 }}>Novo cliente</div>
            <div style={{ font: "400 12.5px/1.7 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 18 }}>
              Só o cadastro — fica como lead até você iniciar o estudo de verdade.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Campo rotulo="Nome">
                <CampoTexto placeholder="Nome completo" value={dados.nome} onChange={(v) => setDados({ ...dados, nome: v })} />
              </Campo>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Campo rotulo="Telefone">
                  <CampoTexto placeholder="(00) 00000-0000" value={dados.telefone} onChange={(v) => setDados({ ...dados, telefone: mascaraTelefone(v) })} />
                </Campo>
                <Campo rotulo="Data de nascimento">
                  <CampoTexto placeholder="dd/mm/aaaa" value={dados.nascimento} onChange={(v) => setDados({ ...dados, nascimento: mascaraData(v) })} />
                </Campo>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Campo rotulo="Estado civil">
                  <CampoSelect value={dados.estadoCivil} onChange={(v) => setDados({ ...dados, estadoCivil: v })} opcoes={["", ...ESTADOS_CIVIS]} />
                </Campo>
                <Campo rotulo="Profissão">
                  <CampoTexto placeholder="Profissão" value={dados.profissao} onChange={(v) => setDados({ ...dados, profissao: v })} />
                </Campo>
              </div>
              <Campo rotulo="E-mail">
                <CampoTexto placeholder="nome@email.com" value={dados.email} onChange={(v) => setDados({ ...dados, email: v })} />
              </Campo>
            </div>
            {erro && <div style={{ font: "600 12px var(--font-interface)", color: "var(--alerta-texto)", marginTop: 14 }}>{erro}</div>}
            <div style={{ display: "flex", gap: 9, justifyContent: "flex-end", marginTop: 20, flexWrap: "wrap" }}>
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
                onClick={() => salvar(false)}
                disabled={pending}
                style={{ font: "700 12.5px var(--font-interface)", color: "var(--marinho)", background: "#fff", border: "1.5px solid var(--marinho)", padding: "11px 18px", borderRadius: 999, cursor: "pointer" }}
              >
                {emAndamento === "salvar" ? "Salvando…" : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => salvar(true)}
                disabled={pending}
                style={{ font: "700 12.5px var(--font-interface)", color: "#fff", background: "var(--marinho)", border: "none", padding: "12px 20px", borderRadius: 999, cursor: "pointer" }}
              >
                {emAndamento === "iniciar" ? "Criando…" : "Salvar e iniciar novo estudo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
