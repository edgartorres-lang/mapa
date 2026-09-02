import { prisma } from "@/lib/prisma";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import { FormularioLead } from "@/components/captacao/FormularioLead";

/**
 * Link de captação — endereço público único, com `?utm_campaign=` por campanha. Formulário
 * mobile, uma pergunta por tela — porta de `Link do Cliente - Protótipo.dc.html`. O lead nunca
 * vê valor de cobertura aqui (não-negociável); termina em reunião agendada.
 */
export default async function PaginaCaptacao({ searchParams }: { searchParams: Promise<{ utm_campaign?: string }> }) {
  const { utm_campaign: utmCampanha } = await searchParams;
  const corretor = await obterCorretorAtual();
  const horarios = await prisma.horarioSugerido.findMany({ where: { corretorId: corretor.id }, orderBy: { ordem: "asc" } });

  return (
    <FormularioLead
      corretor={{ nome: corretor.nome, corretora: corretor.corretora, susep: corretor.susep, whatsapp: corretor.whatsapp }}
      horarios={horarios.map((h) => ({ diaRelativo: h.diaRelativo, hora: h.hora }))}
      utmCampanha={utmCampanha ?? null}
    />
  );
}
