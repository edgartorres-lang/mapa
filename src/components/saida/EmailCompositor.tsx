"use client";

import { useState } from "react";
import Link from "next/link";
import type { Apresentacao } from "@/lib/apresentacao";
import { enviarMapaPorEmail } from "@/app/estudo/actions";

type ChaveAnexo = "resumo" | "a4" | "slides" | "ia";

const ANEXOS_DEF: { k: ChaveAnexo; rotulo: string }[] = [
  { k: "resumo", rotulo: "Resumo no corpo da mensagem" },
  { k: "a4", rotulo: "PDF A4 anexado" },
  { k: "slides", rotulo: "Apresentação 16:9 anexada" },
  { k: "ia", rotulo: "Resumo para o cliente escrito pela IA" },
];

/**
 * O envio real dispara `webhookEnviarMapa` (n8n) — configurado em Ajustes → Acesso e
 * Integrações. Best-effort: sem URL configurada, com a integração desligada, ou se o n8n não
 * responder, mostra o erro em vez de travar — nunca finge que enviou.
 *
 * "Baixar A4" leva pra tela da proposta em vez de imprimir esta própria tela: a proposta de
 * 3 páginas não existe no DOM aqui (é outra rota) — diferente do protótipo original, que tinha
 * tudo numa página só e por isso conseguia imprimir de qualquer tela.
 */
export function EmailCompositor({ estudoId, r }: { estudoId: string; r: Apresentacao }) {
  const [destinatario, setDestinatario] = useState("");
  const [assunto, setAssunto] = useState(r.assuntoPadrao);
  const [anexos, setAnexos] = useState({ resumo: true, a4: true, slides: false, ia: false });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    setEnviando(true);
    setErro(null);
    try {
      const resultado = await enviarMapaPorEmail(estudoId, destinatario, assunto, anexos);
      if (resultado.sucesso) setEnviado(true);
      else setErro(resultado.erro);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ width: 400, background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--borda)" }}>
        <div style={{ font: "600 17px var(--font-titulo)", color: "var(--marinho)" }}>Enviar para {r.nome.split(" ")[0] || "o cliente"}</div>
        <div style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-secundario)", marginTop: 3 }}>Você revisa antes de sair.</div>
      </div>
      <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ font: "600 11.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 5 }}>Para</div>
          <input
            type="text"
            placeholder="nome@email.com"
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
            style={{ border: "1.5px solid var(--borda)", borderRadius: 9, padding: "10px 12px", font: "500 13px var(--font-interface)", background: "#fbfdff", width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <div style={{ font: "600 11.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 5 }}>Assunto</div>
          <input
            type="text"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            style={{ border: "1.5px solid var(--borda)", borderRadius: 9, padding: "10px 12px", font: "500 13px var(--font-interface)", background: "#fbfdff", width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <div style={{ font: "600 11.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 7 }}>O que vai no e-mail</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ANEXOS_DEF.map((a) => {
              const on = anexos[a.k];
              return (
                <div
                  key={a.k}
                  onClick={() => setAnexos((s) => ({ ...s, [a.k]: !s[a.k] }))}
                  style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", font: "500 12.5px var(--font-interface)", color: on ? "var(--texto)" : "var(--texto-secundario)" }}
                >
                  <span
                    style={{
                      width: 17,
                      height: 17,
                      flex: "none",
                      borderRadius: 4,
                      display: "grid",
                      placeItems: "center",
                      font: "700 10px var(--font-interface)",
                      color: "#fff",
                      background: on ? "var(--azul)" : "transparent",
                      border: `1.5px solid ${on ? "var(--azul)" : "var(--borda)"}`,
                    }}
                  >
                    {on ? "✓" : ""}
                  </span>
                  {a.rotulo}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ background: "var(--nota-fundo)", border: "1px solid var(--nota-borda)", borderRadius: 9, padding: "11px 13px", font: "400 11.5px/1.6 var(--font-interface)", color: "var(--nota-texto)" }}>
          A análise interna com argumentos de venda nunca entra no e-mail nem no anexo.
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <button
            type="button"
            onClick={enviar}
            disabled={!destinatario || enviando}
            style={{ flex: 1, font: "700 13px var(--font-interface)", color: "#fff", background: destinatario && !enviando ? "var(--azul)" : "var(--cinza-inativo)", border: "none", padding: 13, borderRadius: 999, cursor: destinatario && !enviando ? "pointer" : "not-allowed" }}
          >
            {enviando ? "Enviando…" : "Enviar agora"}
          </button>
          <Link
            href={`/estudo/${estudoId}/proposta`}
            style={{ font: "600 13px var(--font-interface)", color: "var(--marinho)", background: "#fff", border: "1.5px solid var(--borda)", padding: "12px 16px", borderRadius: 999, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center" }}
          >
            Baixar A4
          </Link>
        </div>
        {erro && (
          <div style={{ background: "var(--alerta-fundo)", border: "1px solid var(--alerta-borda)", borderRadius: 9, padding: "11px 13px", font: "500 12px/1.6 var(--font-interface)", color: "var(--alerta-texto)" }}>{erro}</div>
        )}
        {enviado && (
          <div style={{ background: "var(--sucesso-fundo)", border: "1px solid var(--sucesso-borda)", borderRadius: 9, padding: "11px 13px", font: "500 12px/1.6 var(--font-interface)", color: "var(--verde-escuro)" }}>
            Enviado — o n8n recebeu o pedido e cuida do envio de verdade.
          </div>
        )}
      </div>
    </div>
  );
}
