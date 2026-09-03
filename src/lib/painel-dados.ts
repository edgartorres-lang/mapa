import { prisma } from "./prisma";
import { diasDesde } from "./funil";
import type { EstagioFunil } from "./enums";

/**
 * "Movimento no CRM" = qualquer `EventoHistorico` (decisão 4 do README do handoff: nota, mudança
 * de estágio, mapa gerado, e-mail/WhatsApp enviado, novo preenchimento do link — abrir a página
 * não conta). Aqui: último evento de cada cliente, caindo pro `criadoEm` do cadastro se não tem
 * nenhum ainda.
 */
export async function carregarClientesComResumo(corretorId: string) {
  const [clientes, eventos, mapas] = await Promise.all([
    prisma.cliente.findMany({ where: { corretorId }, orderBy: { atualizadoEm: "desc" } }),
    prisma.eventoHistorico.findMany({ where: { corretorId }, orderBy: { criadoEm: "desc" }, select: { clienteId: true, criadoEm: true } }),
    prisma.mapa.findMany({ where: { corretorId }, orderBy: { geradoEm: "desc" } }),
  ]);

  const ultimoEventoPorCliente = new Map<string, Date>();
  for (const ev of eventos) {
    if (!ultimoEventoPorCliente.has(ev.clienteId)) ultimoEventoPorCliente.set(ev.clienteId, ev.criadoEm);
  }

  const mapasPorCliente = new Map<string, typeof mapas>();
  for (const m of mapas) {
    const lista = mapasPorCliente.get(m.clienteId) ?? [];
    lista.push(m);
    mapasPorCliente.set(m.clienteId, lista);
  }

  const agora = new Date();

  return clientes.map((cliente) => {
    const ultimoMovimento = ultimoEventoPorCliente.get(cliente.id) ?? cliente.criadoEm;
    const mapasDoCliente = mapasPorCliente.get(cliente.id) ?? []; // já vem ordenado desc (geradoEm)
    const mapaAtual = mapasDoCliente[0] ?? null;
    return {
      cliente,
      ultimoMovimento,
      diasParado: diasDesde(ultimoMovimento, agora),
      mapaAtual,
      quantidadeMapas: mapasDoCliente.length,
    };
  });
}

export type ClienteComResumo = Awaited<ReturnType<typeof carregarClientesComResumo>>[number];

/**
 * KPIs do dashboard. "Leads do mês" e "fechados" contam o mês corrente; "capital no funil" soma
 * o mapa atual de quem está em aberto no funil (nem fechado, nem perdido, nem fora do funil).
 *
 * `diasRetencao`: limiar da fila de limpeza (Ajustes → LGPD e retenção, `FatoresCalculo.
 * diasRetencao`, editável desde a Etapa 6). Default 120 só como rede de segurança — quem chama
 * isto deveria sempre passar o valor de verdade do corretor; ver `PaginaDashboard`.
 */
export async function carregarKpis(corretorId: string, diasRetencao = 120) {
  const resumo = await carregarClientesComResumo(corretorId);
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

  const leadsDoMes = resumo.filter((r) => r.cliente.criadoEm >= inicioMes).length;
  const fechadosDoMes = resumo.filter((r) => r.cliente.estagioFunil === "fechado" && r.cliente.estagioAtualizadoEm && r.cliente.estagioAtualizadoEm >= inicioMes).length;
  const capitalNoFunil = resumo
    .filter((r) => r.cliente.estagioFunil && !["fechado", "perdido"].includes(r.cliente.estagioFunil))
    .reduce((soma, r) => soma + (r.mapaAtual?.capitalAProteger ?? 0), 0);
  const parados120 = resumo.filter((r) => r.diasParado >= diasRetencao && r.cliente.estagioFunil !== "fechado").length;

  return { leadsDoMes, fechadosDoMes, capitalNoFunil, parados120, resumo };
}

/** Fila "precisa de você hoje": em aberto no funil, ordenada por dias parado (mais tempo primeiro). */
export function filaPrecisaDeVoce(resumo: ClienteComResumo[]) {
  return resumo
    .filter((r) => r.cliente.estagioFunil && !["fechado", "perdido"].includes(r.cliente.estagioFunil))
    .sort((a, b) => b.diasParado - a.diasParado);
}

export function agruparPorEstagio(resumo: ClienteComResumo[]): Record<EstagioFunil, ClienteComResumo[]> {
  const grupos: Record<EstagioFunil, ClienteComResumo[]> = {
    lead: [],
    estudo: [],
    apresentado: [],
    cotando: [],
    fechado: [],
    perdido: [],
  };
  for (const r of resumo) {
    if (r.cliente.estagioFunil) grupos[r.cliente.estagioFunil as EstagioFunil].push(r);
  }
  return grupos;
}
