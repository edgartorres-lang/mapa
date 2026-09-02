import type { HorarioSugerido } from "@prisma/client";

const NOME_DIA_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** Calcula a data/hora concreta de um horário sugerido a partir de "hoje". Porta da regra em
 * `Captação e Agendamento.dc.html` — tarde de amanhã, manhã e tarde de depois de amanhã (dois no
 * mesmo dia, de propósito, ver README "Agendamento"). `diaRelativo` vem de Ajustes → Horários
 * sugeridos (Etapa 6, ainda não editável — hoje só os 3 valores semeados em prisma/seed.ts). */
export function calcularDataHorario(h: Pick<HorarioSugerido, "diaRelativo" | "hora">, hoje: Date = new Date()): Date {
  const dias = h.diaRelativo === "amanha" ? 1 : h.diaRelativo === "depois_de_amanha" ? 2 : h.diaRelativo === "em_tres_dias" ? 3 : 1;
  const [hora, minuto] = h.hora.split(":").map(Number);
  const data = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dias, hora, minuto || 0, 0, 0);
  return data;
}

export function formatarDiaHorario(data: Date): { dia: string; hora: string } {
  const diaSemana = NOME_DIA_SEMANA[data.getDay()];
  const diaMes = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return { dia: `${diaSemana.charAt(0).toUpperCase()}${diaSemana.slice(1)}, ${diaMes}`, hora };
}
