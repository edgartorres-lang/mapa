"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { calc, type FatoresCalculo } from "@/lib/calc";
import { pendenciasPorEtapa, type EstudoFormulario } from "@/lib/estudo-formulario";
import { salvarDados, gerarMapa } from "@/app/estudo/actions";
import { Sidebar } from "./Sidebar";
import { Perfil } from "./etapas/Perfil";
import { DependentesObjetivos } from "./etapas/DependentesObjetivos";
import { CustosPatrimonio } from "./etapas/CustosPatrimonio";
import { ContatoConsentimento } from "./etapas/ContatoConsentimento";
import { Resultado } from "./etapas/Resultado";

const TITULOS = [
  { titulo: "Perfil", sub: "Quem é, como trabalha e de onde vem a renda da casa." },
  { titulo: "Dependentes e objetivos", sub: "Quem depende dessa renda, o plano de estudos, prazos e projetos." },
  { titulo: "Custos e patrimônio", sub: "Bem por bem, custo de transmissão e o que já existe de reserva." },
  { titulo: "Contato e consentimento", sub: "Onde falar com o cliente e a autorização de uso dos dados." },
  { titulo: "Resultado", sub: "O mapa fechado: apresentação, proposta em A4 ou e-mail." },
];

const OBRIGATORIAS = [0, 1, 3];

export function EstudoShell({
  estudoId,
  clienteId,
  dadosIniciais,
  fatores,
  statusInicial,
  derivadosCongelados,
  resumoParaVoceInicial,
  analiseInternaInicial,
}: {
  estudoId: string;
  clienteId: string;
  dadosIniciais: EstudoFormulario;
  fatores: FatoresCalculo;
  statusInicial: "aberto" | "gerado";
  derivadosCongelados: ReturnType<typeof calc> | null;
  resumoParaVoceInicial: string | null;
  analiseInternaInicial: string | null;
}) {
  const [dados, setDados] = useState(dadosIniciais);
  const [step, setStep] = useState(0);
  const [salvoEm, setSalvoEm] = useState<string | null>(null);
  const [gerando, startGerar] = useTransition();
  const somenteLeitura = statusInicial === "gerado";
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const c = useMemo(
    () => (somenteLeitura && derivadosCongelados ? derivadosCongelados : calc(dados, fatores, new Date())),
    [dados, fatores, somenteLeitura, derivadosCongelados],
  );

  const pendencias = useMemo(() => pendenciasPorEtapa(dados, new Date()), [dados]);
  const bloqueado = OBRIGATORIAS.some((i) => pendencias[i].length > 0);
  const motivosBloqueio = OBRIGATORIAS.flatMap((i) => pendencias[i]);

  function set(patch: Partial<EstudoFormulario>) {
    if (somenteLeitura) return;
    setDados((d) => ({ ...d, ...patch }));
  }

  // Autosave: grava 900ms depois da última alteração. Não roda se o mapa já foi gerado.
  useEffect(() => {
    if (somenteLeitura) return;
    if (dados === dadosIniciais) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      salvarDados(estudoId, dados).then((r) => setSalvoEm(r.salvoEm));
    }, 900);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados]);

  const rotuloSalvo = somenteLeitura
    ? "Mapa gerado · travado"
    : salvoEm
      ? `Salvo automaticamente · ${new Date(salvoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
      : "Ainda não salvo";

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font-interface)" }}>
      <div style={{ background: "var(--marinho)", position: "sticky", top: 0, zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "15px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
            <Link
              href={`/painel/clientes/${clienteId}`}
              style={{ flex: "none", font: "600 12px var(--font-interface)", color: "rgba(255,255,255,.85)", border: "1px solid rgba(255,255,255,.32)", padding: "8px 13px", borderRadius: 999, whiteSpace: "nowrap" }}
            >
              ← Painel
            </Link>
            <div style={{ minWidth: 0 }}>
              <div style={{ font: "600 16px var(--font-titulo)", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dados.nome || "Novo estudo"}</div>
              <div style={{ font: "400 11px var(--font-interface)", color: "rgba(255,255,255,.62)", marginTop: 2 }}>
                {[dados.profissao, dados.estadoCivil].filter(Boolean).join(" · ") || "Preencha o perfil para começar"}
              </div>
            </div>
          </div>
          <span
            style={{
              font: "600 11px var(--font-interface)",
              color: somenteLeitura ? "#EAFBE3" : "#fff",
              background: somenteLeitura ? "rgba(57,204,0,.22)" : "rgba(255,255,255,.14)",
              border: `1px solid ${somenteLeitura ? "rgba(57,204,0,.5)" : "rgba(255,255,255,.3)"}`,
              padding: "6px 11px",
              borderRadius: 99,
              whiteSpace: "nowrap",
            }}
          >
            {rotuloSalvo}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", background: "var(--fundo)", alignItems: "stretch" }}>
        <Sidebar step={step} setStep={setStep} pendencias={pendencias} c={c} />

        <div style={{ flex: 1, minWidth: 0, padding: "26px 30px", maxWidth: 920 }}>
          <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".09em", color: "var(--texto-terciario)" }}>
            Etapa {step + 1} de 5
          </div>
          <div style={{ font: "600 24px var(--font-titulo)", color: "var(--marinho)", margin: "6px 0 4px" }}>{TITULOS[step].titulo}</div>
          <div style={{ font: "400 13px var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 22 }}>{TITULOS[step].sub}</div>

          {step === 0 && <Perfil dados={dados} set={set} somenteLeitura={somenteLeitura} />}
          {step === 1 && <DependentesObjetivos dados={dados} set={set} somenteLeitura={somenteLeitura} />}
          {step === 2 && <CustosPatrimonio dados={dados} set={set} somenteLeitura={somenteLeitura} />}
          {step === 3 && <ContatoConsentimento dados={dados} set={set} somenteLeitura={somenteLeitura} />}
          {step === 4 && (
            <Resultado
              dados={dados}
              c={c}
              estudoId={estudoId}
              status={statusInicial}
              bloqueado={bloqueado}
              motivosBloqueio={motivosBloqueio}
              gerando={gerando}
              onGerar={() => startGerar(() => gerarMapa(estudoId))}
              resumoParaVoceInicial={resumoParaVoceInicial}
              analiseInternaInicial={analiseInternaInicial}
            />
          )}

          {step < 4 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
                style={{ visibility: step === 0 ? "hidden" : "visible", font: "600 12.5px var(--font-interface)", color: "var(--texto-secundario)", border: "1.5px solid var(--borda)", background: "#fff", padding: "10px 18px", borderRadius: 999, cursor: "pointer" }}
              >
                ← Voltar
              </button>
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(4, s + 1))}
                style={{ font: "700 12.5px var(--font-interface)", color: "#fff", background: "var(--marinho)", border: "none", padding: "11px 22px", borderRadius: 999, cursor: "pointer" }}
              >
                Continuar →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
