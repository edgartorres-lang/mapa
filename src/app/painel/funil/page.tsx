import Link from "next/link";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { carregarClientesComResumo, agruparPorEstagio } from "@/lib/painel-dados";
import { ESTAGIO_INFO, textoDias } from "@/lib/funil";
import { brlCurto } from "@/lib/formato";

/** Porta de "Painel do Corretor.dc.html" (tela Funil): 6 colunas, uma por estágio. */
export default async function PaginaFunil() {
  const corretor = await obterCorretorAtual();
  const resumo = await carregarClientesComResumo(corretor.id);
  const grupos = agruparPorEstagio(resumo);

  const totalClientes = Object.values(grupos).reduce((a, g) => a + g.length, 0);
  const totalCapital = Object.values(grupos)
    .flat()
    .reduce((a, r) => a + (r.mapaAtual?.capitalAProteger ?? 0), 0);

  return (
    <div style={{ padding: "26px 30px" }}>
      <div style={{ font: "600 27px var(--font-titulo)", color: "var(--marinho)", marginBottom: 4 }}>Funil</div>
      <div style={{ font: "400 13px var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 22 }}>
        {totalClientes} {totalClientes === 1 ? "cliente" : "clientes"} no funil · {brlCurto(totalCapital)} em capital
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 12 }}>
        {Object.entries(ESTAGIO_INFO).map(([k, info]) => {
          const itens = grupos[k as keyof typeof grupos];
          const capital = itens.reduce((a, r) => a + (r.mapaAtual?.capitalAProteger ?? 0), 0);
          return (
            <div key={k} style={{ background: "var(--fundo-alt)", borderRadius: 12, padding: 10, display: "flex", flexDirection: "column", gap: 8, minHeight: 200 }}>
              <div style={{ padding: "4px 4px 8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: info.cor, flex: "none" }} />
                  <span style={{ font: "700 12px var(--font-interface)", color: "var(--texto)" }}>{info.nome}</span>
                  <span style={{ font: "600 11px var(--font-interface)", color: "var(--texto-terciario)" }}>{itens.length}</span>
                </div>
                <div style={{ font: "600 11.5px var(--font-interface)", color: "var(--texto-secundario)", paddingLeft: 14 }}>{brlCurto(capital)}</div>
              </div>

              {itens.length === 0 ? (
                <div style={{ border: "1.5px dashed var(--cinza-inativo)", borderRadius: 9, padding: "16px 10px", textAlign: "center", font: "400 11px/1.5 var(--font-interface)", color: "var(--texto-terciario)" }}>
                  {info.vazio}
                </div>
              ) : (
                itens.map((r) => (
                  <Link
                    key={r.cliente.id}
                    href={`/painel/clientes/${r.cliente.id}`}
                    style={{ display: "block", background: "#fff", borderRadius: 8, borderLeft: `3px solid ${info.cor}`, padding: "10px 12px" }}
                  >
                    <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto)" }}>{r.cliente.nome}</div>
                    <div style={{ font: "400 10.5px var(--font-interface)", color: "var(--texto-terciario)", margin: "2px 0 6px" }}>{r.cliente.profissao || "—"}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", font: "600 11px var(--font-interface)" }}>
                      <span style={{ color: "var(--marinho)" }}>{r.mapaAtual ? brlCurto(r.mapaAtual.capitalAProteger) : "—"}</span>
                      <span style={{ color: "var(--texto-terciario)", fontWeight: 500 }}>{textoDias(r.diasParado)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
