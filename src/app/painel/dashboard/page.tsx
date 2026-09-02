import Link from "next/link";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { carregarKpis, filaPrecisaDeVoce, agruparPorEstagio } from "@/lib/painel-dados";
import { ESTAGIO_INFO, corDias, corDoEstagio, nomeDoEstagio, textoDias } from "@/lib/funil";
import { brlCurto } from "@/lib/formato";
import { ExcluirMapaBotao } from "@/components/painel/ExcluirMapaBotao";

/**
 * Porta de "Painel do Corretor.dc.html" (tela Dashboard). O cartão do link de captação (3
 * estatísticas) não entra — é Etapa 5, ainda não construída; um aviso simples fica no lugar.
 */
export default async function PaginaDashboard() {
  const corretor = await obterCorretorAtual();
  const { leadsDoMes, capitalNoFunil, fechadosDoMes, parados120, resumo } = await carregarKpis(corretor.id);
  const fila = filaPrecisaDeVoce(resumo).slice(0, 8);
  const grupos = agruparPorEstagio(resumo);
  const totalFunil = Object.values(grupos).reduce((a, g) => a + g.length, 0);
  const avisos120 = resumo.filter((r) => r.diasParado >= 120 && r.cliente.estagioFunil !== "fechado");

  const kpis = [
    { rotulo: "Leads do mês", valor: String(leadsDoMes) },
    { rotulo: "Capital no funil", valor: brlCurto(capitalNoFunil) },
    { rotulo: "Fechados no mês", valor: String(fechadosDoMes) },
    { rotulo: "Parados 120+ dias", valor: String(parados120) },
  ];

  return (
    <div style={{ padding: "26px 30px" }}>
      <div style={{ font: "600 27px var(--font-titulo)", color: "var(--marinho)" }}>Olá, {corretor.nome.split(" ")[0]}</div>
      <div style={{ font: "400 13px var(--font-interface)", color: "var(--texto-secundario)", margin: "6px 0 22px" }}>Como está o funil hoje.</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {kpis.map((k) => (
          <div key={k.rotulo} style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)" }}>{k.rotulo}</div>
            <div style={{ font: "700 24px var(--font-interface)", color: "var(--marinho)", marginTop: 4 }}>{k.valor}</div>
          </div>
        ))}
      </div>

      {avisos120.length > 0 && (
        <div style={{ background: "var(--nota-fundo)", border: "1px solid var(--nota-borda)", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ font: "700 12.5px var(--font-interface)", color: "var(--nota-texto)", marginBottom: 10 }}>
            {avisos120.length} {avisos120.length === 1 ? "mapa" : "mapas"} sem movimento há mais de 120 dias
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {avisos120.map((r) => (
              <div key={r.cliente.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "#fff", borderRadius: 8, padding: "10px 14px" }}>
                <div>
                  <span style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto)" }}>{r.cliente.nome}</span>
                  <span style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-terciario)", marginLeft: 8 }}>{textoDias(r.diasParado)} sem movimento</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link
                    href={`/painel/clientes/${r.cliente.id}`}
                    style={{ font: "600 11.5px var(--font-interface)", color: "var(--marinho)", border: "1.5px solid var(--borda)", background: "#fff", padding: "6px 12px", borderRadius: 999 }}
                  >
                    Retomar contato
                  </Link>
                  {r.mapaAtual && <ExcluirMapaBotao clienteNome={r.cliente.nome} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
          <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 14 }}>Precisa de você hoje</div>
          {fila.length === 0 && <div style={{ font: "400 13px var(--font-interface)", color: "var(--texto-terciario)" }}>Nada parado no funil agora.</div>}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {fila.map((r) => (
              <Link
                key={r.cliente.id}
                href={`/painel/clientes/${r.cliente.id}`}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--fundo-alt)" }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: corDoEstagio(r.cliente.estagioFunil), flex: "none" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "600 13px var(--font-interface)", color: "var(--texto)" }}>{r.cliente.nome}</div>
                  <div style={{ font: "400 11px var(--font-interface)", color: corDias(r.diasParado) }}>
                    {nomeDoEstagio(r.cliente.estagioFunil)} · {textoDias(r.diasParado)} parado
                  </div>
                </div>
                {r.mapaAtual && <div style={{ font: "700 13px var(--font-interface)", color: "var(--marinho)" }}>{brlCurto(r.mapaAtual.capitalAProteger)}</div>}
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
            <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 14 }}>Funil</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(ESTAGIO_INFO).map(([k, info]) => {
                const n = grupos[k as keyof typeof grupos].length;
                const largura = totalFunil ? Math.round((n / totalFunil) * 100) : 0;
                return (
                  <div key={k}>
                    <div style={{ display: "flex", justifyContent: "space-between", font: "500 11.5px var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 4 }}>
                      <span>{info.nome}</span>
                      <span style={{ fontWeight: 700, color: "var(--texto)" }}>{n}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: "var(--fundo)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${largura}%`, background: info.cor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: "var(--azul-claro-fundo)", border: "1px solid var(--azul-claro-borda)", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ font: "700 11px var(--font-interface)", color: "var(--azul)", marginBottom: 6 }}>Link de captação</div>
            <div style={{ font: "400 12px/1.6 var(--font-interface)", color: "var(--marinho)" }}>
              Ainda não existe (Etapa 5). Por enquanto todo cliente entra pelo botão &ldquo;+ Novo estudo&rdquo;.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
