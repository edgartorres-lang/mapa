"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { dispararWebhook, testarWebhook } from "@/lib/webhooks";
import { CANAIS_LGPD, type CanalLgpd } from "@/lib/enums";
import type { FatoresCalculoEditavel } from "@/lib/fatores-ajustes";
import { CAMPOS_WEBHOOK_URL, CAMPOS_INTEGRACAO_ATIVA, type CampoWebhookUrl, type CampoIntegracaoAtiva } from "@/lib/integracoes-ajustes";

/** Tamanho máximo de um data URL de imagem (~1.5MB de arquivo, já contando o custo de ~33% do
 * base64) — grande o bastante pra uma foto/logo razoável, pequeno o bastante pra não inchar a
 * linha do corretor no banco. Ver a nota em prisma/schema.prisma sobre guardar imagem como
 * data URL em vez de arquivo de verdade. */
const TAMANHO_MAX_IMAGEM = 2_000_000;

export interface PerfilCorretorEditavel {
  nome: string;
  cargo: string;
  corretora: string;
  susep: string;
  whatsapp: string;
  emailContato: string;
  endereco: string;
  razaoSocial: string;
}

/**
 * Tab 5 — Perfil e marca (adicionada a pedido do Edgar, 2026-09-03; não fazia parte das 6 etapas
 * originais — a tela de identidade do corretor nunca tinha sido construída). Os textos e as três
 * imagens (foto, logo claro, logo escuro) são salvos juntos, num só botão — como as outras abas.
 */
export async function salvarPerfilCorretor(dados: PerfilCorretorEditavel) {
  const corretor = await obterCorretorAtual();
  if (!dados.nome.trim()) throw new Error("Nome não pode ficar em branco.");

  await prisma.corretor.update({
    where: { id: corretor.id },
    data: {
      nome: dados.nome.trim(),
      cargo: dados.cargo.trim() || null,
      corretora: dados.corretora.trim() || null,
      susep: dados.susep.trim() || null,
      whatsapp: dados.whatsapp.trim() || null,
      emailContato: dados.emailContato.trim() || null,
      endereco: dados.endereco.trim() || null,
      razaoSocial: dados.razaoSocial.trim() || null,
    },
  });

  revalidatePath("/painel/ajustes");
  revalidatePath("/painel", "layout"); // barra lateral mostra nome/corretora
  revalidatePath("/captacao");
  revalidatePath("/estudo", "layout"); // saídas mostram nome/cargo/contato do corretor
}

/** Uma imagem por vez (foto, logo claro ou logo escuro) — `campo` já vem validado pelo
 * componente (um dos três nomes reais da coluna), `dataUrl` é o que `FileReader.readAsDataURL`
 * produziu no navegador. `null` limpa a imagem (botão "Remover"). */
export async function salvarImagemCorretor(campo: "fotoUrl" | "logoClaroUrl" | "logoEscuroUrl", dataUrl: string | null) {
  const corretor = await obterCorretorAtual();
  if (dataUrl && (!dataUrl.startsWith("data:image/") || dataUrl.length > TAMANHO_MAX_IMAGEM)) {
    throw new Error("Imagem inválida ou grande demais (máximo ~1,5MB).");
  }

  await prisma.corretor.update({ where: { id: corretor.id }, data: { [campo]: dataUrl } });

  revalidatePath("/painel/ajustes");
  revalidatePath("/painel", "layout");
  revalidatePath("/captacao");
  revalidatePath("/estudo", "layout");
}

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

/** Tab 2 — as três chaves que mudam o que a página do lead oferece: `ofereceCampoAberto`,
 * `pulaFimDeSemana` e `aceitaHorarioOcupado` (desligada, ativa a checagem real de agenda contra
 * `webhookChecarAgenda` — ver src/lib/disponibilidade-agenda.ts e AGENTS.md, "Checagem de
 * agenda"). */
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

/**
 * Tab "Acesso e Integrações" — os 6 endereços de webhook (Ajustes → Acesso e Identidade, tela 6
 * do handoff). Cada URL salva sozinha (mesmo padrão de `salvarImagemCorretor`) — não tem "Salvar"
 * geral pra tela inteira. `campo` é validado contra `CAMPOS_WEBHOOK_URL` porque vem de um
 * componente client, não confie cegamente numa string arbitrária indexando `prisma.corretor`.
 */
export async function salvarWebhookUrl(campo: CampoWebhookUrl, url: string) {
  if (!CAMPOS_WEBHOOK_URL.includes(campo)) throw new Error("Campo de webhook inválido.");
  const corretor = await obterCorretorAtual();
  const limpo = url.trim();
  if (limpo && !/^https?:\/\//.test(limpo)) throw new Error("A URL precisa começar com http:// ou https://.");

  await prisma.corretor.update({ where: { id: corretor.id }, data: { [campo]: limpo || null } });
  revalidatePath("/painel/ajustes");
}

/** Os 4 serviços com chave de ligar/desligar (agenda, WhatsApp, e-mail, IA) — `lead` e `esquecer`
 * não têm equivalente aqui, disparam sempre que a URL existir. */
export async function alternarIntegracao(campo: CampoIntegracaoAtiva, ativo: boolean) {
  if (!CAMPOS_INTEGRACAO_ATIVA.includes(campo)) throw new Error("Campo de integração inválido.");
  const corretor = await obterCorretorAtual();
  await prisma.corretor.update({ where: { id: corretor.id }, data: { [campo]: ativo } });
  revalidatePath("/painel/ajustes");
}

/** Botão "Testar" — não lê nem grava nada no banco, só confirma que a URL (já salva ou ainda
 * sendo digitada, tanto faz) responde a um POST. */
export async function testarWebhookAction(url: string) {
  return testarWebhook(url);
}
