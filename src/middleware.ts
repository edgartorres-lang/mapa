import { NextResponse, type NextRequest } from "next/server";
import { assinarSessao, verificarSessao, NOME_COOKIE } from "@/lib/sessao";

/**
 * Login (2026-09-13) — protege `/painel/*` e `/estudo/*` inteiros; fora do escopo, intacto:
 * `/captacao/*` (formulário público do lead) e `/login`. Roda no runtime Edge (padrão do
 * `middleware.ts`) — por isso só verifica a assinatura do cookie via `jose`
 * (`src/lib/sessao.ts`), nunca chama Prisma aqui (não é Edge-compatível).
 *
 * Sliding expiration: toda request autenticada reassina o cookie com validade nova — a sessão
 * só expira depois de 30 dias sem uso, não 30 dias fixos da primeira vez que logou.
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(NOME_COOKIE)?.value;
  const corretorId = await verificarSessao(token);

  if (!corretorId) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  const resposta = NextResponse.next();
  const novoToken = await assinarSessao(corretorId);
  resposta.cookies.set(NOME_COOKIE, novoToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return resposta;
}

export const config = {
  matcher: ["/painel/:path*", "/estudo/:path*"],
};
