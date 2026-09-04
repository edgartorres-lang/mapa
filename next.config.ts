import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empacota só o necessário pra rodar (não o repo inteiro) — build menor e mais rápido de
  // publicar num container no EasyPanel. Ver DEPLOY.md.
  output: "standalone",
  // Sem isso, o build de produção sobe (não dá erro) mas falta `@prisma/adapter-pg` dentro de
  // `.next/standalone/node_modules` — confirmado rodando `next build` de verdade. Causa: o
  // pacote `pg` (dependência do adapter) usa `require()` dinâmico internamente (tenta carregar
  // `pg-native`, que é opcional), e o rastreador de arquivos do `output: standalone` não segue
  // esse tipo de `require` — perde o pacote inteiro da cópia final, mesmo sendo importado
  // normalmente em src/lib/prisma.ts. Listar aqui força o Next a deixar esses pacotes como
  // `require()` de runtime (não empacotar com webpack), que aí o rastreador segue certinho.
  // `better-sqlite3`/seu adapter só existem por causa do SQLite local — não fazem mal ficar
  // listados aqui também, e evitam o mesmo problema se algum dia trocar de estratégia de dev.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", "@prisma/adapter-better-sqlite3", "better-sqlite3"],
};

export default nextConfig;
