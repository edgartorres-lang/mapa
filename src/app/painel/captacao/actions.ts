"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { obterCorretorAtual } from "@/lib/corretor-atual";

function paraUtm(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // acentos, depois do normalize NFD
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export async function criarCampanha(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;
  const corretor = await obterCorretorAtual();
  const utmCampanha = paraUtm(nome);

  await prisma.campanha.upsert({
    where: { corretorId_utmCampanha: { corretorId: corretor.id, utmCampanha } },
    update: { nome },
    create: { corretorId: corretor.id, nome, utmCampanha },
  });

  revalidatePath("/painel/captacao");
}
