"use client";

import Link from "next/link";
import type { EstudoFormulario } from "@/lib/estudo-formulario";
import type { CalcResultado } from "@/lib/calc";
import { brl, brlCurto } from "@/lib/formato";
import styles from "@/components/ui/campos.module.css";

const CORES_CATEGORIA = ["#0F3D63", "#1B72BE", "#39CC00", "#D9A400"];

export function Resultado({
  dados,
  c,
  estudoId,
  status,
  bloqueado,
  motivosBloqueio,
  onGerar,
  gerando,
}: {
  dados: EstudoFormulario;
  c: CalcResultado;
  estudoId: string;
  status: "aberto" | "gerado";
  bloqueado: boolean;
  motivosBloqueio: string[];
  onGerar: () => void;
  gerando: boolean;
}) {
  const maxCat = Math.max(c.vitalicia, c.temporaria, c.custoEducacaoTotal, Math.max(c.invalidezAcidente, c.doencasGraves), 1);
  const excedente = c.capitalAProteger < 0;

  const categorias = [
    { rotulo: "Proteção vitalícia", valor: c.vitalicia, cor: CORES_CATEGORIA[0], nota: `${brl(c.modUmAnoRenda)} de um ano de renda + custo de transmissão` },
    { rotulo: "Proteção temporária", valor: c.temporaria, cor: CORES_CATEGORIA[1], nota: `${dados.prazoManutencao} anos de padrão de vida${c.modObjetivos ? ` + ${brl(c.modObjetivos)} de objetivos` : ""}` },
    { rotulo: "Educação dos filhos", valor: c.custoEducacaoTotal, cor: CORES_CATEGORIA[2], nota: `referência; pago como pensão de ${brl(c.pensaoMensal)}/mês` },
    { rotulo: "Capacidade de renda", valor: Math.max(c.invalidezAcidente, c.doencasGraves), cor: CORES_CATEGORIA[3], nota: "maior entre invalidez por acidente e doenças graves" },
  ];

  const necessidadeLinhas = [
    { rotulo: "Vitalícia — transmissão sucessória e um ano de renda", valor: brl(c.vitalicia) },
    { rotulo: "Temporária — padrão de vida e objetivos", valor: brl(c.temporaria) },
    { rotulo: "Educação — custo total até a formação", valor: brl(c.custoEducacaoTotal) },
  ];

  const protegidoLinhas = [
    { rotulo: "Patrimônio liquidável", valor: brl(c.patrimonioLiquidavel) },
    { rotulo: "Saldo FGTS", valor: brl(dados.fgts) },
    { rotulo: "Acumulado INSS/outros", valor: brl(dados.inss) },
    { rotulo: "Previdência privada", valor: brl(dados.prevPrivada) },
    { rotulo: "Seguro de vida existente", valor: brl(dados.seguroAtual) },
  ];

  const coberturas = [
    { titulo: "Vida — vitalícia (sucessão e um ano de renda)", valor: brl(c.vitalicia), nota: `${brl(c.patrimonioTotal)} de patrimônio × ${dados.pctSucessao}% de custo de transmissão = ${brl(c.modSucessao)}, mais ${brl(c.modUmAnoRenda)} de um ano de renda.` },
    { titulo: `Vida — temporária (padrão de vida por ${dados.prazoManutencao} anos)`, valor: brl(c.temporaria), nota: c.temDep ? `${brl(c.rendaEquiv)} de renda ajustada × ${Math.round(c.participacao * 100)}% de participação × ${dados.prazoManutencao * 12} meses, menos ${brl(c.receitasLiquidaveis)} de receitas liquidáveis${c.modObjetivos ? `, mais ${brl(c.modObjetivos)} de projetos e objetivos` : ""}.` : "Sem dependentes financeiros; entra apenas o valor de projetos e objetivos." },
    { titulo: "Pensão por morte — educação", valor: `${brl(c.pensaoMensal)}/mês`, nota: c.pensaoMensal > 0 ? `${brl(c.custoEducacaoTotal)} de custo educacional × ${Math.round(c.fatorPensao * 100)}% de fator de pensão × ${Math.round(c.participacao * 100)}% de participação, diluídos em ${c.prazoPensao} anos. Média sem diluição: ${brl(c.mediaAteFormar)}/mês até a formação.` : "Sem planejamento educacional informado." },
    { titulo: "Invalidez total por acidente", valor: brl(c.invalidezAcidente), nota: `5 anos de renda (${brl(c.rendaMensal)} × 12 × 5).` },
    { titulo: "Invalidez por doença", valor: brl(c.invalidezDoenca), nota: "50% do capital de invalidez por acidente." },
    { titulo: "Renda vitalícia por invalidez", valor: c.rendaInvalidezVitalicia > 0 ? `${brl(c.rendaInvalidezVitalicia)}/mês` : "não se aplica", nota: c.rendaInvalidezVitalicia > 0 ? "50% da renda mensal, contínua." : "Servidor público já recebe aposentadoria por invalidez pelo RPPS." },
    { titulo: "Diária por incapacidade temporária (DIT)", valor: `${brl(c.dit)}/mês`, nota: "70% da renda mensal enquanto durar o afastamento." },
    { titulo: "Doenças graves", valor: brl(c.doencasGraves), nota: "1,5 × a renda anual, pago no diagnóstico, para tratar sem consumir reservas." },
  ];

  if (bloqueado) {
    return (
      <div style={{ background: "var(--alerta-fundo)", border: "1px solid var(--alerta-borda)", borderRadius: 12, padding: 24 }}>
        <div style={{ font: "600 16px var(--font-titulo)", color: "var(--alerta-texto)", marginBottom: 8 }}>
          Ainda falta informação para fechar o mapa
        </div>
        <div style={{ font: "400 12.5px/1.7 var(--font-interface)", color: "var(--texto-secundario)" }}>
          Falta: {motivosBloqueio.join(", ")}.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: "var(--marinho)", borderRadius: 12, padding: "24px 26px", color: "#fff", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20 }}>
          <div>
            <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".12em", color: "var(--verde)" }}>
              Capital sugerido em seguro de vida
            </div>
            <div style={{ font: "600 40px var(--font-titulo)", marginTop: 6 }}>{brlCurto(c.totalVida)}</div>
          </div>
          <div style={{ textAlign: "right", font: "400 12px/1.8 var(--font-interface)", color: "rgba(255,255,255,.78)" }}>
            Cobertura vitalícia {brlCurto(c.vitalicia)}
            <br />
            Cobertura temporária {brlCurto(c.temporaria)}
            <br />
            Pensão de educação {brl(c.pensaoMensal)}/mês
          </div>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "22px 24px", marginBottom: 16 }}>
        <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 16 }}>Resumo da sua proteção</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {categorias.map((ct) => (
            <div key={ct.rotulo}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                <span style={{ font: "600 12.5px var(--font-interface)", color: "var(--marinho)" }}>{ct.rotulo}</span>
                <span style={{ font: "700 14px var(--font-interface)", color: ct.cor }}>{brl(ct.valor)}</span>
              </div>
              <div style={{ height: 20, borderRadius: 6, background: "var(--fundo)", overflow: "hidden" }}>
                <div style={{ height: "100%", background: ct.cor, width: `${Math.round((ct.valor / maxCat) * 100)}%` }} />
              </div>
              <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)", marginTop: 4 }}>{ct.nota}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
          <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".11em", color: "var(--verde-escuro)" }}>Já protegido</div>
          <div style={{ font: "600 26px var(--font-titulo)", color: "var(--marinho)", margin: "6px 0 12px" }}>{brlCurto(c.receitasLiquidaveis)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {protegidoLinhas.map((p) => (
              <div key={p.rotulo} style={{ display: "flex", justifyContent: "space-between", gap: 12, font: "500 12px var(--font-interface)", color: "var(--texto-secundario)", paddingBottom: 6, borderBottom: "1px dotted var(--borda)" }}>
                <span>{p.rotulo}</span>
                <span style={{ fontWeight: 700, color: "var(--texto)" }}>{p.valor}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
          <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".11em", color: "var(--azul)" }}>
            {excedente ? "Capital excedente" : "Capital a proteger"}
          </div>
          <div style={{ font: "600 26px var(--font-titulo)", color: "var(--marinho)", margin: "6px 0 12px" }}>{brlCurto(Math.abs(c.capitalAProteger))}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {necessidadeLinhas.map((p) => (
              <div key={p.rotulo} style={{ display: "flex", justifyContent: "space-between", gap: 12, font: "500 12px var(--font-interface)", color: "var(--texto-secundario)", paddingBottom: 6, borderBottom: "1px dotted var(--borda)" }}>
                <span>{p.rotulo}</span>
                <span style={{ fontWeight: 700, color: "var(--texto)" }}>{p.valor}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {c.tetoAtingido && (
        <div style={{ background: "var(--nota-fundo)", border: "1px solid var(--nota-borda)", borderRadius: 12, padding: "16px 18px", marginBottom: 16, font: "400 12px/1.7 var(--font-interface)", color: "var(--nota-texto)" }}>
          A necessidade líquida de {brl(c.necessidadeLiquida)} ultrapassou o teto de razoabilidade de {dados.teto}× a
          renda anual ({brl(c.teto)}). O valor apresentado está limitado ao teto.
        </div>
      )}

      <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "22px 24px", marginBottom: 16 }}>
        <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 14 }}>Coberturas calculadas</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {coberturas.map((cb) => (
            <div key={cb.titulo} style={{ display: "grid", gridTemplateColumns: "1fr 170px", gap: 16, alignItems: "baseline", padding: "12px 0", borderBottom: "1px solid var(--fundo-alt)" }}>
              <div>
                <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto)" }}>{cb.titulo}</div>
                <div style={{ font: "400 11px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginTop: 2 }}>{cb.nota}</div>
              </div>
              <div style={{ textAlign: "right", font: "700 15px var(--font-interface)", color: "var(--marinho)" }}>{cb.valor}</div>
            </div>
          ))}
        </div>
      </div>

      {status === "aberto" ? (
        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)" }}>Gerar o mapa</div>
          <div style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-secundario)", margin: "3px 0 14px" }}>
            Ao gerar, estes números travam — não mudam mais, nem se os fatores de cálculo mudarem depois.
          </div>
          <button type="button" onClick={onGerar} disabled={gerando} className={styles.botaoPrimario}>
            {gerando ? "Gerando…" : "Gerar Mapa da Proteção"}
          </button>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid var(--sucesso-borda)", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 4 }}>Mapa da Proteção gerado · travado</div>
          <div style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 14 }}>
            Os três formatos usam os mesmos números do estudo. Não existe botão de editar — a correção é
            duplicar o estudo (Etapa 4, ainda não construída).
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            <Link href={`/estudo/${estudoId}/apresentacao`} style={{ border: "1.5px solid var(--borda)", borderRadius: 12, padding: "15px 16px", display: "block" }}>
              <div style={{ font: "700 13px var(--font-interface)", color: "var(--marinho)" }}>Apresentação</div>
              <div style={{ font: "400 11.5px/1.55 var(--font-interface)", color: "var(--texto-secundario)", marginTop: 3 }}>16:9 para a reunião. Seis telas.</div>
            </Link>
            <Link href={`/estudo/${estudoId}/proposta`} style={{ border: "1.5px solid var(--borda)", borderRadius: 12, padding: "15px 16px", display: "block" }}>
              <div style={{ font: "700 13px var(--font-interface)", color: "var(--marinho)" }}>Proposta</div>
              <div style={{ font: "400 11.5px/1.55 var(--font-interface)", color: "var(--texto-secundario)", marginTop: 3 }}>A4 em 3 páginas, pra imprimir.</div>
            </Link>
            <Link href={`/estudo/${estudoId}/email`} style={{ border: "1.5px solid var(--borda)", borderRadius: 12, padding: "15px 16px", display: "block" }}>
              <div style={{ font: "700 13px var(--font-interface)", color: "var(--marinho)" }}>E-mail</div>
              <div style={{ font: "400 11.5px/1.55 var(--font-interface)", color: "var(--texto-secundario)", marginTop: 3 }}>Resumo no corpo, A4 anexado.</div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
