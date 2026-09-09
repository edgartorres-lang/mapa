"use client";

import Link from "next/link";
import type { CalcResultado } from "@/lib/calc";
import { brl } from "@/lib/formato";

const NOMES_ETAPA = ["Perfil", "Dependentes e objetivos", "Custos e patrimônio", "Observações", "Resultado"];
// Só Perfil (0) e Dependentes (1) bloqueiam — Custos e patrimônio (2) nunca bloqueou (mesmo
// padrão do protótipo) e Observações (3) é texto livre opcional desde que o consentimento LGPD
// deixou de ter checkbox no wizard do corretor (2026-09-06, ver EstudoShell.tsx).
const OBRIGATORIAS = [0, 1];

export function Sidebar({
  step,
  setStep,
  pendencias,
  c,
  estudoId,
  status,
}: {
  step: number;
  setStep: (i: number) => void;
  pendencias: string[][];
  c: CalcResultado;
  estudoId: string;
  status: "aberto" | "gerado";
}) {
  const bloqueado = OBRIGATORIAS.some((i) => pendencias[i].length > 0);
  const completas = pendencias.filter((x) => x.length === 0).length;
  const pct = Math.round((completas / 4) * 100);

  const selo = (texto: string, ok: boolean) => ({ texto, ok });
  const selos = [
    selo("Vitalícia", c.vitalicia > 0),
    selo(c.temDep ? "Temporária" : "Temporária — sem dependentes", c.temDep && c.temporaria > 0),
    selo(c.pensaoMensal > 0 ? "Pensão de criação" : "Criação — falta plano", c.pensaoMensal > 0),
    selo(c.invalidezAplicavel ? "Invalidez + renda" : "Invalidez (sem renda vitalícia)", c.invalidezAcidente > 0),
    selo("DIT e doenças graves", c.dit > 0),
  ];

  return (
    <div style={{ width: 262, flex: "none", boxSizing: "border-box", borderRight: "1px solid var(--borda)", padding: "20px 18px", background: "#fff", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".09em", color: "var(--texto-terciario)", marginBottom: 12 }}>
        Andamento
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 6, borderRadius: 99, background: "var(--azul-claro-fundo)", overflow: "hidden" }}>
          <div style={{ height: "100%", background: "var(--verde)", width: `${pct}%` }} />
        </div>
        <span style={{ font: "700 11px var(--font-interface)", color: "var(--marinho)" }}>{pct}%</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {NOMES_ETAPA.map((nome, i) => {
          const ativo = i === step;
          const completo = i < 4 && pendencias[i].length === 0;
          const trava = i === 4 && bloqueado;
          return (
            <div
              key={nome}
              onClick={() => setStep(i)}
              style={{
                display: "flex",
                gap: 11,
                padding: "11px 12px",
                borderRadius: 9,
                cursor: "pointer",
                background: ativo ? "var(--azul-claro-fundo)" : completo ? "var(--sucesso-fundo)" : "transparent",
                border: `1px solid ${ativo ? "var(--azul-claro-borda)" : "transparent"}`,
                opacity: trava ? 0.55 : 1,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  flex: "none",
                  display: "grid",
                  placeItems: "center",
                  font: "700 11px var(--font-interface)",
                  background: completo ? "var(--verde)" : ativo ? "var(--azul)" : "transparent",
                  color: completo || ativo ? "#fff" : i === 4 ? "var(--texto-terciario)" : "var(--alerta-texto)",
                  border: `1.5px solid ${completo ? "var(--verde)" : ativo ? "var(--azul)" : i === 4 ? "var(--texto-terciario)" : "var(--alerta-texto)"}`,
                }}
              >
                {completo ? "✓" : i + 1}
              </div>
              <div>
                <div style={{ font: "600 13px var(--font-interface)", color: "var(--texto)" }}>{nome}</div>
                <div style={{ font: "400 11px/1.5 var(--font-interface)", marginTop: 3, color: i === 4 ? (bloqueado ? "var(--texto-terciario)" : "var(--verde-escuro)") : completo ? "var(--texto-secundario)" : "var(--alerta-texto)" }}>
                  {i === 4
                    ? bloqueado
                      ? "Liberado após as pendências"
                      : "Pronto para gerar"
                    : completo
                      ? "Completo"
                      : `Falta: ${pendencias[i].join(", ")}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20, padding: 14, borderRadius: 9, background: "var(--fundo)", border: "1px solid var(--borda)" }}>
        <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--texto-terciario)", marginBottom: 8 }}>
          Renda considerada
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { rotulo: "Segurado", valor: brl(c.rendaMensal), cor: "var(--marinho)" },
            { rotulo: "Cônjuge", valor: brl(c.rendaConjugeIncl), cor: "var(--texto-secundario)" },
            { rotulo: "Terceiros", valor: brl(c.terceirosIncl), cor: "var(--texto-secundario)" },
            { rotulo: "Participação", valor: `${Math.round(c.participacao * 100)}%`, cor: "var(--azul)" },
          ].map((rr) => (
            <div key={rr.rotulo} style={{ display: "flex", justifyContent: "space-between", gap: 8, font: "500 11px var(--font-interface)", color: "var(--texto-secundario)" }}>
              <span>{rr.rotulo}</span>
              <span style={{ fontWeight: 700, color: rr.cor }}>{rr.valor}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12, padding: 14, borderRadius: 9, background: "var(--nota-fundo)", border: "1px solid var(--nota-borda)" }}>
        <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--nota-texto)", marginBottom: 6 }}>
          Módulos ativos
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {selos.map((s) => (
            <span
              key={s.texto}
              style={{
                font: "600 10.5px var(--font-interface)",
                padding: "4px 8px",
                borderRadius: 99,
                background: "#fff",
                color: s.ok ? "var(--marinho)" : "var(--texto-terciario)",
                border: `1.5px ${s.ok ? "solid" : "dashed"} ${s.ok ? "var(--nota-borda)" : "var(--borda)"}`,
              }}
            >
              {s.texto}
            </span>
          ))}
        </div>
      </div>

      {/* Fixo na Sidebar (2026-09-09, pedido do Edgar) — antes só aparecia na etapa Resultado, lá
          embaixo; agora dá pra abrir qualquer formato de qualquer etapa, sem precisar navegar até
          o final do wizard toda vez. Só aparece com o mapa já gerado (travado). */}
      {status === "gerado" && (
        <div style={{ marginTop: 12, padding: 14, borderRadius: 9, background: "var(--sucesso-fundo)", border: "1px solid var(--sucesso-borda)" }}>
          <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".08em", color: "var(--texto-terciario)", marginBottom: 8 }}>
            Mapa gerado
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Link href={`/estudo/${estudoId}/apresentacao`} style={{ display: "block", padding: "9px 10px", borderRadius: 7, background: "#fff", border: "1px solid var(--borda)", font: "700 12px var(--font-interface)", color: "var(--marinho)" }}>
              Apresentação
            </Link>
            <Link href={`/estudo/${estudoId}/proposta`} style={{ display: "block", padding: "9px 10px", borderRadius: 7, background: "#fff", border: "1px solid var(--borda)", font: "700 12px var(--font-interface)", color: "var(--marinho)" }}>
              Proposta A4
            </Link>
            <Link href={`/estudo/${estudoId}/email`} style={{ display: "block", padding: "9px 10px", borderRadius: 7, background: "#fff", border: "1px solid var(--borda)", font: "700 12px var(--font-interface)", color: "var(--marinho)" }}>
              E-mail
            </Link>
          </div>
          <Link href={`/estudo/${estudoId}/memoria`} style={{ display: "block", marginTop: 8, font: "600 11px var(--font-interface)", color: "var(--azul)" }}>
            Ver memória de cálculo →
          </Link>
        </div>
      )}
    </div>
  );
}
