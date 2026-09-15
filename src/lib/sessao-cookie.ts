import "server-only";
import { cookies } from "next/headers";
import { assinarSessao, verificarSessao, NOME_COOKIE } from "./sessao";

/**
 * Lado Node dos cookies de sessão (Server Actions/Server Components — `next/headers` não roda no
 * runtime Edge do `middleware.ts`, por isso fica separado de `sessao.ts`, que o middleware
 * importa direto). `import "server-only"` trava em build se algum dia um Client Component
 * importar isto por engano.
 */

export async function criarSessaoCookie(corretorId: string) {
  const token = await assinarSessao(corretorId);
  const jar = await cookies();
  jar.set(NOME_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias — mesma duração do token em sessao.ts
  });
}

/** `corretorId` da sessão atual, ou `null` se não estiver logado. Não redireciona — quem chama
 * decide (o gate principal é o `middleware.ts`; isto é defesa em profundidade / leitura direta). */
export async function lerSessaoCookie(): Promise<string | null> {
  const jar = await cookies();
  return verificarSessao(jar.get(NOME_COOKIE)?.value);
}

export async function apagarSessaoCookie() {
  const jar = await cookies();
  jar.delete(NOME_COOKIE);
}
