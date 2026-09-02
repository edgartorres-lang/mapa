import { prisma } from "./prisma";

/**
 * Substituto temporário de autenticação: V1 ainda não tem a tela de login (Acesso e
 * Identidade não foi construída nesta etapa). Todo o app assume que existe um corretor só —
 * o que o `prisma/seed.ts` cria — e todo código de servidor que precisaria de "o corretor
 * logado" chama isto em vez disso.
 *
 * TODO(login): quando Acesso e Identidade existir, trocar por sessão de verdade e apagar este
 * arquivo. Buscar por todas as chamadas a `obterCorretorAtual` pra achar onde plugar a sessão.
 */
export async function obterCorretorAtual() {
  const corretor = await prisma.corretor.findFirst({ orderBy: { criadoEm: "asc" } });
  if (!corretor) {
    throw new Error(
      "Nenhum corretor cadastrado. Rode `npm run db:seed` pra criar o corretor da V1 antes de usar o app.",
    );
  }
  return corretor;
}
