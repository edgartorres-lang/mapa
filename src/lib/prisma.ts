import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

/**
 * Singleton do Prisma Client. Prisma 7 exige um "driver adapter" explícito — não lê mais a URL
 * de conexão sozinho a partir do schema. O adapter muda com o motor: SQLite (`file:...`) em
 * desenvolvimento local, Postgres em produção — mesma lógica de detecção do prisma.config.ts
 * (não dá pra compartilhar o código entre os dois arquivos porque prisma.config.ts é carregado
 * pelo CLI do Prisma antes do resto do projeto existir). Ver AGENTS.md, "SQLite local ×
 * Postgres de produção".
 *
 * `import "dotenv/config"` aqui é necessário porque, diferente do Next.js (que carrega .env
 * sozinho), o Vitest não carrega — sem isso, DATABASE_URL vem vazio em teste e o adapter errado
 * é escolhido contra um client gerado pro outro motor (erro só aparece em runtime, não em tipo).
 */
function criarAdapter(databaseUrl: string) {
  if (databaseUrl.startsWith("file:")) {
    return new PrismaBetterSqlite3({ url: databaseUrl });
  }
  return new PrismaPg({ connectionString: databaseUrl });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: criarAdapter(process.env.DATABASE_URL ?? "") });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
