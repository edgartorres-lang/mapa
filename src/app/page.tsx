import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { criarEstudoNovo } from "@/app/estudo/actions";
import { brlCurto } from "@/lib/formato";

/**
 * Provisório: o Painel do Corretor de verdade (dashboard, funil, lista de clientes) é a
 * Etapa 3, ainda não construída. Esta página só existe pra ter um caminho até o estudo — lista
 * os estudos/clientes que já existem e o botão de começar um novo.
 */
export default async function Home() {
  const corretor = await obterCorretorAtual();
  const clientes = await prisma.cliente.findMany({
    where: { corretorId: corretor.id },
    orderBy: { atualizadoEm: "desc" },
    include: { estudos: { orderBy: { criadoEm: "desc" }, take: 1, include: { mapa: true } } },
  });

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ font: "600 27px var(--font-titulo)", color: "var(--marinho)" }}>Mapa da Proteção</div>
      <div style={{ font: "400 13px var(--font-interface)", color: "var(--texto-secundario)", margin: "6px 0 28px" }}>
        Painel do corretor ainda não existe (Etapa 3) — esta lista é só um caminho até o estudo, pra testar
        a Etapa 2.
      </div>

      <form action={criarEstudoNovo}>
        <button
          type="submit"
          style={{ font: "700 13px var(--font-interface)", color: "#fff", background: "var(--verde)", border: "none", padding: "12px 22px", borderRadius: 999, cursor: "pointer", marginBottom: 28 }}
        >
          + Novo estudo
        </button>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {clientes.map((cliente) => {
          const estudo = cliente.estudos[0];
          if (!estudo) return null;
          return (
            <Link
              key={cliente.id}
              href={`/estudo/${estudo.id}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 18px",
                background: "#fff",
                border: "1px solid var(--borda)",
                borderRadius: 10,
              }}
            >
              <div>
                <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--texto)" }}>{cliente.nome}</div>
                <div style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-terciario)" }}>
                  {estudo.status === "gerado" ? "Mapa gerado · travado" : "Estudo em aberto"}
                </div>
              </div>
              {estudo.mapa && (
                <div style={{ font: "700 14px var(--font-interface)", color: "var(--marinho)" }}>
                  {brlCurto(estudo.mapa.capitalAProteger)}
                </div>
              )}
            </Link>
          );
        })}
        {clientes.length === 0 && (
          <div style={{ font: "400 13px var(--font-interface)", color: "var(--texto-terciario)" }}>
            Nenhum estudo ainda. Clique em &ldquo;+ Novo estudo&rdquo;.
          </div>
        )}
      </div>
    </main>
  );
}
