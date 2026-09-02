import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma não permite trocar o `provider` do datasource por variável de ambiente — só a `url`
 * (confirmado contra a documentação em 2026-09-01). O `prisma/schema.prisma` versionado é a
 * ÚNICA cópia mantida à mão, e sempre declara `provider = "postgresql"` (é o banco de
 * produção). Quando `DATABASE_URL` aponta pra um arquivo (`file:...` — SQLite, uso local de
 * desenvolvimento), geramos aqui uma cópia derivada só com essa linha trocada, nunca editada à
 * mão, sempre gitignored (prisma/schema.generated.prisma) e recriada a cada comando do Prisma.
 *
 * IMPORTANTE — ver AGENTS.md, seção "SQLite local × Postgres de produção": SQLite prova que a
 * lógica da aplicação funciona; não prova o banco de produção. `prisma/migrations/` só deve
 * conter migrações geradas contra Postgres de verdade — nunca rode `prisma migrate dev` com
 * DATABASE_URL de SQLite (use `prisma db push` pra sincronizar o SQLite local, que não gera
 * arquivo de migração nenhum).
 */
const CANONICAL_SCHEMA = path.join(__dirname, "prisma", "schema.prisma");
const GENERATED_SCHEMA = path.join(__dirname, "prisma", "schema.generated.prisma");

function resolveSchemaPath(): string {
  const url = process.env.DATABASE_URL || "";
  const isSqlite = url.startsWith("file:");
  if (!isSqlite) return CANONICAL_SCHEMA; // produção (ou qualquer url não-file): usa o schema como está

  const source = readFileSync(CANONICAL_SCHEMA, "utf8");
  const swapped = source.replace(
    /(datasource\s+db\s*\{\s*\n\s*provider\s*=\s*)"postgresql"/,
    '$1"sqlite"',
  );
  if (swapped === source) {
    throw new Error(
      'prisma.config.ts: não encontrei `provider = "postgresql"` no datasource de schema.prisma pra trocar por sqlite — o arquivo mudou de formato? Ajuste o regex aqui.',
    );
  }
  if (!existsSync(path.dirname(GENERATED_SCHEMA))) mkdirSync(path.dirname(GENERATED_SCHEMA), { recursive: true });
  writeFileSync(GENERATED_SCHEMA, swapped);
  return GENERATED_SCHEMA;
}

export default defineConfig({
  schema: resolveSchemaPath(),
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
