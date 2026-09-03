import { prisma } from "@/lib/prisma";
import { obterCorretorAtual } from "@/lib/corretor-atual";

/** "exportar CSV" da tabela de consentimentos (Ajustes → LGPD e retenção). Sem biblioteca — são
 * 4 colunas de texto simples, um `join` resolve; escapa aspas/vírgula com aspas duplas (RFC 4180). */
function celulaCsv(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export async function GET() {
  const corretor = await obterCorretorAtual();
  const clientes = await prisma.cliente.findMany({
    where: { corretorId: corretor.id },
    orderBy: { criadoEm: "desc" },
    select: { nome: true, origem: true, lgpdAceitoEm: true, criadoEm: true, lgpdStatus: true },
  });

  const linhas = [
    ["nome", "origem", "data", "status"].join(","),
    ...clientes.map((c) =>
      [
        celulaCsv(c.nome),
        celulaCsv(c.origem || "—"),
        celulaCsv((c.lgpdAceitoEm ?? c.criadoEm).toLocaleDateString("pt-BR")),
        celulaCsv(c.lgpdStatus),
      ].join(","),
    ),
  ];

  return new Response(linhas.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="consentimentos.csv"',
    },
  });
}
