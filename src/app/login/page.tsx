import { redirect } from "next/navigation";
import { lerSessaoCookie } from "@/lib/sessao-cookie";
import { entrar } from "./actions";

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; redirect?: string }>;
}) {
  const { erro, redirect: redirectPara } = await searchParams;

  // Já logado (cookie válido) — não mostra a tela de login de novo, manda direto pro painel.
  const corretorId = await lerSessaoCookie();
  if (corretorId) redirect(redirectPara || "/painel/dashboard");

  return (
    <div style={{ minHeight: "100vh", background: "var(--marinho)", display: "grid", placeItems: "center", padding: 20, fontFamily: "var(--font-interface)" }}>
      <div style={{ width: 380, maxWidth: "100%", background: "#fff", borderRadius: 16, padding: "34px 32px", boxSizing: "border-box" }}>
        <div style={{ font: "700 12px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".14em", color: "var(--verde)", marginBottom: 8 }}>
          Mapa da Proteção
        </div>
        <div style={{ font: "600 24px var(--font-titulo)", color: "var(--marinho)", marginBottom: 24 }}>Entrar</div>

        {erro && (
          <div style={{ background: "var(--alerta-fundo)", border: "1px solid var(--alerta-borda)", borderRadius: 9, padding: "11px 13px", font: "500 12.5px/1.6 var(--font-interface)", color: "var(--alerta-texto)", marginBottom: 18 }}>
            E-mail ou senha incorretos.
          </div>
        )}

        <form action={entrar} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {redirectPara && <input type="hidden" name="redirect" value={redirectPara} />}
          <div>
            <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 6 }}>E-mail</div>
            <input
              type="email"
              name="email"
              autoFocus
              autoComplete="username"
              placeholder="voce@email.com"
              required
              style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", border: "1.5px solid var(--borda)", borderRadius: 9, font: "500 13.5px var(--font-interface)", color: "var(--texto)", background: "#fbfdff" }}
            />
          </div>
          <div>
            <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 6 }}>Senha</div>
            <input
              type="password"
              name="senha"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              style={{ width: "100%", boxSizing: "border-box", padding: "11px 13px", border: "1.5px solid var(--borda)", borderRadius: 9, font: "500 13.5px var(--font-interface)", color: "var(--texto)", background: "#fbfdff" }}
            />
          </div>
          <button
            type="submit"
            style={{ marginTop: 6, font: "700 13px var(--font-interface)", color: "#fff", background: "var(--marinho)", border: "none", padding: "12px 20px", borderRadius: 999, cursor: "pointer" }}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
