import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { paraFatoresCalc } from "@/lib/fatores-calculo";
import { obterCorretorAtual } from "@/lib/corretor-atual";
import type { EstudoFormulario } from "@/lib/estudo-formulario";
import type { CalcResultado } from "@/lib/calc";
import { EstudoShell } from "@/components/estudo/EstudoShell";

export default async function PaginaEstudo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const estudo = await prisma.estudo.findUnique({ where: { id }, include: { mapa: true } });
  if (!estudo) notFound();

  const corretor = await obterCorretorAtual();
  const fatoresDb = await prisma.fatoresCalculo.findUniqueOrThrow({ where: { corretorId: corretor.id } });

  return (
    <EstudoShell
      estudoId={estudo.id}
      dadosIniciais={estudo.dados as unknown as EstudoFormulario}
      fatores={paraFatoresCalc(fatoresDb)}
      statusInicial={estudo.status as "aberto" | "gerado"}
      derivadosCongelados={estudo.mapa ? (estudo.mapa.derivados as unknown as CalcResultado) : null}
    />
  );
}
