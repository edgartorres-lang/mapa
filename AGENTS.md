<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Mapa da Proteção

Ferramenta de estudo de seguro de vida para Edgar Torres, corretor único da Setor Norte Seguros
(Amapá). Produto 100% em português do Brasil. Não é dev — explique decisões técnicas em
português claro; se algo for um risco, diga em que situação concreta isso morde.

**Handoff de design (fonte de verdade de UI e fórmulas)**: `design_handoff_mapa_protecao/` na raiz
deste repositório (versionado junto do código desde 2026-09-01) — leia `README.md` e
`ESPECIFICACAO.md` de lá antes de mexer em telas ou fórmulas. É uma cópia; o original de trabalho
do Edgar continua em `G:\Meu Drive\1 Setor Norte\Comunicação Visual\Sites\Claude\Mapa da Proteção mockups\design_handoff_mapa_protecao\`
— se o design mudar lá, essa cópia precisa ser atualizada de novo (ainda não é sincronização
automática). Os `.dc.html` são protótipos de referência (Claude Design canvases), não código a
copiar. `calc()` em `Mapa da Proteção 1a+1b - Unificado.dc.html` é a fonte da verdade do
racional — este repo porta essas fórmulas em `src/lib/calc.ts`, já testado contra o caso da
Marina (`src/lib/calc.test.ts`). Não altere `calc.ts` sem reconferir contra o protótipo.

## Vocabulário obrigatório (não traduzir/renomear)

Estudo (em aberto, recalcula com fatores atuais) × Mapa da Proteção (o estudo gerado — travado,
valores congelados) × Duplicar estudo (único caminho de correção depois de gerado) × Capital a
proteger (necessidade total − receitas liquidáveis). Corretor · Lead · Cliente · Segurado ·
Dependente. Ver o glossário completo em ESPECIFICACAO.md no handoff de design.

## Não-negociáveis

- **Nunca existe botão de editar um Mapa gerado.** Em lugar nenhum da UI ou da API.
- **Excluir mapa ≠ excluir cliente.** Excluir mapa (por cliente, leva todo o histórico — decisão
  fechada no README do handoff) mantém o cadastro. Excluir cliente (LGPD) é hard delete da linha
  inteira, ficando só um registro de 4 campos em `ExclusaoLgpd` (ver prisma/schema.prisma).
- **A limpeza dos 120 dias nunca é automática** — só marca/avisa; exclusão exige autorização
  explícita do corretor.
- **O lead nunca recebe PDF nem valor de cobertura** pelo formulário público. Termina em reunião
  agendada.
- **Análise interna nunca sai da tela do corretor** — nunca entra em PDF nem e-mail, em nenhuma
  rota, em nenhuma circunstância.
- **`corretorId` em toda tabela de domínio** (cliente, estudo, mapa, fatores, campanha, etc.) —
  mesmo com um corretor só hoje.
- **n8n orquestra todas as integrações.** Este app só faz `POST` para webhooks do n8n (URLs
  configuráveis por corretor); nunca fala direto com Google Agenda, WhatsApp/Evolution, e-mail ou
  IA, e nunca guarda credencial de terceiro.
- **Fidelidade visual alta**: cores/tipografia/espaçamento do README do handoff. Fraunces nos
  títulos, Inter na interface, **nenhuma sombra em lugar nenhum** — separação por borda de 1px.

## Stack

Next.js (TypeScript, App Router) + PostgreSQL via Prisma 7 (driver adapter `@prisma/adapter-pg` —
Prisma 7 não lê mais a URL de conexão do `schema.prisma`; ela vive em `prisma.config.ts` e é
passada de novo, explicitamente, em `src/lib/prisma.ts`). PDF real (para o e-mail do mapa) sai de
um serviço separado (Chromium headless) — não roda no processo do Next. Testes com Vitest
(`npm test`).

## Notas operacionais

- **Nunca rode dois `npm install` ao mesmo tempo nesta pasta** (nem em background nem em
  terminais diferentes) — já corrompeu o `node_modules` uma vez nesta sessão (pacotes de um
  processo pisando nos do outro, `ENOTEMPTY`). Rode um de cada vez e espere terminar.
- Prisma está pinado em `7.10.0` **de propósito** — a tag `latest` do pacote aponta pra uma
  release candidate (`8.0.0-rc.12`) por enquanto. Não rode `npm i @prisma/client@latest` nem
  `prisma@latest` sem checar se o Prisma 8 já saiu estável.

