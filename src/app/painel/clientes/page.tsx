import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { carregarClientesComResumo } from "@/lib/painel-dados";
import { ESTAGIO_INFO, corDias, corDoEstagio, textoDias, fundoSuaveDoEstagio, nomeDoEstagio } from "@/lib/funil";
import { brl } from "@/lib/formato";
import { ESTAGIOS_FUNIL } from "@/lib/enums";

/** Porta de "Painel do Corretor.dc.html" (tela Clientes). Busca e filtro via querystring — sem
 * JS de cliente, cada pílula/busca é um link/form que recarrega a lista filtrada.
 *
 * Achado real revendo o app (2026-09-05): o filtro "Parados" tinha "120" fixo no rótulo e na
 * comparação, enquanto o Dashboard já lia `FatoresCalculo.diasRetencao` (configurável em
 * Ajustes → LGPD e retenção) pro mesmo conceito — mudar o valor lá desalinhava esta tela, que
 * continuava falando/filtrando por 120 dias. Corrigido pra ler o mesmo `diasRetencao`. */
export default async function PaginaClientes({ searchParams }: { searchParams: Promise<{ q?: string; filtro?: string }> }) {
  const { q = "", filtro = "todos" } = await searchParams;
  const corretor = await obterCorretorAtual();
  const [resumo, fatoresDb] = await Promise.all([carregarClientesComResumo(corretor.id), prisma.fatoresCalculo.findUniqueOrThrow({ where: { corretorId: corretor.id } })]);
  const diasRetencao = fatoresDb.diasRetencao;

  const FILTROS = [
    { chave: "todos", rotulo: "Todos" },
    ...ESTAGIOS_FUNIL.map((e) => ({ chave: e, rotulo: ESTAGIO_INFO[e].nome })),
    { chave: "fora", rotulo: "Fora do funil" },
    { chave: "parados", rotulo: `Parados ${diasRetencao}+ dias` },
  ];

  const buscaLower = q.trim().toLowerCase();
  const filtrados = resumo.filter((r) => {
    if (buscaLower) {
      const alvo = `${r.cliente.nome} ${r.cliente.profissao ?? ""} ${r.cliente.telefone ?? ""}`.toLowerCase();
      if (!alvo.includes(buscaLower)) return false;
    }
    if (filtro === "todos") return true;
    if (filtro === "fora") return !r.cliente.estagioFunil;
    if (filtro === "parados") return r.diasParado >= diasRetencao && r.cliente.estagioFunil !== "fechado";
    return r.cliente.estagioFunil === filtro;
  });

  return (
    <div style={{ padding: "26px 30px" }}>
      <div style={{ font: "600 27px var(--font-titulo)", color: "var(--marinho)", marginBottom: 18 }}>Clientes</div>

      <form style={{ marginBottom: 14 }}>
        <input type="hidden" name="filtro" value={filtro} />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, profissão ou telefone"
          style={{ width: 360, padding: "10px 14px", border: "1.5px solid var(--borda)", borderRadius: 9, font: "500 13px var(--font-interface)", background: "#fff" }}
        />
      </form>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {FILTROS.map((f) => {
          const ativo = f.chave === filtro;
          const params = new URLSearchParams();
          if (q) params.set("q", q);
          params.set("filtro", f.chave);
          return (
            <Link
              key={f.chave}
              href={`/painel/clientes?${params.toString()}`}
              style={{
                font: "600 12px var(--font-interface)",
                padding: "8px 14px",
                borderRadius: 999,
                color: ativo ? "#fff" : "var(--texto-secundario)",
                background: ativo ? "var(--marinho)" : "#fff",
                border: `1.5px solid ${ativo ? "var(--marinho)" : "var(--borda)"}`,
              }}
            >
              {f.rotulo}
            </Link>
          );
        })}
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.1fr 1fr 1fr 0.9fr", gap: 12, padding: "10px 18px", borderBottom: "1px solid var(--borda)", font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--texto-terciario)" }}>
          <span>Cliente</span>
          <span>Estágio</span>
          <span>Mapas</span>
          <span style={{ textAlign: "right" }}>Capital</span>
          <span>Último movimento</span>
        </div>
        {filtrados.length === 0 && (
          <div style={{ padding: "24px 18px", font: "400 13px var(--font-interface)", color: "var(--texto-terciario)" }}>Nenhum cliente encontrado.</div>
        )}
        {filtrados.map((r) => (
          <Link
            key={r.cliente.id}
            href={`/painel/clientes/${r.cliente.id}`}
            style={{ display: "grid", gridTemplateColumns: "1.7fr 1.1fr 1fr 1fr 0.9fr", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--fundo-alt)", alignItems: "center" }}
          >
            <div>
              <div style={{ font: "600 13px var(--font-interface)", color: "var(--texto)" }}>{r.cliente.nome}</div>
              <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)" }}>{r.cliente.profissao || r.cliente.telefone || "—"}</div>
            </div>
            <span
              style={{
                font: "600 10.5px var(--font-interface)",
                padding: "4px 10px",
                borderRadius: 999,
                width: "fit-content",
                color: corDoEstagio(r.cliente.estagioFunil),
                background: fundoSuaveDoEstagio(r.cliente.estagioFunil),
              }}
            >
              {nomeDoEstagio(r.cliente.estagioFunil)}
            </span>
            <span style={{ font: "500 12.5px var(--font-interface)", color: "var(--texto-secundario)" }}>{r.quantidadeMapas}</span>
            <span style={{ font: "700 13px var(--font-interface)", color: "var(--marinho)", textAlign: "right" }}>
              {r.mapaAtual ? brl(r.mapaAtual.capitalAProteger) : "—"}
            </span>
            <span style={{ font: "500 12px var(--font-interface)", color: corDias(r.diasParado) }}>{textoDias(r.diasParado)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
