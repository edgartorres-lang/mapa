import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 tirou a URL de conexão do schema.prisma — ela mora aqui e é passada de novo,
// explicitamente, pro adapter em src/lib/prisma.ts. Ver AGENTS.md e README.md deste repo.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
