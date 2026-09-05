"use client";

import { useRef, useState } from "react";
import { salvarPerfilCorretor, salvarImagemCorretor, type PerfilCorretorEditavel } from "@/app/painel/ajustes/actions";

const CAMPOS: { chave: keyof PerfilCorretorEditavel; rotulo: string; placeholder: string; nota?: string; largo?: boolean }[] = [
  { chave: "nome", rotulo: "Nome", placeholder: "Edgar Torres" },
  { chave: "cargo", rotulo: "Cargo", placeholder: "Consultor de proteção familiar" },
  { chave: "corretora", rotulo: "Corretora (nome fantasia)", placeholder: "Setor Norte Seguros" },
  { chave: "susep", rotulo: "SUSEP", placeholder: "202087923" },
  { chave: "whatsapp", rotulo: "WhatsApp", placeholder: "(96) 98133-9955" },
  { chave: "emailContato", rotulo: "E-mail de contato", placeholder: "edgar@setornorteseguros.com.br" },
  { chave: "endereco", rotulo: "Endereço", placeholder: "Rua, número, bairro, cidade — UF", largo: true },
  { chave: "razaoSocial", rotulo: "Razão social e CNPJ", placeholder: "Torres Norte Corretora de Seguros Ltda · 00.000.000/0001-00", nota: "Vai no rodapé legal dos documentos.", largo: true },
];

const ONDE_APARECE = [
  "Capa da apresentação e cabeçalho do e-mail — fundo escuro, usa o logo claro.",
  "Cabeçalho da proposta A4 — fundo branco, usa o logo escuro.",
  "Tela inicial do link de captação — fundo escuro, usa o logo claro.",
  "Barra lateral do painel — usa a foto, se houver.",
  "Última tela da apresentação e assinatura do e-mail — usam a foto.",
];

function lerComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(file);
  });
}

