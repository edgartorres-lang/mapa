import type { Corretor, HorarioSugerido } from "@prisma/client";
import { avancarDias, calcularDataHorario } from "./horarios-sugeridos";
import { dispararWebhookComResposta } from "./webhooks";

/**
 * Checagem real de conflito de agenda (Ajustes → Acesso e Integrações, webhook "Google Agenda ·
 * disponibilidade") — a etapa que ficou de fora de propósito da tela de Integrações
 * (2026-09-03/04), feita a seguir a pedido do Edgar. Decisões dele:
 *  - checa **antes** de mostrar os horários ao lead, não só na confirmação;
 *  - horário ocupado → tenta outro automaticamente, sem cair direto no "proponha um horário";
 *  - só o fluxo do lead (captação pública) — agendamento manual do Edgar pela página do cliente
 *    continua sem checagem, fora de escopo desta etapa.
 *
 * Reaproveita `Corretor.aceitaHorarioOcupado` (Ajustes → Horários sugeridos), que existia desde
 * a Etapa 6 reservado exatamente pra isso ("fica gravado para quando existir integração real com
 * o Google Agenda via n8n"): **desligado** = checa de verdade; **ligado** (padrão) = não checa
 * nada, mesmo comportamento de sempre. Some com a integração de agenda inteira
 * (`integracaoAgendaAtiva`) e com a URL do webhook — os três precisam estar de acordo pra checar.
 */

const TENTATIVAS_EXTRAS = 4; // além do dia original: tenta até 4 dias a mais, mesma hora

export interface SlotResolvido {
  ordem: number;
  dataHoraISO: string;
}

interface Candidato {
  id: string;
  ordem: number;
  data: Date;
  duracaoMin: number;
}

function candidatosBase(horarios: HorarioSugerido[], hoje: Date, pularFimDeSemana: boolean): Candidato[][] {
  return horarios.map((h, ordem) => {
    const base = calcularDataHorario(h, hoje, pularFimDeSemana);
    const tentativas: Candidato[] = [];
    for (let t = 0; t <= TENTATIVAS_EXTRAS; t++) {
      tentativas.push({ id: `${ordem}-${t}`, ordem, data: avancarDias(base, t, pularFimDeSemana), duracaoMin: h.duracaoMin });
    }
    return tentativas;
  });
}

function semChecagem(horarios: HorarioSugerido[], hoje: Date, pularFimDeSemana: boolean): SlotResolvido[] {
  return horarios.map((h, ordem) => ({ ordem, dataHoraISO: calcularDataHorario(h, hoje, pularFimDeSemana).toISOString() }));
}

/**
 * Resolve os até 3 horários sugeridos contra a agenda de verdade. Retorna só as posições que
 * acharam um candidato livre — pode vir com menos de 3 (ou vazia), o lead ainda tem "proponha um
 * horário" (se `ofereceCampoAberto`) e o canal WhatsApp como saída.
 *
 * Best-effort, igual a todo webhook do app: sem URL configurada, com a checagem desligada, ou se
 * o n8n não responder (erro, timeout, formato inesperado), cai de volta pro comportamento de
 * sempre — devolve os 3 horários sem checar, não trava o lead. "Conflito não bloqueia" continua
 * valendo como rede de segurança, mesmo com a checagem ligada.
 */
export async function resolverHorariosDisponiveis(
  corretor: Pick<Corretor, "integracaoAgendaAtiva" | "webhookChecarAgenda" | "aceitaHorarioOcupado">,
  horarios: HorarioSugerido[],
  pularFimDeSemana: boolean,
  hoje: Date = new Date(),
): Promise<SlotResolvido[]> {
  if (horarios.length === 0) return [];

  const deveChecar = !corretor.aceitaHorarioOcupado && corretor.integracaoAgendaAtiva && !!corretor.webhookChecarAgenda;
  if (!deveChecar) return semChecagem(horarios, hoje, pularFimDeSemana);

  const porSlot = candidatosBase(horarios, hoje, pularFimDeSemana);
  const todos = porSlot.flat();

  const resultado = await dispararWebhookComResposta<{ livres?: string[] }>(corretor.webhookChecarAgenda, {
    candidatos: todos.map((c) => ({ id: c.id, data: c.data.toISOString(), duracaoMin: c.duracaoMin })),
  });

  if (!resultado.ok || !Array.isArray(resultado.dados.livres)) {
    return semChecagem(horarios, hoje, pularFimDeSemana);
  }

  const livres = new Set(resultado.dados.livres);
  const resolvidos: SlotResolvido[] = [];
  for (const tentativas of porSlot) {
    const achado = tentativas.find((c) => livres.has(c.id));
    if (achado) resolvidos.push({ ordem: achado.ordem, dataHoraISO: achado.data.toISOString() });
    // nenhuma tentativa livre pra essa posição → some da lista, não entra vazio nem trava nada.
  }
  return resolvidos;
}
