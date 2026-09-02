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

## Vocabulário: chave de código × texto de interface

Regra fechada com o Edgar em 2026-09-01: **chaves de código curtas, texto de interface por
extenso.** `calc.ts` usa os identificadores do protótipo (`pre`/`fund`/`medio`/`sup`/`pos`,
`vitalicia`, `temporaria`, `pensaoMensal`, `teto`) — não renomeie, é a fonte da verdade das
fórmulas e já está testado contra o caso da Marina. Mas em qualquer lugar que o corretor ou o
cliente **leem** (rótulo de tela, cabeçalho de PDF, texto de e-mail, nome de campo de formulário),
use a forma por extenso do glossário: "Pré-escola", "Fundamental", "Médio", "Superior",
"Pós-graduação"; "Cobertura vitalícia"; "Cobertura temporária"; "Pensão de educação"; "Teto de
razoabilidade". Nunca "temporária" sem "cobertura", nunca "pós" sozinho na tela.

## Limitação conhecida: Dependente e Bem vivem dentro do JSON do Estudo

Por decisão do Edgar (2026-09-01): `Dependente` e `Bem` não são tabelas relacionais — moram dentro
de `Estudo.dados` (JSON) enquanto o estudo está aberto, igual ao protótipo. Isso significa que
**não dá pra consultar hoje** algo como "todo cliente com filho entre 15 e 17 anos" sem varrer o
JSON de cada estudo em aplicação. Aceito de propósito porque esse tipo de consulta é para campanha
de prospecção, fora da V1. Quando isso virar necessidade real, `Dependente` e `Bem` viram tabelas
próprias (com `clienteId`, não mais só dentro do estudo) — é migração de dado, não só de schema.
Não é bug nem esquecimento: é a V1 pagando esse preço de propósito por simplicidade agora.

## Ciclo do estudo (Etapa 4) — gerar, duplicar, excluir, memória de cálculo

Todas as ações do ciclo do estudo são reais, não stub:

- **Gerar**: `gerarMapa` (`src/app/estudo/actions.ts`), atrás do modal `ModalGerar` (lista o que
  trava antes de confirmar — porta de `modalGerar` em Ciclo do Estudo.dc.html).
- **Duplicar**: `duplicarEstudo` (mesmo arquivo) — só aceita um estudo `status:"gerado"`, cria um
  estudo novo (`status:"aberto"`, `duplicadoDeEstudoId` apontando pro original) com as mesmas
  respostas. Atrás do modal `ModalDuplicar` (`src/components/painel/ModalDuplicar.tsx`). Botão só
  aparece quando não há estudo em aberto pro cliente (duplicar com um já aberto criaria dois
  estudos em aberto ao mesmo tempo — ambíguo, evitei de propósito).
- **Excluir**: duas ações com granularidades diferentes (decisão 3 do README do handoff), nunca
  a mesma função:
  - `excluirMapaIsolado` (`src/app/painel/clientes/[id]/actions.ts`) — um mapa+estudo só, pela
    página do cliente. Os outros mapas do cliente ficam.
  - `excluirHistoricoCompleto` (mesmo arquivo) — TODOS os mapas/estudos do cliente, só a partir
    da fila dos 120 dias no dashboard, com autorização explícita (nunca automática). `Cascade` no
    schema apaga o `Mapa` junto quando o `Estudo` é apagado; `EventoHistorico`/`NotaCrm` **nunca**
    são apagados — são o registro de que aquilo aconteceu, sobrevivem à exclusão do mapa.
  - Ambas atrás de `ModalExclusao` (`src/components/painel/ModalExclusao.tsx`, genérico, separa
    "vai embora" × "fica" como o não-negociável exige).
- **Memória de cálculo**: `/estudo/[id]/memoria`, só existe pra Mapa gerado (mesma regra das
  saídas — lê o snapshot travado, nunca recalcula). `src/lib/memoria-calculo.ts` generaliza os 5
  grupos do protótipo (que eram hardcoded pro exemplo da Marina) pra qualquer estudo.

