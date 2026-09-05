import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { paraEstudoFormulario, pendenciasPorEtapa } from "@/lib/estudo-formulario";
import { diasDesde, textoDias } from "@/lib/funil";

/**
 * Achado real revendo o app publicado (2026-09-05): "Estudos" ficava no menu lateral desde a
 * Etapa 3 apontando pra lugar nenhum (`href: null`, cinza, cursor "not-allowed", com o tooltip
 * "Ainda não construído nesta etapa" — uma nota interna de desenvolvimento, não algo pra mostrar
 * ao Edgar). "Link de captação" e "Ajustes" já tinham sido ligados quando essas etapas ficaram
 * prontas; "Estudos" nunca foi. Esta tela fecha essa pendência: lista todo estudo em aberto (não
 * finalizado ainda), pra abrir direto sem passar pela página do cliente.
 */
export default async function PaginaEstudos() {
  const corretor = await obterCorretorAtual();
  const estudos = await prisma.estudo.findMany({
    where: { corretorId: corretor.id, status: "aberto" },
    orderBy: { atualizadoEm: "desc" },
    include: { cliente: { select: { id: true, nome: true, profissao: true, origem: true } } },
  });

  const linhas = estudos.map((e) => {
    const dados = paraEstudoFormulario(e.dados);
    const pendencias = pendenciasPorEtapa(dados, new Date());
    const completas = pendencias.filter((p) => p.length === 0).length;
    const pct = Math.round((completas / 4) * 100);
    return { estudo: e, dados, pct, diasParado: diasDesde(e.atualizadoEm) };
  });

  return (
    <div style={{ padding: "26px 30px" }}>
      <div style={{ font: "600 27px var(--font-titulo)", color: "var(--marinho)", marginBottom: 4 }}>Estudos</div>
      <div style={{ font: "400 13px var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 22 }}>
        {linhas.length} {linhas.length === 1 ? "estudo em aberto" : "estudos em aberto"} — ainda não viraram Mapa da Proteção.
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr 1fr 0.9fr", gap: 12, padding: "10px 18px", borderBottom: "1px solid var(--borda)", font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--texto-terciario)" }}>
          <span>Cliente</span>
          <span>Andamento</span>
          <span>Última alteração</span>
          <span>Origem</span>
        </div>
        {linhas.length === 0 && (
          <div style={{ padding: "24px 18px", font: "400 13px var(--font-interface)", color: "var(--texto-terciario)" }}>
            Nenhum estudo em aberto agora — todos já viraram mapa, ou ainda não começou nenhum.
          </div>
        )}
        {linhas.map(({ estudo, dados, pct, diasParado }) => (
          <Link
            key={estudo.id}
            href={`/estudo/${estudo.id}`}
            style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr 1fr 0.9fr", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--fundo-alt)", alignItems: "center" }}
          >
            <div>
              <div style={{ font: "600 13px var(--font-interface)", color: "var(--texto)" }}>{dados.nome || estudo.cliente.nome}</div>
              <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)" }}>{dados.profissao || estudo.cliente.profissao || "—"}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, maxWidth: 80, height: 6, borderRadius: 99, background: "var(--fundo-alt)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "var(--verde)" : "var(--azul)" }} />
              </div>
              <span style={{ font: "600 11px var(--font-interface)", color: "var(--texto-secundario)" }}>{pct}%</span>
            </div>
            <span style={{ font: "500 12px var(--font-interface)", color: "var(--texto-secundario)" }}>{textoDias(diasParado)}</span>
            <span style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-terciario)" }}>{estudo.cliente.origem || "—"}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
