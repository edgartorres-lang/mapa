import QRCode from "qrcode";
import { carregarSaida } from "@/lib/carregar-saida";
import { BarraSaida } from "@/components/saida/BarraSaida";

/**
 * Dez slides 960×540 (equivalem a 1920×1080), impressos em A4 deitado. Porta fiel da seção
 * "APRESENTAÇÃO" em "Wizard 1a - Protótipo funcional v3.dc.html" (~linha 567-755) — mudou de 6
 * pra 10 telas em 2026-09-03 (Capa ganhou uma linha de contexto pessoal; Proteção em vida,
 * Educação dos filhos, Além da morte e Resumo para o cliente são novas). Placeholders de
 * logo/foto/QR seguem tracejados quando a marca não foi configurada — ver Ajustes → Perfil e
 * marca.
 */
export default async function PaginaApresentacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { r } = await carregarSaida(id);
  // Achado real revendo o app publicado (2026-09-05): esta caixa nunca tinha sido construída de
  // verdade, era só um placeholder com "QR CODE / WhatsApp" escrito — igual o QR do link de
  // captação era antes de eu corrigir (ver src/app/painel/captacao/page.tsx). Sem WhatsApp
  // cadastrado, mantém o tracejado (não força um QR sem destino nenhum).
  const qrWhatsappSvg = r.whatsappLink ? await QRCode.toString(r.whatsappLink, { type: "svg", margin: 0, color: { dark: "#0F3D63", light: "#FFFFFF" } }) : null;

  return (
    <div className="pchain" style={{ minHeight: "100vh", padding: "26px 30px", fontFamily: "var(--font-interface)" }}>
      <BarraSaida estudoId={id} modo="slides" rotuloBotao="Baixar PDF · A4 deitado" notaDireita="Dez telas em 960×540 — equivalem a 1920×1080" />

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Slide 1 — capa */}
        <div className="slide16 paper" style={{ width: 960, height: 540, background: "var(--marinho)", position: "relative", overflow: "hidden", borderRadius: 4 }}>
          <div style={{ position: "absolute", right: -140, top: -160, width: 480, height: 480, borderRadius: "50%", background: "rgba(57,204,0,.14)" }} />
          <div style={{ position: "absolute", left: -120, bottom: -220, width: 420, height: 420, borderRadius: "50%", background: "rgba(27,114,190,.4)" }} />
          <div style={{ position: "relative", height: "100%", boxSizing: "border-box", padding: "56px 64px", display: "flex", flexDirection: "column", color: "#fff" }}>
            {r.logoClaroUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL local, sem imagem remota pra otimizar
              <img src={r.logoClaroUrl} alt={r.corretora} style={{ maxWidth: 150, maxHeight: 40, objectFit: "contain" }} />
            ) : (
              <div style={{ width: 150, height: 40, border: "1px dashed rgba(255,255,255,.45)", borderRadius: 6, display: "grid", placeItems: "center", font: "600 9px var(--font-interface)", color: "rgba(255,255,255,.6)" }}>
                LOGO {r.corretora.toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1 }} />
            <div style={{ font: "700 12px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".2em", color: "var(--verde)", marginBottom: 18 }}>Mapa da proteção</div>
            <div style={{ font: "600 62px/1.05 var(--font-titulo)", marginBottom: 22 }}>{r.nome}</div>
            <div style={{ width: 64, height: 4, background: "var(--verde)" }} />
            <div style={{ flex: 1 }} />
            {r.subtitulo && <div style={{ font: "400 17px var(--font-interface)", color: "rgba(255,255,255,.85)", marginBottom: 6 }}>{r.subtitulo}</div>}
            <div style={{ font: "400 17px var(--font-interface)", color: "rgba(255,255,255,.72)" }}>
              {r.corretorNome} · {r.dataLonga}
            </div>
          </div>
        </div>

        {/* Slide 2 — o ponto de partida */}
        <div className="slide16 paper" style={{ width: 960, height: 540, background: "#fff", overflow: "hidden", borderRadius: 4, border: "1px solid var(--borda)" }}>
          <div style={{ height: "100%", boxSizing: "border-box", padding: "52px 64px", display: "flex", flexDirection: "column" }}>
            <div style={{ font: "700 12px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".16em", color: "var(--azul)", marginBottom: 14 }}>O ponto de partida</div>
            <div style={{ font: "600 42px/1.15 var(--font-titulo)", color: "var(--marinho)", marginBottom: 34 }}>{r.slide2Titulo}</div>
            <div style={{ display: "flex", gap: 20, alignItems: "stretch" }}>
              <div style={{ flex: 1, border: "2px solid var(--marinho)", borderRadius: 16, padding: "24px 26px" }}>
                <div style={{ font: "700 11.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--texto-secundario)", marginBottom: 10 }}>Renda do segurado</div>
                <div style={{ font: "600 40px var(--font-titulo)", color: "var(--marinho)" }}>{r.rendaMensal}</div>
                <div style={{ font: "400 15px var(--font-interface)", color: "var(--texto-secundario)", marginTop: 4 }}>{r.rendaNota}</div>
              </div>
              <div style={{ flex: 1, background: "var(--fundo)", borderRadius: 16, padding: "24px 26px" }}>
                <div style={{ font: "700 11.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--texto-secundario)", marginBottom: 14 }}>Quem depende</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {r.dependentes.length === 0 && <div style={{ font: "400 14px var(--font-interface)", color: "var(--texto-terciario)" }}>Sem dependentes informados.</div>}
                  {r.dependentes.map((dp) => (
                    <div key={dp.texto} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ width: 34, height: 34, borderRadius: "50%", background: dp.cor }} />
                      <span style={{ font: "600 17px var(--font-interface)", color: "var(--texto)" }}>{dp.texto}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ font: "400 16px/1.6 var(--font-interface)", color: "var(--texto-secundario)", borderLeft: "4px solid var(--verde)", paddingLeft: 18 }}>{r.slide2Nota}</div>
          </div>
        </div>

        {/* Slide 3 — a conta */}
        <div className="slide16 paper" style={{ width: 960, height: 540, background: "#fff", overflow: "hidden", borderRadius: 4, border: "1px solid var(--borda)" }}>
          <div style={{ height: "100%", boxSizing: "border-box", padding: "52px 64px", display: "flex", flexDirection: "column" }}>
            <div style={{ font: "700 12px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".16em", color: "var(--azul)", marginBottom: 14 }}>A conta</div>
            <div style={{ font: "600 40px/1.15 var(--font-titulo)", color: "var(--marinho)", marginBottom: 36 }}>
              O que já está protegido,
              <br />e o que falta proteger.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 9 }}>
                  <span style={{ font: "600 17px var(--font-interface)", color: "var(--marinho)" }}>Necessidade da família</span>
                  <span style={{ font: "700 22px var(--font-interface)", color: "var(--marinho)" }}>{r.necessidade}</span>
                </div>
                <div style={{ height: 38, borderRadius: 9, background: "var(--fundo)", overflow: "hidden" }}>
                  <div style={{ width: "100%", height: "100%", background: "var(--marinho)" }} />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 9 }}>
                  <span style={{ font: "600 17px var(--font-interface)", color: "var(--marinho)" }}>Já protegido hoje</span>
                  <span style={{ font: "700 22px var(--font-interface)", color: "var(--verde)" }}>{r.protegido}</span>
                </div>
                <div style={{ height: 38, borderRadius: 9, background: "var(--fundo)", overflow: "hidden" }}>
                  <div style={{ height: "100%", background: "var(--verde)", width: r.larguraProtegido }} />
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "3px solid var(--texto)", paddingTop: 18 }}>
              <span style={{ font: "700 20px var(--font-interface)", color: "var(--texto)" }}>{r.rotuloFalta}</span>
              <span style={{ font: "600 40px var(--font-titulo)", color: "var(--texto)" }}>{r.aProteger}</span>
            </div>
          </div>
        </div>

        {/* Slide 4 — o que cada parte resolve (panorama) */}
        <div className="slide16 paper" style={{ width: 960, height: 540, background: "var(--fundo)", overflow: "hidden", borderRadius: 4, border: "1px solid var(--borda)" }}>
          <div style={{ height: "100%", boxSizing: "border-box", padding: "48px 60px", display: "flex", flexDirection: "column" }}>
            <div style={{ font: "700 12px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".16em", color: "var(--azul)", marginBottom: 12 }}>O que cada parte resolve</div>
            <div style={{ font: "600 36px/1.15 var(--font-titulo)", color: "var(--marinho)", marginBottom: 26 }}>
              Problemas diferentes,
              <br />coberturas diferentes.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1, minHeight: 0 }}>
              {r.categorias.map((ct) => (
                <div key={ct.rotulo} style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", borderTop: `5px solid ${ct.cor}` }}>
                  <div style={{ font: "700 15px var(--font-interface)", color: "var(--marinho)", marginBottom: 8 }}>{ct.rotulo}</div>
                  <div style={{ font: "600 26px var(--font-titulo)", color: "var(--texto)", marginBottom: 8 }}>{ct.valor}</div>
                  <div style={{ font: "400 14px/1.5 var(--font-interface)", color: "var(--texto-secundario)" }}>{ct.nota}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide 5 — proteção em vida (novo) */}
        <div className="slide16 paper" style={{ width: 960, height: 540, background: "#fff", overflow: "hidden", borderRadius: 4, border: "1px solid var(--borda)" }}>
          <div style={{ height: "100%", boxSizing: "border-box", padding: "52px 64px", display: "flex", flexDirection: "column" }}>
            <div style={{ font: "700 12px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".16em", color: "var(--azul)", marginBottom: 14 }}>Proteção em vida</div>
            <div style={{ font: "600 40px/1.15 var(--font-titulo)", color: "var(--marinho)", marginBottom: 30 }}>
              Duas urgências diferentes,
              <br />duas coberturas.
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "stretch", flex: 1, minHeight: 0 }}>
              <div style={{ flex: 1, border: "2px solid var(--marinho)", borderRadius: 16, padding: "26px 28px", display: "flex", flexDirection: "column" }}>
                <div style={{ font: "700 11.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--texto-secundario)", marginBottom: 10 }}>Cobertura vitalícia</div>
                <div style={{ font: "600 44px var(--font-titulo)", color: "var(--marinho)", marginBottom: 14 }}>{r.coberturas[0].valor}</div>
                <div style={{ font: "400 15px/1.6 var(--font-interface)", color: "var(--texto-secundario)" }}>{r.coberturas[0].nota}</div>
              </div>
              <div style={{ flex: 1, border: "2px solid var(--azul)", borderRadius: 16, padding: "26px 28px", display: "flex", flexDirection: "column" }}>
                <div style={{ font: "700 11.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--texto-secundario)", marginBottom: 10 }}>Cobertura temporária</div>
                <div style={{ font: "600 44px var(--font-titulo)", color: "var(--azul)", marginBottom: 14 }}>{r.coberturas[1].valor}</div>
                <div style={{ font: "400 15px/1.6 var(--font-interface)", color: "var(--texto-secundario)" }}>{r.coberturas[1].nota}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 6 — educação dos filhos (novo) */}
        <div className="slide16 paper" style={{ width: 960, height: 540, background: "var(--fundo)", overflow: "hidden", borderRadius: 4, border: "1px solid var(--borda)" }}>
          <div style={{ height: "100%", boxSizing: "border-box", padding: "52px 64px", display: "flex", flexDirection: "column" }}>
            <div style={{ font: "700 12px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".16em", color: "var(--azul)", marginBottom: 14 }}>Educação dos filhos</div>
            <div style={{ font: "600 40px/1.15 var(--font-titulo)", color: "var(--marinho)", marginBottom: 30 }}>
              Os estudos, garantidos
              <br />até a formatura.
            </div>
            <div style={{ background: "#fff", borderRadius: 16, padding: "30px 32px", display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ font: "600 56px var(--font-titulo)", color: "var(--marinho)" }}>{r.coberturas[2].valor}</span>
              <span style={{ font: "600 16px var(--font-interface)", color: "var(--texto-secundario)" }}>em pensão por morte</span>
            </div>
            <div style={{ font: "400 16px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginTop: 22, maxWidth: 720 }}>{r.coberturas[2].nota}</div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 10, background: "#fff", border: "1px solid var(--borda)", borderRadius: 999, padding: "12px 20px" }}>
              <span style={{ font: "700 14px var(--font-interface)", color: "var(--marinho)" }}>{r.categorias[2].valor}</span>
              <span style={{ font: "400 13px var(--font-interface)", color: "var(--texto-secundario)" }}>de custo total até a formatura, como referência</span>
            </div>
          </div>
        </div>

        {/* Slide 7 — além da morte (novo) */}
        <div className="slide16 paper" style={{ width: 960, height: 540, background: "#fff", overflow: "hidden", borderRadius: 4, border: "1px solid var(--borda)" }}>
          <div style={{ height: "100%", boxSizing: "border-box", padding: "48px 60px", display: "flex", flexDirection: "column" }}>
            <div style={{ font: "700 12px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".16em", color: "var(--azul)", marginBottom: 12 }}>Além da morte</div>
            <div style={{ font: "600 34px/1.2 var(--font-titulo)", color: "var(--marinho)", marginBottom: 24 }}>
              Doença e acidente também
              <br />deixam a família sem renda.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1, minHeight: 0 }}>
              <div style={{ background: "var(--fundo)", borderRadius: 14, padding: "22px 24px", borderTop: "5px solid var(--marinho)" }}>
                <div style={{ font: "700 15px var(--font-interface)", color: "var(--marinho)", marginBottom: 8 }}>Invalidez</div>
                <div style={{ font: "600 24px var(--font-titulo)", color: "var(--texto)", marginBottom: 4 }}>{r.coberturas[3].valor}</div>
                <div style={{ font: "400 13px var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 8 }}>por acidente · {r.coberturas[4].valor} por doença</div>
                <div style={{ font: "400 13px/1.5 var(--font-interface)", color: "var(--texto-secundario)" }}>{r.coberturas[3].nota}</div>
              </div>
              <div style={{ background: "var(--fundo)", borderRadius: 14, padding: "22px 24px", borderTop: "5px solid var(--azul)" }}>
                <div style={{ font: "700 15px var(--font-interface)", color: "var(--marinho)", marginBottom: 8 }}>Renda vitalícia por invalidez</div>
                <div style={{ font: "600 24px var(--font-titulo)", color: "var(--texto)", marginBottom: 8 }}>{r.coberturas[5].valor}</div>
                <div style={{ font: "400 13px/1.5 var(--font-interface)", color: "var(--texto-secundario)" }}>{r.coberturas[5].nota}</div>
              </div>
              <div style={{ background: "var(--fundo)", borderRadius: 14, padding: "22px 24px", borderTop: "5px solid var(--verde)" }}>
                <div style={{ font: "700 15px var(--font-interface)", color: "var(--marinho)", marginBottom: 8 }}>Diária por incapacidade (DIT)</div>
                <div style={{ font: "600 24px var(--font-titulo)", color: "var(--texto)", marginBottom: 8 }}>{r.coberturas[6].valor}</div>
                <div style={{ font: "400 13px/1.5 var(--font-interface)", color: "var(--texto-secundario)" }}>{r.coberturas[6].nota}</div>
              </div>
              <div style={{ background: "var(--fundo)", borderRadius: 14, padding: "22px 24px", borderTop: `5px solid ${r.categorias[3].cor}` }}>
                <div style={{ font: "700 15px var(--font-interface)", color: "var(--marinho)", marginBottom: 8 }}>Doenças graves</div>
                <div style={{ font: "600 24px var(--font-titulo)", color: "var(--texto)", marginBottom: 8 }}>{r.coberturas[7].valor}</div>
                <div style={{ font: "400 13px/1.5 var(--font-interface)", color: "var(--texto-secundario)" }}>{r.coberturas[7].nota}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 8 — resumo para o cliente (novo; sempre visível aqui, ao contrário da tela do
            estudo, onde o mesmo rótulo fica atrás do botão "Gerar") */}
        <div className="slide16 paper" style={{ width: 960, height: 540, background: "#fff", overflow: "hidden", borderRadius: 4, border: "1px solid var(--borda)" }}>
          <div style={{ height: "100%", boxSizing: "border-box", padding: "52px 64px", display: "flex", flexDirection: "column" }}>
            <div style={{ font: "700 12px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".16em", color: "var(--verde)", marginBottom: 14 }}>Resumo para o cliente</div>
            <div style={{ font: "600 34px/1.2 var(--font-titulo)", color: "var(--marinho)", marginBottom: 22 }}>Em poucas palavras, é isso.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13, overflow: "hidden" }}>
              {r.resumoParaOCliente.map((par, i) => (
                <div key={i} style={{ font: "400 13.5px/1.55 var(--font-interface)", color: "var(--texto)", borderLeft: "3px solid var(--verde)", paddingLeft: 16 }}>
                  {par}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide 9 — a recomendação */}
        <div className="slide16 paper" style={{ width: 960, height: 540, background: "linear-gradient(135deg,#0F3D63,#1B72BE)", overflow: "hidden", borderRadius: 4 }}>
          <div style={{ height: "100%", boxSizing: "border-box", padding: "56px 64px", display: "flex", flexDirection: "column", color: "#fff" }}>
            <div style={{ font: "700 12px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".16em", color: "var(--sucesso-fundo)", marginBottom: "auto" }}>A recomendação</div>
            <div style={{ font: "400 20px var(--font-interface)", color: "rgba(255,255,255,.75)", marginBottom: 10 }}>Capital sugerido em seguro de vida</div>
            <div style={{ font: "600 82px/1 var(--font-titulo)", marginBottom: 20 }}>{r.totalVida}</div>
            <div style={{ display: "flex", gap: 10, marginBottom: "auto", flexWrap: "wrap" }}>
              <span style={{ font: "700 14px var(--font-interface)", background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.34)", borderRadius: 99, padding: "10px 18px" }}>Vitalícia {r.vitalicia}</span>
              <span style={{ font: "700 14px var(--font-interface)", background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.34)", borderRadius: 99, padding: "10px 18px" }}>Temporária {r.temporaria}</span>
              <span style={{ font: "700 14px var(--font-interface)", background: "rgba(57,204,0,.28)", border: "1px solid rgba(57,204,0,.6)", borderRadius: 99, padding: "10px 18px" }}>+ pensão de educação {r.pensaoMensal}/mês</span>
            </div>
            <div style={{ font: "400 16px/1.6 var(--font-interface)", color: "rgba(255,255,255,.7)", borderTop: "1px solid rgba(255,255,255,.2)", paddingTop: 18 }}>
              Valor de referência. O prêmio final depende da seguradora, da idade na contratação e da avaliação médica.
            </div>
          </div>
        </div>

        {/* Slide 10 — próximo passo */}
        <div className="slide16 paper" style={{ width: 960, height: 540, background: "#fff", overflow: "hidden", borderRadius: 4, border: "1px solid var(--borda)" }}>
          <div style={{ height: "100%", boxSizing: "border-box", padding: "52px 64px", display: "flex", flexDirection: "column" }}>
            <div style={{ font: "700 12px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".16em", color: "var(--azul)", marginBottom: 12 }}>Próximo passo</div>
            <div style={{ font: "600 40px/1.15 var(--font-titulo)", color: "var(--marinho)", marginBottom: 12 }}>
              Qualquer dúvida,
              <br />fale comigo direto.
            </div>
            <div style={{ font: "400 16px/1.6 var(--font-interface)", color: "var(--texto-secundario)", maxWidth: 620 }}>
              Posso ajustar prazos, valores e coberturas com você e trazer as cotações das seguradoras.
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 32, alignItems: "center", paddingTop: 26, borderTop: "2px solid var(--borda)" }}>
              {r.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- data URL local, sem imagem remota pra otimizar
                <img src={r.fotoUrl} alt={r.corretorNome} style={{ width: 110, height: 110, borderRadius: "50%", objectFit: "cover", flex: "none" }} />
              ) : (
                <div style={{ width: 110, height: 110, borderRadius: "50%", border: "1px dashed var(--texto-terciario)", display: "grid", placeItems: "center", font: "600 9px var(--font-interface)", color: "var(--texto-terciario)", flex: "none" }}>
                  FOTO
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ font: "600 27px var(--font-titulo)", color: "var(--marinho)" }}>{r.corretorNome}</div>
                <div style={{ font: "400 14px var(--font-interface)", color: "var(--texto-terciario)", margin: "4px 0 12px" }}>{r.corretorCargo}</div>
                <div style={{ font: "600 16px var(--font-interface)", color: "var(--texto)" }}>{r.corretorContato}</div>
              </div>
              {qrWhatsappSvg ? (
                <div style={{ flex: "none", textAlign: "center" }}>
                  <div
                    style={{ width: 104, height: 104, borderRadius: 8, background: "#fff", border: "1px solid var(--borda)", padding: 6, boxSizing: "border-box" }}
                    // SVG gerado por nós (biblioteca `qrcode`), não é entrada de usuário.
                    dangerouslySetInnerHTML={{ __html: qrWhatsappSvg }}
                  />
                  <div style={{ font: "600 9px var(--font-interface)", color: "var(--texto-terciario)", marginTop: 4 }}>WhatsApp</div>
                </div>
              ) : (
                <div style={{ width: 104, height: 104, border: "1px dashed var(--texto-terciario)", borderRadius: 8, display: "grid", placeItems: "center", font: "600 8.5px var(--font-interface)", color: "var(--texto-terciario)", textAlign: "center", lineHeight: 1.4, flex: "none" }}>
                  QR CODE
                  <br />
                  WhatsApp
                </div>
              )}
            </div>
            <div style={{ font: "400 12px var(--font-interface)", color: "var(--texto-terciario)", marginTop: 16 }}>{r.rodapeLegal}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
