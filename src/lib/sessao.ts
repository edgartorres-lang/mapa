import { SignJWT, jwtVerify } from "jose";

/**
 * Sessão de login — cookie assinado (JWT `HS256` via `jose`), sem tabela no banco. Escolhido de
 * propósito: `middleware.ts` roda no runtime Edge por padrão, e o Prisma (driver `pg`/
 * `better-sqlite3`, nenhum dos dois Edge-compatível) não dá pra chamar de lá. Com sessão
 * stateless, o middleware só verifica a assinatura do cookie — sem tocar no banco.
 *
 * Trade-off proposital: por ser stateless, "Sair" só apaga o cookie deste aparelho — não existe
 * "encerrar todas as sessões" sem manter uma lista em algum lugar. Pro caso de uso de hoje (só o
 * Edgar, sem tela de "sessões ativas"), é proporcional. Se um dia precisar de verdade (ex.:
 * multi-corretor com exigência de revogar sessão à distância), aí sim vale trocar por sessão no
 * banco.
 */

const NOME_COOKIE = "sessao";
const DURACAO = "30d";

function chaveSecreta(): Uint8Array {
  const segredo = process.env.AUTH_SECRET;
  if (!segredo) {
    throw new Error("AUTH_SECRET não configurada — defina no .env (dev) ou nas variáveis de ambiente do EasyPanel (produção).");
  }
  return new TextEncoder().encode(segredo);
}

/** Assina um novo token de sessão pra este corretor. Função pura — não mexe em cookie nenhum;
 * quem chama decide onde gravar (Server Action usa `criarSessaoCookie` abaixo; o middleware,
 * que não tem acesso à API de cookies do `next/headers`, grava na `NextResponse` ele mesmo). */
export async function assinarSessao(corretorId: string): Promise<string> {
  return new SignJWT({ corretorId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DURACAO)
    .sign(chaveSecreta());
}

/** Verifica um token de sessão. Devolve o `corretorId` se válido, `null` se ausente/inválido/
 * expirado — nunca lança erro (chamado em toda rota protegida, não pode derrubar a página). */
export async function verificarSessao(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chaveSecreta());
    return typeof payload.corretorId === "string" ? payload.corretorId : null;
  } catch {
    return null;
  }
}

export { NOME_COOKIE, DURACAO };
