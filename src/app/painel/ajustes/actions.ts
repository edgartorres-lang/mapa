"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { dispararWebhook } from "@/lib/webhooks";
import { CANAIS_LGPD, type CanalLgpd } from "@/lib/enums";
import type { FatoresCalculoEditavel } from "@/lib/fatores-ajustes";

/**
 * Tab 1 — Fatores de cálculo. Grava direto na linha `FatoresCalculo` do corretor. Os campos
 * "live" (ver src/lib/fatores-ajustes.ts) valem pro próximo cálculo de qualquer estudo em
 * aberto, sem precisar tocar em cada um — `calc()` lê o corretor de novo a cada render da tela
 * do estudo. `revalidatePath` nas rotas de estudo garante que a próxima visita já mostra o
 * número novo (o Next não invalida cache de Server Component sozinho num Server Action que não
 * mexeu na tabela `Estudo`).
 */
export async function salvarFatoresCalculo(novo: FatoresCalculoEditavel) {
  const corretor = await obterCorretorAtual();
  await prisma.fatoresCalculo.update({ where: { corretorId: corretor.id }, data: novo });
  revalidatePath("/painel/ajustes");
  revalidatePath("/estudo", "layout");
}

interface SlotEditavel {
  ordem: number;
  diaRelativo: string;
  hora: string;
  duracaoMin: number;
}

/** Tab 2 — os três horários fixos. Upsert pela chave composta (corretorId, ordem) — os três
 * sempre existem (seed.ts os cria), então isto sempre atualiza, nunca cria de fato, mas usar
 * upsert deixa a ação resistente a um banco sem os três ainda semeados. */
export async function salvarHorariosSugeridos(slots: SlotEditavel[]) {
  const corretor = await obterCorretorAtual();
  await prisma.$transaction(
    slots.map((s) =>
      prisma.horarioSugerido.upsert({
        where: { corretorId_ordem: { corretorId: corretor.id, ordem: s.ordem } },
        update: { diaRelativo: s.diaRelativo, hora: s.hora, duracaoMin: s.duracaoMin },
        create: { corretorId: corretor.id, ordem: s.ordem, diaRelativo: s.diaRelativo, hora: s.hora, duracaoMin: s.duracaoMin },
      }),
    ),
  );
  revalidatePath("/painel/ajustes");
  revalidatePath("/captacao");
}

/** Tab 2 — as três chaves que mudam o que a página do lead oferece (`ofereceCampoAberto`,
 * `pulaFimDeSemana`) e a que ainda não tem efeito nenhum (`aceitaHorarioOcupado` — não existe
 * checagem de agenda pra ligar/desligar; ver AGENTS.md, "Ajustes (Etapa 6)"). */
export async function salvarPreferenciasAgendamento(prefs: { ofereceCampoAberto: boolean; aceitaHorarioOcupado: boolean; pulaFimDeSemana: boolean }) {
  const corretor = await obterCorretorAtual();
  await prisma.corretor.update({ where: { id: corretor.id }, data: prefs });
  revalidatePath("/painel/ajustes");
  revalidatePath("/captacao");
}

/** Tab 3 — dias sem movimento até um mapa entrar na fila de limpeza (dashboard). Mora em
 * `FatoresCalculo.diasRetencao`, não em `Corretor`, só porque a linha já existe 1:1 por corretor
 * e não vale criar uma tabela de configuração só pra isto. */
export async function salvarRetencao(dias: number) {
  const corretor = await obterCorretorAtual();
  const limpo = Math.max(1, Math.round(dias) || 120);
  await prisma.fatoresCalculo.update({ where: { corretorId: corretor.id }, data: { diasRetencao: limpo } });
  revalidatePath("/painel/ajustes");
  revalidatePath("/painel/dashboard");
}

/**
 * Tab 3 — pedido de exclusão LGPD. **Irreversível**: apaga a linha do `Cliente` de verdade
 * (cascade leva estudos, mapas, agendamentos, eventos e anotações junto) e deixa só o registro
 * de 4 campos em `ExclusaoLgpd` (decisão 6 do README do handoff) — sem nome, telefone ou e-mail,
 * só a prova de que o pedido foi atendido. Diferente de excluir um mapa ou o histórico de mapas
 * (`excluirMapaIsolado`/`excluirHistoricoCompleto`, src/app/painel/clientes/[id]/actions.ts): lá
 * o cadastro fica; aqui não fica nada.
 *
 * Antes de apagar, junta os `googleEventId` de agendamentos futuros (se houver) — o corpo de
 * `/webhook/esquecer` leva isso pro n8n cancelar na agenda de verdade; o app nunca fala com o
 * Google Agenda direto.
 */
export async function registrarExclusaoLgpd(clienteId: string, canal: CanalLgpd) {
  if (!CANAIS_LGPD.includes(canal)) throw new Error("Canal inválido.");
  const corretor = await obterCorretorAtual();
  const cliente = await prisma.cliente.findUniqueOrThrow({
    where: { id: clienteId },
    include: { agendamentos: { where: { dataHora: { gt: new Date() } }, select: { googleEventId: true } } },
  });
  if (cliente.corretorId !== corretor.id) throw new Error("Cliente não pertence a este corretor.");

  const eventosFuturos = cliente.agendamentos.map((a) => a.googleEventId).filter((id): id is string => !!id);

  const exclusao = await prisma.exclusaoLgpd.create({
    data: { corretorId: corretor.id, canal },
  });
  await prisma.cliente.delete({ where: { id: clienteId } }); // cascade: estudos, mapas, agendamentos, eventos, notas

  await dispararWebhook(corretor.webhookEsquecer, { idOpaco: exclusao.id, canal, eventosFuturos });

  revalidatePath("/painel/ajustes");
  revalidatePath("/painel/clientes");
  revalidatePath("/painel/funil");
  revalidatePath("/painel/dashboard");
}
