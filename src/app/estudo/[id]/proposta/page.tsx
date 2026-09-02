import { carregarSaida } from "@/lib/carregar-saida";
import { BarraSaida } from "@/components/saida/BarraSaida";

/**
 * Três páginas A4 (794×1123 a 96dpi), impressas em pé. Porta fiel da seção "PROPOSTA A4" em
 * Mapa da Proteção 1a+1b - Unificado.dc.html (~linha 694-836).
 */
export default async function PaginaProposta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { r, mapa } = await carregarSaida(id);
  const resumoParaVoce = mapa.resumoParaVoce ? mapa.resumoParaVoce.split("\n").filter(Boolean) : null;

  return (
    <div className="pchain" style={{ minHeight: "100vh", padding: "26px 30px", fontFamily: "var(--font-interface)" }}>
      <BarraSaida estudoId={id} modo="a4" rotuloBotao="Baixar PDF · A4" notaDireita={r.anexoNome} />

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Página 1 */}
        <div className="a4 paper" style={{ width: 794, height: 1123, background: "#fff", boxSizing: "border-box", padding: "60px 64px 48px", display: "flex", flexDirection: "column", color: "var(--texto)", border: "1px solid var(--borda)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 14, borderBottom: "1px solid var(--texto)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 84, height: 24, border: "1px dashed var(--texto-terciario)", borderRadius: 3, display: "grid", placeItems: "center", font: "600 7px var(--font-interface)", color: "var(--texto-terciario)" }}>LOGO</div>
              <span style={{ font: "600 12px var(--font-interface)" }}>{r.corretora}</span>
            </div>
            <div style={{ font: "400 9.5px/1.5 var(--font-interface)", color: "var(--texto-secundario)", textAlign: "right" }}>
              {r.susep}
              <br />
              {r.dataCurta} · pág. 1 de 3
            </div>
          </div>

          <div style={{ marginTop: 36 }}>
            <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".18em", color: "var(--verde)", marginBottom: 10 }}>Mapa da proteção</div>
            <div style={{ font: "600 30px/1.2 var(--font-titulo)", marginBottom: 8 }}>{r.nome}</div>
            <div style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-secundario)" }}>{r.subtitulo}</div>
          </div>

          <div style={{ marginTop: 34, borderTop: "1px solid var(--borda)", borderBottom: "1px solid var(--borda)", padding: "22px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".12em", color: "var(--texto-secundario)", marginBottom: 7 }}>Capital sugerido em seguro de vida</div>
              <div style={{ font: "600 34px var(--font-titulo)" }}>{r.totalVida}</div>
            </div>
            <div style={{ font: "400 10px/1.6 var(--font-interface)", color: "var(--texto-secundario)", textAlign: "right" }}>
              Cobertura vitalícia {r.vitalicia}
              <br />
              Cobertura temporária {r.temporaria}
              <br />
              Pensão de educação {r.pensaoMensal}/mês
            </div>
          </div>

          <div style={{ marginTop: 26 }}>
            <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".12em", color: "var(--texto-secundario)", marginBottom: 10 }}>Notas de contexto</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {r.notasContexto.map((nc) => (
                <div key={nc.rotulo} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "8px 0", borderBottom: "1px dotted #B9C6D2", font: "500 10.5px var(--font-interface)" }}>
                  <span>{nc.rotulo}</span>
                  <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{nc.valor}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 26 }}>
            <div style={{ font: "600 15px var(--font-titulo)", marginBottom: 4 }}>Resumo para você</div>
            <div style={{ font: "400 9.5px var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 12 }}>Texto preparado a partir das suas respostas.</div>
            <div style={{ borderLeft: "2px solid var(--verde)", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {resumoParaVoce ? (
                resumoParaVoce.map((p, i) => (
                  <div key={i} style={{ font: "400 11px/1.8 var(--font-interface)", color: "var(--texto)" }}>{p}</div>
                ))
              ) : (
                <div style={{ font: "400 11px/1.8 var(--font-interface)", color: "var(--texto-terciario)" }}>
                  Texto ainda não gerado nesta etapa (Etapa 5).
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ font: "400 8.5px/1.5 var(--font-interface)", color: "var(--texto-secundario)", paddingTop: 12, borderTop: "1px solid var(--borda)" }}>
            {r.rodapeLegal} · Simulação de referência, não constitui proposta formal de seguro.
          </div>
        </div>

        {/* Página 2 */}
        <div className="a4 paper" style={{ width: 794, height: 1123, background: "#fff", boxSizing: "border-box", padding: "60px 64px 48px", display: "flex", flexDirection: "column", color: "var(--texto)", border: "1px solid var(--borda)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid var(--texto)" }}>
            <span style={{ font: "600 11px var(--font-interface)" }}>Mapa da proteção · {r.nome}</span>
            <span style={{ font: "400 9.5px var(--font-interface)", color: "var(--texto-secundario)" }}>pág. 2 de 3</span>
          </div>

          <div style={{ marginTop: 30 }}>
            <div style={{ font: "600 21px var(--font-titulo)", marginBottom: 16 }}>Resumo da sua proteção</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {r.categorias.map((ct) => (
                <div key={ct.rotulo}>
                  <div style={{ display: "flex", justifyContent: "space-between", font: "500 11px var(--font-interface)", marginBottom: 5 }}>
                    <span>{ct.rotulo}</span>
                    <span style={{ fontWeight: 700 }}>{ct.valor}</span>
                  </div>
                  <div style={{ height: 14, border: "1px solid var(--texto)", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "var(--texto)", width: ct.largura }} />
                  </div>
                  <div style={{ font: "400 9.5px var(--font-interface)", color: "var(--texto-secundario)", marginTop: 4 }}>{ct.nota}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 36 }}>
            <div style={{ font: "600 21px var(--font-titulo)", marginBottom: 16 }}>Necessidade × capital protegido</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", font: "500 11px var(--font-interface)", marginBottom: 5 }}>
                <span>Necessidade em caso de falecimento</span>
                <span style={{ fontWeight: 700 }}>{r.necessidade}</span>
              </div>
              <div style={{ height: 12, border: "1px solid var(--texto)", overflow: "hidden" }}>
                <div style={{ width: "100%", height: "100%", background: "var(--texto)" }} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", font: "500 11px var(--font-interface)", marginBottom: 5 }}>
                <span>Já protegido — patrimônio liquidável, FGTS, INSS, previdência e seguro atual</span>
                <span style={{ fontWeight: 700 }}>{r.protegido}</span>
              </div>
              <div style={{ height: 12, border: "1px solid var(--texto)", overflow: "hidden" }}>
                <div style={{ height: "100%", background: "var(--verde)", width: r.larguraProtegido }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1.5px solid var(--texto)", font: "800 12px var(--font-interface)" }}>
              <span>{r.rotuloFalta}</span>
              <span>{r.aProteger}</span>
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".12em", color: "var(--texto-secundario)", marginBottom: 12 }}>Composição da necessidade</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {r.necessidadeLinhas.map((cp) => (
                <div key={cp.rotulo} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "9px 0", borderBottom: "1px dotted #B9C6D2", font: "500 11px var(--font-interface)" }}>
                  <span>{cp.rotulo}</span>
                  <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{cp.valor}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 28 }}>
            <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".12em", color: "var(--texto-secundario)", marginBottom: 12 }}>Já protegido, item por item</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {r.protegidoLinhas.map((p) => (
                <div key={p.rotulo} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "8px 0", borderBottom: "1px dotted #B9C6D2", font: "500 10.5px var(--font-interface)" }}>
                  <span>{p.rotulo}</span>
                  <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{p.valor}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ font: "400 8.5px/1.5 var(--font-interface)", color: "var(--texto-secundario)", paddingTop: 12, borderTop: "1px solid var(--borda)" }}>{r.rodapeLegal}</div>
        </div>

        {/* Página 3 */}
        <div className="a4 paper" style={{ width: 794, height: 1123, background: "#fff", boxSizing: "border-box", padding: "60px 64px 48px", display: "flex", flexDirection: "column", color: "var(--texto)", border: "1px solid var(--borda)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid var(--texto)" }}>
            <span style={{ font: "600 11px var(--font-interface)" }}>Mapa da proteção · {r.nome}</span>
            <span style={{ font: "400 9.5px var(--font-interface)", color: "var(--texto-secundario)" }}>pág. 3 de 3</span>
          </div>

          <div style={{ marginTop: 30 }}>
            <div style={{ font: "600 21px var(--font-titulo)", marginBottom: 14 }}>Coberturas recomendadas</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {r.coberturas.map((cb) => (
                <div key={cb.titulo} style={{ padding: "12px 0", borderBottom: "1px solid var(--borda)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                    <span style={{ font: "700 11.5px var(--font-interface)" }}>{cb.titulo}</span>
                    <span style={{ font: "800 12px var(--font-interface)", whiteSpace: "nowrap" }}>{cb.valor}</span>
                  </div>
                  <div style={{ font: "400 10px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginTop: 4 }}>{cb.nota}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".12em", color: "var(--texto-secundario)", marginBottom: 10 }}>Referências do cálculo</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {r.premissas.map((pr) => (
                <div key={pr.rotulo} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "7px 0", borderBottom: "1px dotted #B9C6D2", font: "500 10px var(--font-interface)" }}>
                  <span>{pr.rotulo}</span>
                  <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{pr.valor}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16, border: "1px solid var(--texto)", padding: "12px 14px", font: "400 9.5px/1.65 var(--font-interface)" }}>
            Números de referência para consultoria. O prêmio final depende da seguradora escolhida, da idade na contratação e da avaliação médica. Este documento não constitui proposta formal de seguro.
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ font: "400 9px/1.6 var(--font-interface)", color: "var(--texto-secundario)", paddingTop: 12, borderTop: "1px solid var(--borda)" }}>
            {r.corretorNome} · {r.corretorContato}
          </div>
        </div>
      </div>
    </div>
  );
}
