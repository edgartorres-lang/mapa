import { prisma } from "@/lib/prisma";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { resolverHorariosDisponiveis } from "@/lib/disponibilidade-agenda";
import { FormularioLead } from "@/components/captacao/FormularioLead";

/**
 * Link de captação — endereço público único, com `?utm_campaign=` por campanha. Formulário
 * mobile, uma pergunta por tela — porta de `Link do Cliente - Protótipo.dc.html`. O lead nunca
 * vê valor de cobertura aqui (não-negociável); termina em reunião agendada.
 *
 * Os 3 horários já chegam **resolvidos** (checados contra a agenda de verdade, se
 * `aceitaHorarioOcupado` estiver desligado — ver src/lib/disponibilidade-agenda.ts): a checagem
 * roda aqui, no carregamento da página, antes de qualquer horário aparecer pro lead (decisão do
 * Edgar — checar antes de mostrar, não só na confirmação). Como a checagem é feita uma vez só,
 * no load, um horário pode em teoria ocupar entre o carregamento e a confirmação (o lead pode
 * demorar minutos nas perguntas antes de chegar na tela de agendar) — "conflito não bloqueia"
 * continua valendo como rede de segurança de qualquer jeito.
 */
export default async function PaginaCaptacao({ searchParams }: { searchParams: Promise<{ utm_campaign?: string }> }) {
  const { utm_campaign: utmCampanha } = await searchParams;
  const corretor = await obterCorretorAtual();
  const horarios = await prisma.horarioSugerido.findMany({ where: { corretorId: corretor.id }, orderBy: { ordem: "asc" } });
  const slotsResolvidos = await resolverHorariosDisponiveis(corretor, horarios, corretor.pulaFimDeSemana);

  return (
    <FormularioLead
      corretor={{
        nome: corretor.nome,
        corretora: corretor.corretora,
        susep: corretor.susep,
        whatsapp: corretor.whatsapp,
        ofereceCampoAberto: corretor.ofereceCampoAberto,
        fotoUrl: corretor.fotoUrl,
        logoClaroUrl: corretor.logoClaroUrl,
      }}
      slotsResolvidos={slotsResolvidos}
      utmCampanha={utmCampanha ?? null}
    />
  );
}
