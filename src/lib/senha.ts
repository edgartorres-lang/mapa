import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const TAMANHO_HASH = 64;

/**
 * Hash de senha — `scrypt` nativo do Node (zero dependência nova; bcrypt/bcryptjs trariam
 * binário nativo ou mais uma lib só pra isso). Formato salvo: `<salt hex>:<hash hex>`, salt
 * novo a cada chamada (mesmo texto de senha nunca gera o mesmo hash duas vezes).
 */
export async function hashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivado = (await scryptAsync(senha, salt, TAMANHO_HASH)) as Buffer;
  return `${salt}:${derivado.toString("hex")}`;
}

/**
 * Confere uma senha contra o hash salvo. `timingSafeEqual` em vez de `===` — comparação de hash
 * de senha nunca deveria vazar quanto do valor bateu através do tempo de resposta (timing
 * attack), mesmo sendo um risco baixo aqui (um corretor só, sem exposição a força bruta em
 * escala). Formato de hash inesperado (ex.: o "sem-senha-ainda" do seed, antes da Parte 6) volta
 * `false` em vez de lançar erro.
 */
export async function verificarSenha(senha: string, hashSalvo: string): Promise<boolean> {
  const [salt, hashHex] = hashSalvo.split(":");
  if (!salt || !hashHex) return false;

  const hashEsperado = Buffer.from(hashHex, "hex");
  if (hashEsperado.length !== TAMANHO_HASH) return false;

  const derivado = (await scryptAsync(senha, salt, TAMANHO_HASH)) as Buffer;
  return timingSafeEqual(derivado, hashEsperado);
}
