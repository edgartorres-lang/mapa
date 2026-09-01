import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Singleton do Prisma Client, do jeito exigido pelo Prisma 7 (adapter explícito — não lê mais
// a URL de conexão do schema.prisma sozinho). Em dev, guarda a instância em `global` pra não
// recriar uma conexão a cada hot-reload do Next.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
