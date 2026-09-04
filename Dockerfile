# Imagem de produção do Mapa da Proteção — pensada pro EasyPanel (build a partir do Dockerfile,
# não Nixpacks). Multi-estágio: instala e builda numa imagem, e a imagem final só leva o que
# `next build` (com `output: "standalone"`, ver next.config.ts) realmente precisa pra rodar —
# bem menor que copiar o repo inteiro com node_modules e tudo. Ver DEPLOY.md pro passo a passo
# completo de publicar isto no EasyPanel.

FROM node:22-slim AS deps
WORKDIR /app
# `better-sqlite3` (só usado em dev, contra o SQLite local — nunca em produção, que fala com
# Postgres) é um módulo nativo. Ele baixa um binário pronto pra a maioria das plataformas comuns
# e normalmente não precisa compilar nada — mas isto aqui garante que, se precisar compilar
# porque não achou um binário pronto pra esta imagem específica, o `npm ci` não quebra por falta
# de compilador. Só existe nesta etapa (não vai pra imagem final).
RUN apt-get update && apt-get install -y --no-install-recommends python3 build-essential && rm -rf /var/lib/apt/lists/*
# Só os manifests primeiro — o Docker reaproveita esta camada entre builds enquanto eles não
# mudarem, mesmo editando código depois. `--omit=dev` não dá aqui: `next build` do próximo
# estágio precisa do `prisma` de devDependencies.
COPY package.json package-lock.json ./
# `--ignore-scripts`: sem isso, `npm ci` dispara o hook `postinstall` (`prisma generate`) — que
# quebra o build aqui, porque nesta etapa só copiamos os dois arquivos acima, `prisma/schema.prisma`
# ainda não existe neste estágio (erro real visto testando no EasyPanel: "Could not find Prisma
# Schema"). O generate de verdade roda embaixo, no estágio `builder`, depois do `COPY . .` trazer
# o schema junto — não precisa (nem pode) rodar aqui.
RUN npm ci --ignore-scripts

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json /app/package-lock.json ./
COPY . .
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# `output: "standalone"` empacota um `server.js` com só o código e os node_modules realmente
# usados — mas propositalmente NÃO leva `public/` nem `.next/static/` (arquivos servidos direto,
# sem passar pelo tracing). Sem copiar os dois abaixo, o site sobe mas CSS/JS/imagem tudo vira
# 404. Ver a nota em next.config.ts sobre `serverExternalPackages` — sem ela, faltava
# `@prisma/adapter-pg` inteiro aqui dentro, e o app só quebraria ao tentar falar com o Postgres
# de verdade (confirmado testando o build local antes de escrever este Dockerfile).
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
