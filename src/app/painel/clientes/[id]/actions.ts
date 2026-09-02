"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ESTAGIOS_FUNIL, type EstagioFunil } from "@/lib/enums";

/** Avançar/mudar estágio no funil é ação de CRM (Etapa 3), diferente de gerar/duplicar/excluir
 * mapa (Etapa 4). "Mudança de estágio" é um dos eventos que conta como movimento (decisão 4). */
export async function mudarEstagio(clienteId: string, novoEstagio: EstagioFunil) {
  if (!ESTAGIOS_FUNIL.includes(novoEstagio)) throw new Error("Estágio inválido.");
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });

  await prisma.$transaction([
    prisma.cliente.update({
      where: { id: clienteId },
      data: { estagioFunil: novoEstagio, estagioAtualizadoEm: new Date() },
    }),
    prisma.eventoHistorico.create({
      data: {
        clienteId,
        corretorId: cliente.corretorId,
        tipo: "sistema",
        texto: `Estágio alterado para "${novoEstagio}".`,
      },
    }),
  ]);

  revalidatePath(`/painel/clientes/${clienteId}`);
  revalidatePath("/painel/funil");
  revalidatePath("/painel/dashboard");
}

/** Anotações de venda — nunca entram em PDF nem e-mail. Criar uma também conta como movimento. */
export async function criarNota(clienteId: string, texto: string) {
  const limpo = texto.trim();
  if (!limpo) return;
  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });

  await prisma.$transaction([
    prisma.notaCrm.create({ data: { clienteId, corretorId: cliente.corretorId, texto: limpo } }),
    prisma.eventoHistorico.create({
      data: { clienteId, corretorId: cliente.corretorId, tipo: "manual", texto: "Anotação adicionada." },
    }),
  ]);

  revalidatePath(`/painel/clientes/${clienteId}`);
}
