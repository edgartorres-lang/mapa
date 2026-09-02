import Link from "next/link";
import { carregarSaida } from "@/lib/carregar-saida";
import { EmailCompositor } from "@/components/saida/EmailCompositor";

/**
 * Corpo do e-mail de 600px + compositor. Porta fiel da seção "E-MAIL" em
 * Mapa da Proteção 1a+1b - Unificado.dc.html (~linha 840-922). Sem impressão própria — o botão
 * "Baixar A4" do compositor reaproveita a regra @page da proposta.
 */
export default async function PaginaEmail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { r } = await carregarSaida(id);

  return (
    <div style={{ minHeight: "100vh", padding: "26px 30px", fontFamily: "var(--font-interface)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
        <Link
          href={`/estudo/${id}`}
          style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto-secundario)", border: "1.5px solid var(--borda)", background: "#fff", padding: "10px 18px", borderRadius: 999, display: "inline-block" }}
        >
          ← Voltar ao resumo
        </Link>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ width: 600, background: "#EEF2F7", borderRadius: 12, overflow: "hidden", border: "1px solid var(--borda)" }}>
          <div style={{ background: "var(--marinho)", padding: "26px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ width: 104, height: 30, border: "1px dashed rgba(255,255,255,.45)", borderRadius: 4, display: "grid", placeItems: "center", font: "600 7.5px var(--font-interface)", color: "rgba(255,255,255,.6)" }}>
              LOGO
            </div>
            <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".14em", color: "var(--verde)" }}>Mapa da proteção</div>
          </div>
          <div style={{ background: "#fff", padding: 32 }}>
            <div style={{ font: "600 24px/1.3 var(--font-titulo)", color: "var(--marinho)", marginBottom: 14 }}>
              {r.nome.split(" ")[0] || "Olá"}, seu mapa de proteção está pronto
            </div>
            <div style={{ font: "400 14px/1.75 var(--font-interface)", color: "var(--texto)", marginBottom: 22 }}>
              Preparei o estudo com as informações que conversamos. Abaixo estão os pontos principais; o
              documento completo está anexado em PDF.
            </div>

            <div style={{ border: "1px solid var(--borda)", borderRadius: 10, padding: "20px 22px", marginBottom: 16 }}>
              <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".11em", color: "var(--texto-terciario)", marginBottom: 8 }}>
                Capital sugerido em seguro de vida
              </div>
              <div style={{ font: "600 30px var(--font-titulo)", color: "var(--marinho)", marginBottom: 14 }}>{r.totalVida}</div>
              <div style={{ height: 1, background: "var(--borda)", marginBottom: 14 }} />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", font: "500 12.5px var(--font-interface)", color: "var(--texto)" }}>
                <span style={{ color: "var(--texto-secundario)" }}>Necessidade da família</span>
                <span style={{ fontWeight: 700 }}>{r.necessidade}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", font: "500 12.5px var(--font-interface)", color: "var(--texto)" }}>
                <span style={{ color: "var(--texto-secundario)" }}>Já protegido hoje</span>
                <span style={{ fontWeight: 700, color: "var(--verde)" }}>{r.protegido}</span>
              </div>
            </div>

            <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".11em", color: "var(--texto-terciario)", margin: "22px 0 12px" }}>
              O que cada parte resolve
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {r.categorias.map((ct) => (
                <div key={ct.rotulo} style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 3, borderRadius: 2, flex: "none", background: ct.cor }} />
                  <div>
                    <div style={{ font: "700 13px var(--font-interface)", color: "var(--marinho)" }}>
                      {ct.rotulo} · {ct.valor}
                    </div>
                    <div style={{ font: "400 12.5px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginTop: 2 }}>{ct.nota}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--azul)", borderRadius: 8, padding: 15, textAlign: "center", font: "700 14px var(--font-interface)", color: "#fff", marginBottom: 12 }}>
              Ver o mapa completo
            </div>
            <div style={{ border: "1px solid var(--borda)", borderRadius: 8, padding: "13px 15px", display: "flex", alignItems: "center", gap: 11, marginBottom: 22 }}>
              <div style={{ width: 20, height: 26, border: "1.5px solid var(--marinho)", borderRadius: 2, flex: "none" }} />
              <div>
                <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--marinho)" }}>{r.anexoNome}</div>
                <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)" }}>3 páginas · A4</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, alignItems: "center", paddingTop: 20, borderTop: "1px solid var(--borda)" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", border: "1px dashed var(--texto-terciario)", display: "grid", placeItems: "center", font: "600 7px var(--font-interface)", color: "var(--texto-terciario)", flex: "none" }}>
                FOTO
              </div>
              <div>
                <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)" }}>{r.corretorNome}</div>
                <div style={{ font: "400 11.5px/1.7 var(--font-interface)", color: "var(--texto-secundario)" }}>
                  {r.corretora} · {r.susep}
                  <br />
                  {r.corretorContato}
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: "20px 32px", font: "400 10.5px/1.65 var(--font-interface)", color: "var(--texto-terciario)", textAlign: "center" }}>
            {r.rodapeLegal}
            <br />
            <span style={{ textDecoration: "underline" }}>Não quero mais receber e-mails</span>
          </div>
        </div>

        <EmailCompositor estudoId={id} r={r} />
      </div>
    </div>
  );
}
