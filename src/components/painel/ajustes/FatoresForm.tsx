"use client";

import { useMemo, useState } from "react";
import { calc } from "@/lib/calc";
import type { EstudoFormulario } from "@/lib/estudo-formulario";
import { paraFatoresCalc } from "@/lib/fatores-calculo";
import { brl } from "@/lib/formato";
import { GRUPOS_FATORES, FATORES_PADRAO_AJUSTES, NOTA_CAMADA, type FatoresCalculoEditavel, type CampoFator } from "@/lib/fatores-ajustes";
import { salvarFatoresCalculo } from "@/app/painel/ajustes/actions";

interface Simulacao {
  clienteNome: string;
  dados: EstudoFormulario;
}

const LINHAS_SIMULACAO: { rotulo: string; chave: "totalVida" | "vitalicia" | "temporaria" | "pensaoMensal" | "dit" | "doencasGraves" }[] = [
  { rotulo: "Capital em seguro de vida", chave: "totalVida" },
  { rotulo: "Cobertura vitalícia", chave: "vitalicia" },
  { rotulo: "Cobertura temporária", chave: "temporaria" },
  { rotulo: "Pensão de educação (mês)", chave: "pensaoMensal" },
  { rotulo: "DIT (mês)", chave: "dit" },
  { rotulo: "Doenças graves", chave: "doencasGraves" },
];

function numParaTexto(v: number, decimal?: boolean): string {
  return decimal ? String(v).replace(".", ",") : String(v);
}
function textoParaNum(txt: string): number {
  const n = parseFloat(txt.replace(",", "."));
  return isNaN(n) ? 0 : n;
}