export function PerfilMarcaForm({ perfilInicial, fotoInicial, logoClaroInicial, logoEscuroInicial }: { perfilInicial: PerfilCorretorEditavel; fotoInicial: string | null; logoClaroInicial: string | null; logoEscuroInicial: string | null }) {
  const [perfil, setPerfil] = useState(perfilInicial);
  const [salvo, setSalvo] = useState(perfilInicial);
  const [salvando, setSalvando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const sujo = JSON.stringify(perfil) !== JSON.stringify(salvo);

  async function salvar() {
    if (!sujo) return;
    setSalvando(true);
    try {
      await salvarPerfilCorretor(perfil);
      setSalvo(perfil);
      setConfirmado(true);
      setTimeout(() => setConfirmado(false), 2000);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
          <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 3 }}>Foto e logo</div>
          <div style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 16 }}>
            Cada imagem salva sozinha, assim que você escolhe o arquivo — sem precisar do botão de baixo.
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <SlotFoto rotulo="Foto (avatar)" valor={fotoInicial} campo="fotoUrl" formato="circulo" fundo="#fff" corTexto="var(--texto-terciario)" />
            <SlotFoto rotulo="Logo claro" nota="pra fundo escuro" valor={logoClaroInicial} campo="logoClaroUrl" formato="retangulo" fundo="var(--marinho)" corTexto="rgba(255,255,255,.65)" />
            <SlotFoto rotulo="Logo escuro" nota="pra fundo claro" valor={logoEscuroInicial} campo="logoEscuroUrl" formato="retangulo" fundo="#fff" corTexto="var(--texto-terciario)" />
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
          <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 3 }}>Identidade</div>
          <div style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 16 }}>
            Nome, contato e os dados que aparecem no rodapé dos documentos.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {CAMPOS.map((cp) => (
              <div key={cp.chave} style={{ gridColumn: cp.largo ? "1 / -1" : undefined }}>
                <div style={{ font: "600 11.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 5 }}>{cp.rotulo}</div>
                <input
                  type="text"
                  value={perfil[cp.chave]}
                  placeholder={cp.placeholder}
                  onChange={(e) => setPerfil((p) => ({ ...p, [cp.chave]: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid var(--borda)", borderRadius: 9, font: "500 12.5px var(--font-interface)", background: "#fbfdff", boxSizing: "border-box" }}
                />
                {cp.nota && <div style={{ font: "400 10.5px var(--font-interface)", color: "var(--texto-terciario)", marginTop: 4 }}>{cp.nota}</div>}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={salvar}
            disabled={!sujo || salvando}
            style={{
              marginTop: 18,
              cursor: sujo ? "pointer" : "default",
              font: "700 12.5px var(--font-interface)",
              color: sujo ? "#fff" : confirmado ? "var(--verde-escuro)" : "var(--texto-terciario)",
              background: sujo ? "var(--marinho)" : confirmado ? "var(--sucesso-fundo)" : "var(--fundo)",
              border: sujo ? "none" : "1px solid var(--borda)",
              padding: "12px 22px",
              borderRadius: 999,
            }}
          >
            {salvando ? "Salvando…" : sujo ? "Salvar perfil" : confirmado ? "✓ Salvo" : "Nada para salvar"}
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
        <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 12 }}>Onde a marca entra</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {ONDE_APARECE.map((t) => (
            <div key={t} style={{ display: "flex", gap: 9, alignItems: "flex-start", font: "400 11.5px/1.6 var(--font-interface)", color: "var(--texto)" }}>
              <span style={{ color: "var(--azul)", flex: "none" }}>·</span>
              {t}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, background: "var(--nota-fundo)", border: "1px solid var(--nota-borda)", borderRadius: 9, padding: "12px 14px", font: "400 11.5px/1.65 var(--font-interface)", color: "var(--nota-texto)" }}>
          Sem logo ou foto, os materiais mostram um espaço tracejado no lugar — nada trava por causa disso.
        </div>
      </div>
    </div>
  );
}

function SlotFoto({
  rotulo,
  nota,
  valor,
  campo,
  formato,
  fundo,
  corTexto,
}: {
  rotulo: string;
  nota?: string;
  valor: string | null;
  campo: "fotoUrl" | "logoClaroUrl" | "logoEscuroUrl";
  formato: "circulo" | "retangulo";
  fundo: string;
  corTexto: string;
}) {
  const [atual, setAtual] = useState(valor);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function escolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      alert("Escolha um arquivo de imagem.");
      return;
    }
    if (arquivo.size > 1_500_000) {
      alert("Imagem grande demais — tente uma com até ~1,5MB.");
      return;
    }
    setEnviando(true);
    try {
      const dataUrl = await lerComoDataUrl(arquivo);
      await salvarImagemCorretor(campo, dataUrl);
      setAtual(dataUrl);
    } catch {
      alert("Não consegui salvar essa imagem — tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  async function remover() {
    setEnviando(true);
    try {
      await salvarImagemCorretor(campo, null);
      setAtual(null);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div style={{ width: formato === "circulo" ? 88 : 160 }}>
      <div style={{ font: "600 11px var(--font-interface)", color: "var(--marinho)", marginBottom: 6 }}>
        {rotulo}
        {nota && <span style={{ font: "400 10.5px var(--font-interface)", color: "var(--texto-terciario)" }}> · {nota}</span>}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={enviando}
        style={{
          cursor: "pointer",
          width: formato === "circulo" ? 88 : 160,
          height: formato === "circulo" ? 88 : 60,
          borderRadius: formato === "circulo" ? "50%" : 8,
          border: `1.5px dashed ${atual ? "transparent" : "var(--cinza-inativo)"}`,
          background: fundo,
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          padding: 0,
        }}
      >
        {atual ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL local, sem otimização de imagem remota pra fazer
          <img src={atual} alt={rotulo} style={{ width: "100%", height: "100%", objectFit: formato === "circulo" ? "cover" : "contain", padding: formato === "circulo" ? 0 : 8, boxSizing: "border-box" }} />
        ) : (
          <span style={{ font: "600 9px var(--font-interface)", color: corTexto }}>{enviando ? "Enviando…" : "Enviar"}</span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={escolherArquivo} style={{ display: "none" }} />
      {atual && (
        <button type="button" onClick={remover} disabled={enviando} style={{ marginTop: 6, cursor: "pointer", font: "600 10.5px var(--font-interface)", color: "var(--alerta-texto)", background: "none", border: "none", padding: 0 }}>
          Remover
        </button>
      )}
    </div>
  );
}
