import Link from "next/link";
import { carregarSaida } from "@/lib/carregar-saida";
import { construirMemoriaCalculo } from "@/lib/memoria-calculo";
import { paraFatoresCalc } from "@/lib/fatores-calculo";
import type { FatoresCalculo as FatoresCalculoDb } from "@prisma/client";

/**
 * Memória de cálculo: a conta aberta, pra conferir antes de apresentar — porta de
 * Ciclo do Estudo.dc.html (~linha 220 template / ~498 dados). Só existe pra Mapa gerado — os
 * números vêm sempre do snapshot travado, nunca recalculam (mesma regra das outras saídas).
 */
export default async function PaginaMemoriaCalculo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { dados, c, mapa, r } = await carregarSaida(id);
  const fatoresUsados = mapa.fatoresUsados as unknown as FatoresCalculoDb;
  const grupos = construirMemoriaCalculo(dados, c, paraFatoresCalc(fatoresUsados));

  return (
    <div style={{ minHeight: "100vh", padding: "26px 30px", fontFamily: "var(--font-interface)", maxWidth: 760 }}>
      <div className="noprint" style={{ marginBottom: 16 }}>
        <Link
          href={`/estudo/${id}`}
          style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto-secundario)", border: "1.5px solid var(--borda)", background: "#fff", padding: "10px 18px", borderRadius: 999, display: "inline-block" }}
        >
          ← Voltar ao resumo
        </Link>
      </div>

      <div style={{ font: "600 24px var(--font-titulo)", color: "var(--marinho)", marginBottom: 4 }}>Memória de cálculo</div>
      <div style={{ font: "400 13px var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 4 }}>{r.nome}</div>
      <div style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 22 }}>
        Mapa v{mapa.numeroVersao} · gerado em {mapa.geradoEm.toLocaleDateString("pt-BR")} · os fatores usados foram os em vigor naquele dia, mesmo que Ajustes tenha mudado depois.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {grupos.map((g) => (
          <div key={g.grupo} style={{ display: "flex", gap: 14, background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ width: 6, borderRadius: 3, flex: "none", background: g.cor }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                <span style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)" }}>{g.grupo}</span>
                <span style={{ font: "700 16px var(--font-interface)", color: g.cor }}>{g.total}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {g.linhas.map((l) => (
                  <div key={l.rotulo} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 14, padding: "8px 0", borderBottom: "1px solid var(--fundo-alt)" }}>
                    <div>
                      <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto)" }}>{l.rotulo}</div>
                      <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)", marginTop: 2 }}>{l.formula}</div>
                    </div>
                    <span style={{ font: "700 13px var(--font-interface)", color: "var(--texto)", whiteSpace: "nowrap" }}>{l.valor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
