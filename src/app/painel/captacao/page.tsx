import Link from "next/link";
import QRCode from "qrcode";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { prisma } from "@/lib/prisma";
import { dataDiasAtras } from "@/lib/funil";
import { criarCampanha } from "./actions";
import { BotaoCopiar } from "@/components/painel/BotaoCopiar";

/**
 * Link de captação — porta de "Captação e Agendamento.dc.html", tela 1. Endereço único (com
 * `?utm_campaign=` por campanha), lista de campanhas com leads e taxa de agendamento, funil dos
 * últimos 30 dias.
 *
 * Caixa de entrada (2026-09-08, pedido do Edgar): antes disso, um pré-estudo que chegava pelo
 * link público não tinha lugar nenhum pra ser visto em lista — só a página do cliente, um por
 * vez. Lista aqui todo `Estudo` ainda "aberto" que veio do link público (`Cliente.origem`
 * começando com "Link" — distingue de cadastro direto do corretor, que não entra aqui), estilo
 * caixa de e-mail: não lido em negrito, `Estudo.lido` vira `true` sozinho quando o corretor abre
 * o estudo (ver src/app/estudo/[id]/page.tsx).
 */
export default async function PaginaCaptacaoCorretor() {
  const corretor = await obterCorretorAtual();
  const campanhas = await prisma.campanha.findMany({ where: { corretorId: corretor.id }, orderBy: { criadoEm: "desc" } });

  const preEstudos = await prisma.estudo.findMany({
    where: { corretorId: corretor.id, status: "aberto", cliente: { origem: { startsWith: "Link" } } },
    orderBy: { atualizadoEm: "desc" },
    include: { cliente: { include: { agendamentos: { select: { id: true }, take: 1 } } } },
  });
  const naoLidos = preEstudos.filter((e) => !e.lido).length;

  const trintaDiasAtras = dataDiasAtras(30);
  const clientesRecentes = await prisma.cliente.findMany({
    where: { corretorId: corretor.id, criadoEm: { gte: trintaDiasAtras } },
    include: { agendamentos: { select: { id: true } }, estudos: { select: { status: true }, take: 1, orderBy: { criadoEm: "desc" } } },
  });

  const linkBase = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const linkPublico = `${linkBase}/captacao`;
  // Gerado de verdade a cada carregamento da tela (não salvo em lugar nenhum) — leve o
  // suficiente pra não precisar de cache. Aponta pro mesmo endereço público de sempre, sem UTM
  // (o QR é pra material impresso, que não tem como saber de qual campanha veio). Fundo branco
  // opaco de propósito — o cartão em volta é azul-marinho escuro, um QR com fundo transparente
  // ficaria ilegível em cima dele.
  const qrCodeSvg = await QRCode.toString(linkPublico, { type: "svg", margin: 1, color: { dark: "#0F3D63", light: "#FFFFFF" } });

  const statsCampanha = campanhas.map((c) => {
    const leadsDaCampanha = clientesRecentes.filter((cl) => cl.utmCampanha === c.utmCampanha);
    const agendados = leadsDaCampanha.filter((cl) => cl.agendamentos.length > 0).length;
    const taxa = leadsDaCampanha.length ? Math.round((agendados / leadsDaCampanha.length) * 100) : 0;
    return { ...c, leads: leadsDaCampanha.length, taxa };
  });

  const totalLeads = clientesRecentes.length;
  const agendaram = clientesRecentes.filter((c) => c.agendamentos.length > 0).length;
  const apresentados = clientesRecentes.filter((c) => c.estagioFunil === "apresentado" || c.estagioFunil === "cotando" || c.estagioFunil === "fechado").length;
  const fechados = clientesRecentes.filter((c) => c.estagioFunil === "fechado").length;

  const funil30 = [
    { rotulo: "Preencheram", valor: totalLeads },
    { rotulo: "Agendaram", valor: agendaram },
    { rotulo: "Apresentados", valor: apresentados },
    { rotulo: "Fechados", valor: fechados },
  ];
  const maxFunil = Math.max(...funil30.map((f) => f.valor), 1);

  return (
    <div style={{ padding: "26px 30px" }}>
      <div style={{ font: "600 27px var(--font-titulo)", color: "var(--marinho)", marginBottom: 4 }}>Link de captação</div>
      <div style={{ font: "400 13px var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 22 }}>
        Um endereço só, com uma variação de UTM por campanha.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
          <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 10 }}>Seu endereço público</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <div style={{ flex: 1, padding: "11px 14px", border: "1.5px solid var(--borda)", borderRadius: 9, background: "var(--fundo)", font: "500 12.5px var(--font-interface)", color: "var(--texto)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {linkPublico}
            </div>
            <BotaoCopiar texto={linkPublico} />
          </div>

          <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 10 }}>Campanhas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {statsCampanha.length === 0 && <div style={{ font: "400 12.5px var(--font-interface)", color: "var(--texto-terciario)" }}>Nenhuma campanha criada ainda.</div>}
            {statsCampanha.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", border: "1px solid var(--borda)", borderRadius: 9 }}>
                <div>
                  <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto)" }}>{c.nome}</div>
                  <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 4 }}>?utm_campaign={c.utmCampanha}</div>
                  <BotaoCopiar texto={`${linkPublico}?utm_campaign=${c.utmCampanha}`} pequeno />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ font: "700 13px var(--font-interface)", color: "var(--marinho)" }}>{c.leads} leads</div>
                  <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)" }}>{c.taxa}% agendaram</div>
                </div>
              </div>
            ))}
          </div>
          <form action={criarCampanha} style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              name="nome"
              placeholder="Nome da campanha (ex: Famílias com filhos)"
              style={{ flex: 1, padding: "10px 12px", border: "1.5px solid var(--borda)", borderRadius: 9, font: "500 12.5px var(--font-interface)" }}
            />
            <button type="submit" style={{ font: "700 12px var(--font-interface)", color: "#fff", background: "var(--marinho)", border: "none", padding: "10px 16px", borderRadius: 999, cursor: "pointer", whiteSpace: "nowrap" }}>
              + Campanha
            </button>
          </form>
        </div>

        <div style={{ background: "var(--marinho)", borderRadius: 12, padding: "20px 22px", color: "#fff" }}>
          <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".1em", color: "rgba(255,255,255,.6)", marginBottom: 12 }}>QR code</div>
          <div
            style={{ width: 140, height: 140, borderRadius: 10, background: "#fff", padding: 8, boxSizing: "border-box", margin: "0 auto" }}
            // SVG gerado por nós (biblioteca `qrcode`), não é entrada de usuário.
            dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
          />
          <div style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "rgba(255,255,255,.7)", marginTop: 14, textAlign: "center" }}>Para material impresso — aponta pro mesmo endereço.</div>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "18px 22px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)" }}>Caixa de entrada</div>
          {naoLidos > 0 && (
            <span style={{ font: "700 10.5px var(--font-interface)", color: "#fff", background: "var(--azul)", padding: "3px 9px", borderRadius: 99 }}>
              {naoLidos} {naoLidos === 1 ? "novo" : "novos"}
            </span>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.1fr 0.9fr 1.2fr 0.8fr", gap: 12, padding: "8px 22px", borderTop: "1px solid var(--borda)", borderBottom: "1px solid var(--borda)", background: "var(--fundo)", font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--texto-terciario)" }}>
          <span>Cliente</span>
          <span>Chegou em</span>
          <span>Agendou</span>
          <span>Origem</span>
          <span></span>
        </div>
        {preEstudos.length === 0 && (
          <div style={{ padding: "22px", font: "400 13px var(--font-interface)", color: "var(--texto-terciario)" }}>
            Nenhum pré-estudo em aberto vindo do link público agora — os que já viraram Mapa saem daqui sozinhos.
          </div>
        )}
        {preEstudos.map((e) => {
          const naoLido = !e.lido;
          const agendou = e.cliente.agendamentos.length > 0;
          return (
            <div
              key={e.id}
              style={{ display: "grid", gridTemplateColumns: "1.6fr 1.1fr 0.9fr 1.2fr 0.8fr", gap: 12, padding: "13px 22px", alignItems: "center", borderBottom: "1px solid var(--fundo-alt)", background: naoLido ? "var(--azul-claro-fundo)" : "transparent" }}
            >
              <span style={{ font: naoLido ? "700 13px var(--font-interface)" : "400 13px var(--font-interface)", color: "var(--texto)" }}>
                {naoLido && <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "var(--azul)", marginRight: 8 }} />}
                {e.cliente.nome}
              </span>
              <span style={{ font: "500 12px var(--font-interface)", color: "var(--texto-secundario)" }}>
                {e.criadoEm.toLocaleDateString("pt-BR")} às {e.criadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span style={{ font: "600 11.5px var(--font-interface)", color: agendou ? "var(--verde-escuro)" : "var(--texto-terciario)" }}>
                {agendou ? "Sim" : "Não"}
              </span>
              <span style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-terciario)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {e.cliente.utmCampanha ? `Campanha · ${e.cliente.utmCampanha}` : "Link direto"}
              </span>
              <Link href={`/estudo/${e.id}`} style={{ font: "700 11.5px var(--font-interface)", color: "var(--azul)", justifySelf: "end" }}>
                Ver estudo →
              </Link>
            </div>
          );
        })}
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
        <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 4 }}>Funil dos últimos 30 dias</div>
        <div style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 16 }}>Do preenchimento até fechar.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {funil30.map((f) => (
            <div key={f.rotulo}>
              <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 4 }}>{f.rotulo}</div>
              <div style={{ font: "700 24px var(--font-interface)", color: "var(--marinho)", marginBottom: 8 }}>{f.valor}</div>
              <div style={{ height: 8, borderRadius: 4, background: "var(--fundo)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.round((f.valor / maxFunil) * 100)}%`, background: "var(--azul)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