export function FatoresForm({
  fatoresIniciais,
  simulacao,
  contagemEstudosAbertos,
  contagemMapas,
}: {
  fatoresIniciais: FatoresCalculoEditavel;
  simulacao: Simulacao | null;
  contagemEstudosAbertos: number;
  contagemMapas: number;
}) {
  const [salvo, setSalvo] = useState(fatoresIniciais);
  const [f, setF] = useState(fatoresIniciais);
  const [salvando, setSalvando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  const sujo = JSON.stringify(f) !== JSON.stringify(salvo);
  const alterado = JSON.stringify(salvo) !== JSON.stringify(FATORES_PADRAO_AJUSTES);

  const campos = useMemo(() => GRUPOS_FATORES.flatMap((g) => g.campos), []);
  const mudancas = campos.filter((cp) => f[cp.chave] !== salvo[cp.chave]);
  const temLive = mudancas.some((cp) => cp.camada === "live");
  const temPadrao = mudancas.some((cp) => cp.camada === "padrao");
  const temSoInerte = mudancas.length > 0 && mudancas.every((cp) => cp.camada === "inerte");

  function alterarCampo(chave: keyof FatoresCalculoEditavel, valor: string) {
    setF((s) => ({ ...s, [chave]: textoParaNum(valor) }));
    setConfirmado(false);
  }

  async function salvar() {
    if (!sujo) return;
    setSalvando(true);
    try {
      await salvarFatoresCalculo(f);
      setSalvo(f);
      setConfirmado(true);
    } finally {
      setSalvando(false);
    }
  }

  function restaurar() {
    setF(FATORES_PADRAO_AJUSTES);
    setSalvo(FATORES_PADRAO_AJUSTES);
    setConfirmado(false);
    salvarFatoresCalculo(FATORES_PADRAO_AJUSTES);
  }

  const cAtual = simulacao ? calc(simulacao.dados, paraFatoresCalc(f)) : null;
  const cSalvo = simulacao ? calc(simulacao.dados, paraFatoresCalc(salvo)) : null;

  let efeitoTitulo: string;
  let efeitoTexto: string;
  if (sujo && (temLive || temPadrao)) {
    const partes = [temLive && `${contagemEstudosAbertos} ${contagemEstudosAbertos === 1 ? "estudo" : "estudos"} em aberto`, temPadrao && "o padrão de estudos novos"].filter(Boolean);
    efeitoTitulo = "Ao salvar, muda " + partes.join(" e ");
    efeitoTexto =
      (temLive ? `Os estudos em aberto recalculam com os valores novos assim que a tela deles recarregar. ` : "") +
      (temPadrao ? `Estudos criados a partir de agora já nascem com o padrão novo — os que já estão abertos guardaram o valor de quando nasceram e não mudam sozinhos (dá pra ajustar caso a caso, dentro do estudo).` : "");
  } else if (sujo && temSoInerte) {
    efeitoTitulo = "Sem efeito no cálculo ainda";
    efeitoTexto = "Só campos que calc.ts ainda não lê foram alterados — fica salvo para referência, mas nenhum número muda.";
  } else if (confirmado) {
    efeitoTitulo = "Fatores aplicados";
    efeitoTexto = "Salvo. Os estudos em aberto (parte deles, pelo menos) já refletem os novos valores.";
  } else if (alterado) {
    efeitoTitulo = "Fatores personalizados em uso";
    efeitoTexto = "Os valores salvos hoje já são diferentes do padrão do racional. Restaurar volta tudo ao padrão.";
  } else {
    efeitoTitulo = "Nada muda agora";
    efeitoTexto = "Os fatores estão nos valores padrão do racional. Altere um campo para ver o efeito antes de salvar.";
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {GRUPOS_FATORES.map((g) => (
          <div key={g.nome} style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 3 }}>{g.nome}</div>
            <div style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 14 }}>{g.sub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {g.campos.map((cp) => (
                <CampoLinha key={cp.chave} campo={cp} valor={f[cp.chave]} valorSalvo={salvo[cp.chave]} onChange={(v) => alterarCampo(cp.chave, v)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 26 }}>
        <div style={{ background: "var(--marinho)", borderRadius: 12, padding: "22px 24px", color: "#fff" }}>
          <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".11em", color: "var(--verde)", marginBottom: 4 }}>Efeito ao salvar</div>
          <div style={{ font: "600 20px var(--font-titulo)", margin: "6px 0 12px" }}>{efeitoTitulo}</div>
          <div style={{ font: "400 12px/1.7 var(--font-interface)", color: "rgba(255,255,255,.75)", marginBottom: 16 }}>{efeitoTexto}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.18)" }}>
            <LinhaContagem rotulo="Estudos em aberto" valor={`${contagemEstudosAbertos}`} />
            <LinhaContagem rotulo="Mapas gerados" valor={`${contagemMapas} intactos`} />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button
              type="button"
              onClick={restaurar}
              style={{ cursor: "pointer", flex: "none", font: "600 12px var(--font-interface)", color: "rgba(255,255,255,.85)", background: "none", border: "1px solid rgba(255,255,255,.32)", padding: "11px 15px", borderRadius: 999 }}
            >
              Restaurar
            </button>
            <button
              type="button"
              onClick={salvar}
              disabled={!sujo || salvando}
              style={{
                cursor: sujo ? "pointer" : "default",
                flex: 1,
                font: "700 12.5px var(--font-interface)",
                color: sujo ? "var(--marinho)" : confirmado ? "var(--sucesso-fundo)" : "rgba(255,255,255,.5)",
                background: sujo ? "var(--verde)" : confirmado ? "rgba(57,204,0,.28)" : "rgba(255,255,255,.18)",
                border: "none",
                padding: 12,
                borderRadius: 999,
              }}
            >
              {salvando ? "Salvando…" : sujo ? "Salvar e recalcular" : confirmado ? "✓ Salvo" : "Nada para salvar"}
            </button>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
          <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 3 }}>
            {simulacao ? "Efeito nos números — exemplo real" : "Efeito nos números"}
          </div>
          <div style={{ font: "400 11px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 14 }}>
            {simulacao
              ? `Pra você conferir o efeito antes de salvar, uso um estudo de verdade que já está em aberto — o de ${simulacao.clienteNome.split(" ")[0]} calhou de ser o escolhido, só porque já tem renda preenchida. Nada é enviado nem alterado; é só um cálculo de exemplo, ao vivo, enquanto você mexe nos campos ao lado.`
              : "Nenhum estudo em aberto agora pra servir de exemplo — assim que houver um, o efeito de qualquer mudança aparece aqui antes de você salvar."}
          </div>
          {simulacao && cAtual && cSalvo && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {LINHAS_SIMULACAO.map((ln) => {
                const v = cAtual[ln.chave];
                const a = cSalvo[ln.chave];
                const dif = v - a;
                const p = a ? Math.round((dif / a) * 100) : 0;
                const difTexto = dif === 0 ? "sem mudança" : (dif > 0 ? "+" : "") + p + "%";
                const difCor = dif > 0 ? "var(--verde-escuro)" : dif < 0 ? "var(--alerta-texto)" : "var(--texto-terciario)";
                return (
                  <div key={ln.chave}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                      <span style={{ font: "500 12px var(--font-interface)", color: "var(--texto)" }}>{ln.rotulo}</span>
                      <span style={{ font: "700 12.5px var(--font-interface)", color: "var(--marinho)" }}>{brl(v)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginTop: 2 }}>
                      <span style={{ font: "400 10.5px var(--font-interface)", color: "var(--texto-terciario)" }}>salvo {brl(a)}</span>
                      <span style={{ font: "600 10.5px var(--font-interface)", color: difCor }}>{difTexto}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ background: "var(--nota-fundo)", border: "1px solid var(--nota-borda)", borderRadius: 12, padding: "18px 20px", font: "400 11.5px/1.7 var(--font-interface)", color: "var(--nota-texto)" }}>
          Os mapas já gerados não mudam — o snapshot fica travado. Se um cliente pedir o número novo, o caminho é duplicar o estudo.
        </div>
      </div>
    </div>
  );
}

function LinhaContagem({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, font: "500 12px var(--font-interface)", color: "rgba(255,255,255,.7)" }}>
      <span>{rotulo}</span>
      <span style={{ fontWeight: 700, color: "#fff" }}>{valor}</span>
    </div>
  );
}