A fila dos 120 dias em si (quem entra nela) é computada ao vivo em `src/lib/painel-dados.ts` — não
existe um job diário persistindo um flag "candidato à exclusão". O não-negociável ("nunca
automática") está garantido pelo modal de confirmação, não por um cron que ainda não existe.

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

## SQLite local × Postgres de produção

Decisão do Edgar (2026-09-01): desenvolvimento roda em SQLite (arquivo local, `prisma/dev.db`,
gitignored — não precisa instalar Docker nem Postgres pra testar), produção roda em Postgres.
**Um schema só** (`prisma/schema.prisma`, sempre com `provider = "postgresql"`, é a única cópia
editada à mão): `prisma.config.ts` detecta `DATABASE_URL` (`file:...` → sqlite) e gera
`prisma/schema.generated.prisma` só com essa linha trocada — nunca editado à mão, recriado a cada
comando do Prisma, gitignored. Prisma não suporta `enum` nem `@db.Date` no conector SQLite, então
o schema já evita os dois (valores fechados viraram `String` validada em `src/lib/enums.ts` — ver
"Vocabulário: chave de código × texto de interface" acima, mesma lógica de "ajustar o campo em vez
de manter duas versões").

**Comandos**: `npm run db:push` sincroniza o SQLite local direto (sem gerar arquivo de migração —
é descartável, serve só pra desenvolver). `npm run db:migrate:postgres` gera migração de verdade
e **só deve rodar com `DATABASE_URL` apontando pro Postgres** (nunca pro SQLite — o SQL gerado é
de dialetos diferentes e migração de SQLite não serve pra Postgres). `prisma/migrations/` é
reservado exclusivamente pra migrações geradas contra Postgres real.

**A ressalva que importa**: SQLite prova que a lógica da aplicação funciona (schema, Prisma
Client, `calc.ts`, os testes de integração em `src/lib/prisma.integration.test.ts`). **Não prova
o banco de produção.** Antes de considerar qualquer etapa fechada, os mesmos testes precisam
passar de novo com `DATABASE_URL` apontando pro Postgres da VPS — ainda não foi feito nesta
sessão porque não há Postgres acessível daqui. Isso fica pendente até existir um Postgres (VPS ou
qualquer instância) pra rodar contra.

## Saídas são rotas separadas, não uma página só

O protótipo (`Mapa da Proteção 1a+1b - Unificado.dc.html`) tem apresentação, proposta e e-mail
como `sc-if` dentro da mesma página — então um botão "imprimir" ali sempre tinha o HTML certo no
DOM, não importa de onde foi clicado. Aqui não: cada saída é sua própria rota
(`/estudo/[id]/apresentacao`, `/proposta`, `/email`), cada uma renderizando só o próprio conteúdo.

**Isso já causou um bug real** (Etapa 2, 2026-09-02): o botão "Baixar A4" do compositor de e-mail
chamava `window.print()` direto — mas a proposta de 3 páginas não existe no DOM da tela de
e-mail, então ele imprimiria o preview do e-mail, não a proposta. Corrigido virando um link
(`<Link href="/estudo/[id]/proposta">`) em vez de um botão de imprimir local.

**Regra pra não repetir**: qualquer botão que precise do conteúdo de OUTRA saída (não a que está
na tela) tem que navegar pra rota certa primeiro — nunca chamar `window.print()` (ou
`imprimirComo()`, em `src/lib/imprimir.ts`) numa tela que não é a dona do conteúdo que você quer
imprimir. Só imprima o que está de fato renderizado na página atual.

## Notas operacionais

- **Nunca rode dois `npm install` ao mesmo tempo nesta pasta** (nem em background nem em
  terminais diferentes) — já corrompeu o `node_modules` uma vez nesta sessão (pacotes de um
  processo pisando nos do outro, `ENOTEMPTY`). Rode um de cada vez e espere terminar.
- Prisma está pinado em `7.10.0` **de propósito** — a tag `latest` do pacote aponta pra uma
  release candidate (`8.0.0-rc.12`) por enquanto. Não rode `npm i @prisma/client@latest` nem
  `prisma@latest` sem checar se o Prisma 8 já saiu estável.

