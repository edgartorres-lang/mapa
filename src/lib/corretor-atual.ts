import { prisma } from "./prisma";
import { lerSessaoCookie } from "./sessao-cookie";

/**
 * "O corretor logado" — lê o `corretorId` da sessão (cookie assinado, ver `sessao.ts`/
 * `sessao-cookie.ts`) e busca esse corretor específico. Já preparado pro dia de multi-corretor
 * (busca por id, não "o único que existe"), mesmo sendo só um hoje.
 *
 * O gate principal fica no `middleware.ts` (bloqueia `/painel/*`/`/estudo/*` sem sessão válida,
 * antes até de a página renderizar) — isto aqui nunca deveria rodar sem sessão. Lança erro nesse
 * caso só como defesa em profundidade, não como fluxo esperado.
 */
export async function obterCorretorAtual() {
  const corretorId = await lerSessaoCookie();
  if (!corretorId) {
    throw new Error("Sem sessão ativa — isto não deveria acontecer numa rota protegida pelo middleware.");
  }

  return prisma.corretor.findUniqueOrThrow({ where: { id: corretorId } });
}
