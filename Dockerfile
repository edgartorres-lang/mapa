# Imagem de produção do Mapa da Proteção — pensada pro EasyPanel (build a partir do Dockerfile,
# não Nixpacks). Multi-estágio: instala e builda numa imagem, e a imagem final só leva o que
# `next build` (com `output: "standalone"`, ver next.config.ts) realmente precisa pra rodar —
# bem menor que copiar o repo inteiro com node_modules e tudo. Ver DEPLOY.md pro passo a passo
# completo de publicar isto no EasyPanel.

FROM node:22-slim AS deps
WORKDIR /app
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
# `NEXT_PUBLIC_*` é inlinado na hora do `next build` — diferente de uma env var comum, definir
# ela só em runtime (EasyPanel) não muda nada depois de já buildada. Usada em
# src/app/painel/captacao/page.tsx pra montar o link público de captação; sem isso aqui, o link
# mostrado pro Edgar ficava congelado em "http://localhost:3000" (bug real, achado em produção
# 2026-09-05 — o link "Copiar" na tela de captação apontava pra localhost). `ARG` recebe do
# workflow do GitHub (`docker/build-push-action`, `build-args`); se o domínio de produção mudar
# um dia, o valor muda lá, não aqui.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npx prisma generate
# Trava o limite de memória do Node durante o build — o VPS do Edgar tem só 2 GB de RAM,
# dividido com n8n, Evolution API e dois Postgres já rodando. Sem isso, um pico de memória do
# `next build` (TypeScript + empacotamento — o processo mais pesado do build inteiro) já travou
# o servidor inteiro uma vez (2026-09-04), não só o build: o Docker ficou reiniciando container
# em loop até o VPS parar de responder, precisou reiniciar a VM pelo console do provedor. Com o
# teto aqui, o pior caso vira o build falhar com "JavaScript heap out of memory" (erro visível,
# recuperável) em vez de sufocar o host inteiro.
ENV NODE_OPTIONS="--max-old-space-size=1024"
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
