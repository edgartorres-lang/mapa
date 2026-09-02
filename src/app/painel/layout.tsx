import type { ReactNode } from "react";
import Link from "next/link";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { prisma } from "@/lib/prisma";
import { criarEstudoNovo } from "@/app/estudo/actions";

/**
 * Barra lateral fixa de 216px (README, "Painel do Corretor"). Seis itens — só Dashboard, Funil e
 * Clientes têm tela nesta etapa; Estudos/Link de captação/Ajustes aparecem desativados até as
 * etapas 5/6 (não quis simular tela que ainda não existe).
 */
export default async function PainelLayout({ children }: { children: ReactNode }) {
  const corretor = await obterCorretorAtual();
  const [leadsCount, funilCount, clientesCount, estudosAbertosCount] = await Promise.all([
    prisma.cliente.count({ where: { corretorId: corretor.id, estagioFunil: "lead" } }),
    prisma.cliente.count({ where: { corretorId: corretor.id, estagioFunil: { not: null } } }),
    prisma.cliente.count({ where: { corretorId: corretor.id } }),
    prisma.estudo.count({ where: { corretorId: corretor.id, status: "aberto" } }),
  ]);

  const itens = [
    { rotulo: "Dashboard", href: "/painel/dashboard", badge: leadsCount },
    { rotulo: "Funil", href: "/painel/funil", badge: funilCount },
    { rotulo: "Clientes", href: "/painel/clientes", badge: clientesCount },
    { rotulo: "Estudos", href: null, badge: estudosAbertosCount },
    { rotulo: "Link de captação", href: null, badge: null },
    { rotulo: "Ajustes", href: null, badge: null },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "var(--font-interface)" }}>
      <div style={{ width: 216, flex: "none", background: "var(--marinho)", display: "flex", flexDirection: "column", boxSizing: "border-box", padding: "20px 14px" }}>
        <div style={{ font: "600 15px var(--font-titulo)", color: "#fff", padding: "0 8px 20px" }}>Mapa da Proteção</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          {itens.map((item) =>
            item.href ? (
              <Link
                key={item.rotulo}
                href={item.href}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, color: "rgba(255,255,255,.88)", font: "600 13px var(--font-interface)" }}
              >
                <span>{item.rotulo}</span>
                {item.badge !== null && item.badge > 0 && (
                  <span style={{ font: "700 10.5px var(--font-interface)", background: "rgba(255,255,255,.16)", color: "#fff", padding: "2px 8px", borderRadius: 99 }}>{item.badge}</span>
                )}
              </Link>
            ) : (
              <div
                key={item.rotulo}
                title="Ainda não construído nesta etapa"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, color: "rgba(255,255,255,.4)", font: "600 13px var(--font-interface)", cursor: "not-allowed" }}
              >
                <span>{item.rotulo}</span>
                {item.badge !== null && item.badge > 0 && (
                  <span style={{ font: "700 10.5px var(--font-interface)", background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.5)", padding: "2px 8px", borderRadius: 99 }}>{item.badge}</span>
                )}
              </div>
            ),
          )}
        </div>

        <form action={criarEstudoNovo}>
          <button
            type="submit"
            style={{ width: "100%", font: "700 12.5px var(--font-interface)", color: "#fff", background: "var(--verde)", border: "none", padding: "11px", borderRadius: 999, cursor: "pointer", marginBottom: 14 }}
          >
            + Novo estudo
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,.14)", paddingTop: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.14)", display: "grid", placeItems: "center", font: "600 13px var(--font-titulo)", color: "#fff", flex: "none" }}>
            {corretor.nome.charAt(0)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: "600 12px var(--font-interface)", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{corretor.nome}</div>
            <div style={{ font: "400 10.5px var(--font-interface)", color: "rgba(255,255,255,.55)" }}>{corretor.corretora}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, background: "var(--fundo)" }}>{children}</div>
    </div>
  );
}
