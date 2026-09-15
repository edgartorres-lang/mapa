"use client";

import { useState } from "react";
import { trocarSenha } from "@/app/painel/ajustes/actions";

/**
 * Trocar senha (2026-09-13) — a única parte de "Acesso" que já funciona de verdade; o resto da
 * aba (os três cartões de "Esqueci a senha") continua sendo só referência visual. Sucesso derruba
 * a sessão e manda de volta pro login (ver `trocarSenha`, em painel/ajustes/actions.ts).
 */
export function TrocarSenhaForm() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setErro(null);
    if (novaSenha !== confirmar) {
      setErro("A nova senha e a confirmação não são iguais.");
      return;
    }
    setEnviando(true);
    try {
      await trocarSenha(senhaAtual, novaSenha);
      // Sucesso redireciona pro /login (trocarSenha lança redirect) — não chega a voltar aqui.
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui trocar a senha.");
      setEnviando(false);
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "22px 24px" }}>
      <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 4 }}>Trocar senha</div>
      <div style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 16 }}>
        Ao salvar, você é desconectado e precisa entrar de novo com a senha nova.
      </div>
      {erro && (
        <div style={{ background: "var(--alerta-fundo)", border: "1px solid var(--alerta-borda)", borderRadius: 9, padding: "10px 12px", font: "500 12px/1.6 var(--font-interface)", color: "var(--alerta-texto)", marginBottom: 14 }}>
          {erro}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Campo rotulo="Senha atual" valor={senhaAtual} onChange={setSenhaAtual} autoComplete="current-password" />
        <Campo rotulo="Nova senha" valor={novaSenha} onChange={setNovaSenha} autoComplete="new-password" placeholder="ao menos 8 caracteres" />
        <Campo rotulo="Repetir a senha nova" valor={confirmar} onChange={setConfirmar} autoComplete="new-password" />
      </div>
      <button
        type="button"
        onClick={enviar}
        disabled={enviando || !senhaAtual || !novaSenha}
        style={{ marginTop: 16, font: "700 12.5px var(--font-interface)", color: "#fff", background: enviando ? "var(--cinza-inativo)" : "var(--marinho)", border: "none", padding: "10px 20px", borderRadius: 999, cursor: enviando ? "default" : "pointer" }}
      >
        {enviando ? "Salvando…" : "Salvar e sair"}
      </button>
    </div>
  );
}

function Campo({
  rotulo,
  valor,
  onChange,
  autoComplete,
  placeholder,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder?: string;
}) {
  return (
    <div>
      <div style={{ font: "600 11px var(--font-interface)", color: "var(--marinho)", marginBottom: 5 }}>{rotulo}</div>
      <input
        type="password"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1.5px solid var(--borda)", borderRadius: 9, font: "500 12.5px var(--font-interface)", background: "#fbfdff" }}
      />
    </div>
  );
}
