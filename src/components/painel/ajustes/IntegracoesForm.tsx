"use client";

import { useState } from "react";
import { salvarWebhookUrl, alternarIntegracao, testarWebhookAction } from "@/app/painel/ajustes/actions";
import { WEBHOOKS, type CampoWebhookUrl, type CampoIntegracaoAtiva } from "@/lib/integracoes-ajustes";

type UrlsIniciais = Record<CampoWebhookUrl, string | null>;
type AtivosIniciais = Record<CampoIntegracaoAtiva, boolean>;

export function IntegracoesForm({ urlsIniciais, ativosIniciais }: { urlsIniciais: UrlsIniciais; ativosIniciais: AtivosIniciais }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 16, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {WEBHOOKS.map((wh) => (
          <CartaoWebhook key={wh.chave} def={wh} urlInicial={urlsIniciais[wh.chave] ?? ""} ativoInicial={wh.campoAtivo ? ativosIniciais[wh.campoAtivo] : null} />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "var(--marinho)", borderRadius: 12, padding: "22px 24px", color: "#fff" }}>
          <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".11em", color: "var(--verde)", marginBottom: 4 }}>Como funciona</div>
          <div style={{ font: "600 19px var(--font-titulo)", margin: "6px 0 12px" }}>O n8n é quem orquestra</div>
          <div style={{ font: "400 12px/1.75 var(--font-interface)", color: "rgba(255,255,255,.75)" }}>
            A ferramenta não fala direto com Google, WhatsApp ou IA. Ela chama um webhook e o n8n cuida do resto. Nenhuma credencial de terceiro fica guardada aqui — você configura tudo lá, uma vez.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.18)" }}>
            {["Ferramenta", "Webhook", "n8n", "Google · Evolution · IA"].map((nome, i, arr) => (
              <div key={nome} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ font: "600 11px var(--font-interface)", color: i === 2 ? "var(--marinho)" : "#fff", background: i === 2 ? "var(--verde)" : "rgba(255,255,255,.16)", padding: "7px 11px", borderRadius: 7, whiteSpace: "nowrap" }}>{nome}</span>
                {i < arr.length - 1 && <span style={{ font: "700 11px var(--font-interface)", color: "rgba(255,255,255,.4)" }}>→</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 3 }}>Webhooks a criar no n8n</div>
          <div style={{ font: "400 11px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 14 }}>
            Um por evento. Os cartões com chave ao lado são serviços que você liga e desliga; estes sete endereços são a canalização, sempre ativa. <strong style={{ color: "var(--marinho)" }}>Lead</strong> e{" "}
            <strong style={{ color: "var(--marinho)" }}>esquecer</strong> não têm chave própria: disparam sozinhos quando o evento acontece.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {WEBHOOKS.map((wh) => (
              <div key={wh.chave} style={{ border: "1px solid var(--borda)", borderRadius: 9, padding: "12px 14px" }}>
                <div style={{ font: "600 11.5px var(--font-interface)", color: "var(--marinho)", wordBreak: "break-all" }}>{wh.rota}</div>
                <div style={{ font: "400 11px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginTop: 4 }}>{wh.quando}</div>
                <div style={{ font: "500 10.5px var(--font-interface)", color: "var(--texto-terciario)", marginTop: 5 }}>envia: {wh.payload}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--nota-fundo)", border: "1px solid var(--nota-borda)", borderRadius: 12, padding: "18px 20px", font: "400 11.5px/1.7 var(--font-interface)", color: "var(--nota-texto)" }}>
          Nenhum webhook recebe valor de cobertura. O evento da agenda leva nome e contato; a mensagem de WhatsApp leva nome, profissão e origem. Os números ficam no sistema.
        </div>
      </div>
    </div>
  );
}

function CartaoWebhook({ def, urlInicial, ativoInicial }: { def: (typeof WEBHOOKS)[number]; urlInicial: string; ativoInicial: boolean | null }) {
  const [url, setUrl] = useState(urlInicial);
  const [salvo, setSalvo] = useState(urlInicial);
  const [ativo, setAtivo] = useState(ativoInicial);
  const [salvando, setSalvando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [testando, setTestando] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{ sucesso: boolean; detalhe: string } | null>(null);

  const sujo = url.trim() !== (salvo ?? "").trim();
  const configurado = !!salvo.trim();

  async function salvar() {
    setSalvando(true);
    try {
      await salvarWebhookUrl(def.chave, url);
      setSalvo(url.trim());
      setConfirmado(true);
      setTimeout(() => setConfirmado(false), 2000);
    } finally {
      setSalvando(false);
    }
  }

  async function testar() {
    setTestando(true);
    setResultadoTeste(null);
    try {
      const r = await testarWebhookAction(url);
      setResultadoTeste(r);
    } finally {
      setTestando(false);
    }
  }

  async function alternar() {
    if (!def.campoAtivo || ativo === null) return;
    const novo = !ativo;
    setAtivo(novo);
    await alternarIntegracao(def.campoAtivo, novo);
  }

  return (
    <div style={{ background: "#fff", border: `1px solid ${configurado ? "var(--sucesso-borda)" : "var(--borda)"}`, borderRadius: 12, padding: "20px 22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", flex: "none", background: configurado ? "var(--verde)" : "var(--cinza-inativo)" }} />
            <span style={{ font: "600 14.5px var(--font-interface)", color: "var(--marinho)" }}>{def.nome}</span>
            <span
              style={{
                font: "700 9px var(--font-interface)",
                textTransform: "uppercase",
                letterSpacing: ".07em",
                color: configurado ? "#fff" : "var(--texto-terciario)",
                background: configurado ? "var(--verde)" : "var(--fundo)",
                padding: "3px 8px",
                borderRadius: 99,
              }}
            >
              {configurado ? "configurado" : "não configurado"}
            </span>
          </div>
          <div style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginTop: 5 }}>{def.desc}</div>
        </div>
        {def.campoAtivo && ativo !== null && (
          <button
            type="button"
            onClick={alternar}
            title={ativo ? "Desligar" : "Ligar"}
            style={{ cursor: "pointer", width: 42, height: 23, borderRadius: 99, flex: "none", background: ativo ? "var(--verde)" : "var(--cinza-inativo)", padding: 2, boxSizing: "border-box", border: "none", display: "flex", justifyContent: ativo ? "flex-end" : "flex-start" }}
          >
            <div style={{ width: 19, height: 19, borderRadius: "50%", background: "#fff" }} />
          </button>
        )}
      </div>

      <div style={{ background: "var(--fundo-alt-2)", borderRadius: 9, padding: "12px 14px" }}>
        <div style={{ font: "700 9px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".09em", color: "var(--texto-terciario)", marginBottom: 7 }}>{def.rotuloCampo}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setResultadoTeste(null);
            }}
            placeholder={def.placeholder}
            style={{ flex: 1, padding: "10px 12px", border: "1.5px solid var(--borda)", borderRadius: 8, font: "500 11.5px var(--font-interface)", background: "#fff", boxSizing: "border-box" }}
          />
          <button
            type="button"
            onClick={testar}
            disabled={!url.trim() || testando}
            style={{ flex: "none", cursor: url.trim() ? "pointer" : "default", font: "600 11.5px var(--font-interface)", color: "var(--azul)", background: "#fff", border: "1.5px solid var(--azul-claro-borda)", padding: "0 14px", borderRadius: 8 }}
          >
            {testando ? "Testando…" : "Testar"}
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={!sujo || salvando}
            style={{
              flex: "none",
              cursor: sujo ? "pointer" : "default",
              font: "700 11.5px var(--font-interface)",
              color: sujo ? "#fff" : confirmado ? "var(--verde-escuro)" : "var(--texto-terciario)",
              background: sujo ? "var(--marinho)" : confirmado ? "var(--sucesso-fundo)" : "var(--fundo)",
              border: sujo ? "none" : "1px solid var(--borda)",
              padding: "0 16px",
              borderRadius: 8,
            }}
          >
            {salvando ? "Salvando…" : sujo ? "Salvar" : confirmado ? "✓ Salvo" : "Salvo"}
          </button>
        </div>
        <div style={{ font: "400 10.5px/1.6 var(--font-interface)", color: "var(--texto-terciario)", marginTop: 7 }}>{def.nota}</div>
        {resultadoTeste && (
          <div style={{ marginTop: 8, font: "600 11px var(--font-interface)", color: resultadoTeste.sucesso ? "var(--verde-escuro)" : "var(--alerta-texto)" }}>
            {resultadoTeste.sucesso ? "✓" : "✕"} {resultadoTeste.detalhe}
          </div>
        )}
      </div>
    </div>
  );
}