function CampoLinha({ campo, valor, valorSalvo, onChange }: { campo: CampoFator; valor: number; valorSalvo: number; onChange: (v: string) => void }) {
  const travado = campo.camada === "travado";
  const alteradoAgora = valor !== valorSalvo;
  const borda = alteradoAgora ? "var(--azul)" : valor !== FATORES_PADRAO_AJUSTES[campo.chave] ? "var(--sucesso-borda)" : "var(--borda)";
  const nota = NOTA_CAMADA[campo.camada];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 116px", gap: 14, alignItems: "center", paddingBottom: 11, borderBottom: "1px solid var(--fundo-alt)" }}>
      <div>
        <div style={{ font: "600 12.5px var(--font-interface)", color: travado ? "var(--texto-terciario)" : "var(--marinho)" }}>{campo.rotulo}</div>
        <div style={{ font: "400 11px/1.55 var(--font-interface)", color: "var(--texto-terciario)", marginTop: 2 }}>{campo.nota}</div>
        {nota && <div style={{ font: "600 10px/1.5 var(--font-interface)", color: "var(--nota-texto)", marginTop: 3 }}>{nota}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "flex-end" }}>
        <input
          type="text"
          value={numParaTexto(valor, campo.decimal)}
          onChange={(e) => onChange(e.target.value)}
          disabled={travado}
          style={{
            width: 62,
            padding: "9px 10px",
            border: `1.5px solid ${borda}`,
            borderRadius: 8,
            font: "700 13px var(--font-interface)",
            color: travado ? "var(--texto-terciario)" : "var(--marinho)",
            background: travado ? "var(--fundo)" : "#fbfdff",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        />
        <span style={{ font: "500 11.5px var(--font-interface)", color: "var(--texto-terciario)", width: 42 }}>{campo.unidade}</span>
      </div>
    </div>
  );
}
