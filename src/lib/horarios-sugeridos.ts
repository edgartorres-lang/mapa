import type { HorarioSugerido } from "@prisma/client";

const NOME_DIA_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/**
 * Calcula a data/hora concreta de um horário sugerido a partir de "hoje". Porta da regra em
 * `Captação e Agendamento.dc.html` — tarde de amanhã, manhã e tarde de depois de amanhã (dois no
 * mesmo dia, de propósito, ver README "Agendamento"). `diaRelativo`/hora/duração são editáveis em
 * Ajustes → Horários sugeridos desde a Etapa 6 (`src/app/painel/ajustes/actions.ts`).
 *
 * `pularFimDeSemana`: Corretor.pulaFimDeSemana (Ajustes → Horários sugeridos). Se a data cair em
 * sábado ou domingo, empurra pra segunda-feira seguinte, no mesmo horário — regra real, não só
 * documentada (ao contrário de `aceitaHorarioOcupado`, que não tem checagem de agenda pra aplicar
 * ainda). Usado tanto na prévia (FormularioLead.tsx, client) quanto na gravação de verdade
 * (confirmarAgendamento, server) — os dois precisam concordar na mesma data.
 */
export function calcularDataHorario(h: Pick<HorarioSugerido, "diaRelativo" | "hora">, hoje: Date = new Date(), pularFimDeSemana = false): Date {
  const dias = h.diaRelativo === "amanha" ? 1 : h.diaRelativo === "depois_de_amanha" ? 2 : h.diaRelativo === "em_tres_dias" ? 3 : 1;
  const [hora, minuto] = h.hora.split(":").map(Number);
  const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dias, hora, minuto || 0, 0, 0);
  if (pularFimDeSemana) {
    if (data.getDay() === 6) data.setDate(data.getDate() + 2); // sábado → segunda
    else if (data.getDay() === 0) data.setDate(data.getDate() + 1); // domingo → segunda
  }
  return data;
}

/**
 * Empurra uma data já calculada `dias` dias pra frente, mantendo a hora — usado pra gerar
 * candidatos extras quando o horário original está ocupado (ver src/lib/disponibilidade-agenda.ts).
 * Reaplica a regra de pular fim de semana no resultado, não só na data original: empurrar de
 * sexta pra segunda (2 dias) pode cair de novo em fim de semana se `dias` for maior.
 */
export function avancarDias(data: Date, dias: number, pularFimDeSemana = false): Date {
  if (dias === 0) return data;
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  if (pularFimDeSemana) {
    if (d.getDay() === 6) d.setDate(d.getDate() + 2); // sábado → segunda
    else if (d.getDay() === 0) d.setDate(d.getDate() + 1); // domingo → segunda
  }
  return d;
}

export function formatarDiaHorario(data: Date): { dia: string; hora: string } {
  const diaSemana = NOME_DIA_SEMANA[data.getDay()];
  const diaMes = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return { dia: `${diaSemana.charAt(0).toUpperCase()}${diaSemana.slice(1)}, ${diaMes}`, hora };
}
