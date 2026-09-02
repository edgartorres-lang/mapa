import { notFound } from "next/navigation";
import { prisma } from "./prisma";
import type { CalcResultado } from "./calc";
import type { EstudoFormulario } from "./estudo-formulario";
import { construirApresentacao } from "./apresentacao";

/**
 * Carrega tudo que as três saídas (apresentação/proposta/e-mail) precisam. Só existe saída pra
 * Mapa gerado — um estudo em aberto não tem `mapa`, e as saídas usam sempre o snapshot travado
 * (nunca recalculam), então aqui é 404 se ainda não foi gerado. É uma leitura mais estrita do
 * glossário do que o protótipo (que mostra as três saídas também com o estudo em aberto, como
 * pré-visualização) — mantive assim porque combina com "as saídas são o que o Mapa produz".
 */
export async function carregarSaida(estudoId: string) {
  const estudo = await prisma.estudo.findUnique({
    where: { id: estudoId },
    include: { mapa: true },
  });
  if (!estudo || !estudo.mapa) notFound();

  const corretor = await prisma.corretor.findUniqueOrThrow({ where: { id: estudo.corretorId } });

  const dados = estudo.dados as unknown as EstudoFormulario;
  const c = estudo.mapa.derivados as unknown as CalcResultado;
  const r = construirApresentacao(dados, c, corretor, estudo.mapa.geradoEm);

  return { estudo, mapa: estudo.mapa, dados, c, r, corretor };
}
