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

## Três bugs reais do Edgar (2026-09-03) — navegação e dados incompletos

Achados navegando o site pronto, não em teste dirigido — por isso vale registrar como classe de
erro, não só o fix pontual.

- **"+ Novo estudo" sempre criava um cliente em branco, mesmo com um cliente aberto na tela.** O
  botão do menu lateral (`src/app/painel/layout.tsx`) é um Server Component sem acesso à URL da
  página — não tinha como saber "de qual cliente" o corretor estava olhando. Virou
  `BotaoNovoEstudo` (`src/components/painel/BotaoNovoEstudo.tsx`, Client Component só pra ler
  `usePathname()`) chamando `abrirOuCriarEstudoDoCliente(clienteId)` quando o pathname bate com
  `/painel/clientes/[id]`, com três casos (mesma lógica que já decidia quando mostrar
  "Duplicar"): cliente já tem estudo aberto → só abre ele; cliente já tem Mapa gerado e nenhum
  aberto → manda pra página do cliente, onde "Duplicar" é o caminho certo (não cria um estudo
  solto por fora da linhagem `duplicadoDeEstudoId`); cliente sem nada → cria de verdade,
  pré-preenchido com nome/contato/profissão/estado civil/sexo já conhecidos do cadastro. Fora da
  página de um cliente, continua criando um cliente novo em branco (`criarEstudoNovo`, sem mudança).
- **Sem jeito de voltar ao painel de dentro de um estudo.** `/estudo/[id]` (e as saídas dentro
  dele) vive fora do layout `/painel/*` — não reaproveita a barra lateral, de propósito (o
  wizard/saídas usam a tela inteira). Mas isso deixava a única saída sendo o botão Voltar do
  navegador. `EstudoShell` (`src/components/estudo/EstudoShell.tsx`) agora recebe `clienteId` e
  mostra "← Painel" no cabeçalho, linkando pra `/painel/clientes/[clienteId]` — dali a barra
  lateral de sempre volta a existir. As saídas (apresentação/proposta/e-mail/memória) já tinham
  "← Voltar ao resumo" pro estudo (`BarraSaida`), então a cadeia agora fecha: saída → estudo →
  cliente → painel.
- **Duplicar um estudo antigo quebrava com "Cannot read properties of undefined (reading
  'clt')".** Causa raiz: um cliente de teste da Etapa 1 tinha `Estudo.dados` gravado como `{}`
  (nunca passou por `criarEstudoNovo`/`enviarLead`, então nunca ganhou o formato completo de
  `EstudoFormulario`). `duplicarEstudo` copiava esse JSON cru sem validar; `calc()` não tem
  nenhuma defesa contra `EstudoDados` incompleto e quebra na hora ao tentar ler
  `d.vinculos[algumVinculo]`. Corrigido na raiz, não remendado no `calc()` (que continua fiel ao
  protótipo, sem defesa nenhuma — de propósito, ver a regra de não alterar `calc.ts` sem
  reconferir): `paraEstudoFormulario()` em `src/lib/estudo-formulario.ts` normaliza qualquer
  `Estudo.dados` cru pro formato completo (inclusive dentro de `vinculos`/`edu`/`anexos`,
  objetos aninhados — um merge raso não bastava), testado em `estudo-formulario.test.ts`. Troquei
  todo `estudo.dados as unknown as EstudoFormulario` (cast direto, sem validar) por essa função —
  em `carregar-saida.ts`, `estudo/[id]/page.tsx`, `estudo/actions.ts` (`gerarMapa` e, o mais
  importante, o `dados` gravado por `duplicarEstudo`) e `painel/ajustes/page.tsx`. **Regra pra não
  repetir**: qualquer leitura nova de `estudo.dados` do banco passa por `paraEstudoFormulario()`,
  nunca por um cast direto — o cast confia que o JSON está completo, e nem sempre está.

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

## Apresentação — 10 slides (2026-09-03)

Fonte de verdade trocou: `Wizard 1a - Protótipo funcional v3.dc.html` (não
`Mapa da Proteção 1a+1b - Unificado.dc.html`, que ficou pra trás nesse ponto — mesmo `calc()`,
apresentação redesenhada). Cada vez que a apresentação precisar mudar de novo, releia esse arquivo
antes de mexer — o Edgar já pediu isso uma vez explicitamente ("não confie no que já está
implementado") depois de a tela ter mudado de 6 pra 10 telas sem eu saber.

Ordem das 10 (`src/app/estudo/[id]/apresentacao/page.tsx`): Capa (ganhou uma linha de contexto
pessoal sob o nome — `r.subtitulo`, já existia em `apresentacao.ts` mas não era renderizada aqui)
· Ponto de partida · A conta · Panorama/"O que cada parte resolve" (4 categorias) · **Proteção em
vida** (novo — vitalícia e temporária lado a lado) · **Educação dos filhos** (novo, slide próprio)
· **Além da morte** (novo — invalidez, DIT e doenças graves, que antes só apareciam na lista
"Coberturas calculadas" da tela do estudo, nunca na apresentação) · **Resumo para o cliente**
(novo — ver abaixo) · A recomendação · Próximo passo (QR code + foto, já existia). Mesma paleta e
componentes de cartão do resto do sistema — nenhuma cor nem fonte nova.

**"Resumo para o cliente" na apresentação é sempre visível, não atrás de botão de gerar IA** —
diferente da tela do estudo (`src/components/estudo/etapas/Resultado.tsx`, `Resultado`), que
continua com o "Gerar textos" desabilitado (stub, depende do webhook `/webhook/gerar-texto` que
ainda não tem tela de configuração — ver a seção "Integrações" mais abaixo). Isso é possível
porque o texto do cliente **nunca foi gerado por IA de verdade, nem no protótipo**: é
determinístico, montado só com os números já calculados (`textos(c).cliente` no protótipo,
`resumoParaOCliente` em `src/lib/apresentacao.ts`, 5 frases, sem chamar webhook nenhum). A
proposta A4 também passou a usar esse texto como reserva quando `Mapa.resumoParaVoce` (nunca
escrito por nada hoje) estiver vazio — antes mostrava "Texto ainda não gerado nesta etapa (Etapa
5)" pro **cliente ler no PDF**, o que é pior que mostrar um texto determinístico razoável.
`analiseInterna`/"Análise interna" não entra em nada disso — continua nunca aparecendo em saída
nenhuma, só na tela do corretor (não-negociável).

**Rótulo renomeado, não o identificador**: "Resumo para você" virou "Resumo para o cliente" em
todo texto visível (glossário, 2026-09-03) — telas, rótulo do anexo de e-mail, README/
ESPECIFICACAO do handoff. `Mapa.resumoParaVoce` (coluna do banco), `resumoParaVoce` (variável) e
qualquer outro identificador técnico **continuam com o nome antigo** — o Edgar pediu
explicitamente pra não mexer nisso. Se precisar adicionar um campo novo pra esse texto no futuro,
o nome técnico natural seria algo como `resumoParaOCliente` (já é o nome usado em
`apresentacao.ts` pro campo calculado) — mas não renomeie o que já existe no banco só por
consistência.

## Captação pública (Etapa 5) — formulário do lead, agendamento, webhooks

- **Rotas**: `/captacao` (formulário público, `src/app/captacao/`) e `/painel/captacao` (link,
  campanhas, funil de 30 dias, área do corretor). `src/components/captacao/FormularioLead.tsx` é
  o componente grande — máquina de estado `tela` (nome → welcome → 12 perguntas → contato →
  revisão → agendar → ok), uma pergunta por tela, portado de "Link do Cliente - Protótipo.dc.html"
  e "Captação e Agendamento.dc.html".
- **Preenchimento sobrevive a fechar a aba**: persistido em `localStorage` (chave
  `mapa-captacao-v1`) a cada mudança de tela/resposta. **`"ok"` (tela final, depois de confirmar
  agendamento) nunca é salvo nem retomado** — é estado terminal, e `canalFinal`/`dataFinal` (o que
  a tela de confirmação mostra) só existem como state local do componente, nunca vão pro
  localStorage. Um bug real aqui (corrigido em 2026-09-02): o efeito de salvamento reescrevia o
  localStorage com `tela:"ok"` depois que `handleConfirmar` já tinha limpado a chave, porque o
  `removeItem` era síncrono mas o efeito de salvamento só roda no commit seguinte — a
  correção fez o próprio efeito (e o carregamento inicial) tratar `"ok"` como não-persistível.
  Se mexer nessa máquina de estado de novo, mantenha essa garantia dos dois lados (salvar e
  carregar), não só de um.
- **Lead repetido**: telefone OU e-mail iguais a um `Cliente` existente reaproveita o cadastro
  (atualiza telefone/email/estadoCivil/lgpd, **nunca mexe em `estagioFunil`** — um cliente já
  avançado no funil não regride pra "lead") e abre um `Estudo` novo. Quem não bate com ninguém
  vira `Cliente` novo com `estagioFunil:"lead"`. Ver `enviarLead` em `src/app/captacao/actions.ts`.
  **Nome protegido depois de correção manual** (decisão do Edgar, 2026-09-02): o `nome` só é
  sobrescrito pelo lead repetido enquanto `Cliente.nomeEditadoManualmente` for `false`. Assim que o
  corretor corrige o nome pela página do cliente (`NomeEditavel`, botão ✎ ao lado do nome — chama
  `editarNomeCliente` em `src/app/painel/clientes/[id]/actions.ts`), a flag vira `true` e nenhum
  reenvio do link (apelido, erro de digitação) apaga a correção de novo. A correção manual fica
  registrada em `EventoHistorico` (`"Nome corrigido: ... → ..."`), igual aos outros eventos do
  cliente.
- **Mapeamento das respostas do lead pro `EstudoFormulario`**: `mapearLeadParaEstudo` em
  `src/lib/lead-formulario.ts`. Gaps conhecidos, documentados no próprio arquivo:
  - Vínculo "Aposentado(a) ou pensionista" não tem `VinculoKey` equivalente em `calc.ts` → mapeia
    pra `null`, não contribui renda nenhuma no cálculo até o corretor completar na reunião.
  - O formulário público não pergunta profissão, idade de aposentadoria nem sexo — ficam no
    padrão de `ESTUDO_VAZIO`.
  - Reserva do INSS (`res.inss`) não é perguntada (só FGTS/previdência/seguro) — fica 0.
  - Bens de patrimônio (`patr`) sempre viram `tipo:"Outro"` (o formulário não pergunta o tipo do
    bem). `liquidavel` é real desde 2026-09-03 — cada item tem um toggle "Consigo vender rápido,
    numa emergência" (é a definição de bem liquidável, em linguagem de lead — ver o `help` da
    pergunta em `PERGUNTAS_LEAD`).
  - Prazo em texto ("até concluir os estudos", "por tempo indeterminado") mapeia pra `0`
    (indeterminado em `calc.ts`) — é aproximação, não pergunta símbolo-a-símbolo.
- **Webhooks disparados** (`src/lib/webhooks.ts`, `dispararWebhook` — best-effort, nunca bloqueia
  o fluxo, loga e segue se a URL não estiver configurada ou o n8n estiver fora do ar):
  - `corretor.webhookLead`: ao enviar o formulário — `{ nome, telefone, email, campanha }`.
  - `corretor.webhookNotificar`: em três pontos — lead novo/repetido (`tipo:"lead_novo"` ou
    `"lead_repetido"`), horário escolhido (`tipo:"horario_escolhido"`, dispara também nos canais
    "sugerido") e pedido de retorno por WhatsApp (`tipo:"pediu_whatsapp"`).
  - `corretor.webhookAgendar`: ao confirmar horário fixo ou sugerido (não no canal WhatsApp, que
    não agenda nada) — `{ nome, contato, data, hora, duracao:45, sugestaoLivre }`. Nunca leva
    valor de cobertura (não-negociável).
  - As três URLs ainda não têm tela pra configurar — a tela "Integrações" mora em
    `Acesso e Identidade.dc.html` (tela 6), um protótipo separado de `Ajustes.dc.html`, e nunca
    esteve dentro das 6 etapas combinadas com o Edgar (a Etapa 6 é só os 4 blocos do próprio
    `Ajustes.dc.html`, construídos agora). Até essa tela existir, as seis URLs de webhook ficam
    `null` em todo `Corretor`, então todo disparo cai no branch "não configurado" e só loga —
    sinalizado ao Edgar ao fechar a Etapa 6.
- **Canal "whatsapp" não cria `Agendamento`**: pedir retorno por WhatsApp registra o evento e
  dispara `webhookNotificar`, mas não tem hora nem compromisso — não há linha em `Agendamento`
  pra esse caso, só para os canais "horário fixo" e "sugerido" (`confirmarAgendamento` em
  `src/app/captacao/actions.ts`).

## Ajustes (Etapa 6) — fatores de cálculo, horários, LGPD, acesso

Porta dos 4 blocos de `Ajustes.dc.html` — `src/app/painel/ajustes/page.tsx` (uma rota só,
`?aba=1..4`, sem JS pra trocar de aba) + `src/app/painel/ajustes/actions.ts` + componentes em
`src/components/painel/ajustes/`.

- **Fatores de cálculo (aba 1)**: cada campo do formulário na verdade vive numa de três camadas
  bem diferentes — catalogadas em `src/lib/fatores-ajustes.ts` (`GRUPOS_FATORES`, campo `camada`),
  não é decisão de UI, é o que `calc.ts` de fato faz:
  - **"live"** (`fatorPensaoServidor`, `fatorAutonomo`, `anosInvalidez`, `pctDit`,
    `fatorDoencasGraves`): `calc()` lê direto do corretor a cada render — muda um estudo em
    aberto assim que a tela dele recarregar, sem duplicar nada.
  - **"padrao"** (`pctCustoTransmissao`, `prazoManutencaoAnos`, `tetoMultiplicador`,
    `prazoPensaoAnosPadrao`): via `padroesPorEstudo()`, só viram o valor inicial de estudos
    **criados depois de salvar**. Estudos já abertos guardaram a própria cópia em `Estudo.dados`
    no momento em que nasceram e não mudam sozinhos — o racional já permite ajustar caso a caso
    dentro do estudo. Fácil de ler errado como "live" só de olhar a tela do protótipo; não é.
  - **"inerte"** (`mesesVitalicia`, `idadeIndependencia`, `pctInvalidezDoenca`,
    `pctRendaInvalidez`): existem no schema e na tela por fidelidade ao design, mas `calc.ts`
    nunca leu esses valores — conferido de novo contra o `calc()` do protótipo mestre
    (`Mapa da Proteção 1a+1b - Unificado.dc.html`, ~linha 1101, que só expõe `anosInvalidez`
    entre esses cinco). Editar esses quatro campos não muda nenhum número hoje — a tela mostra
    uma nota amarela em cada um, pra não deixar o Edgar (ou uma sessão futura) achar que mudou.
    Já era um comportamento parcialmente sinalizado em `src/lib/fatores-calculo.ts` desde a
    Etapa 5 (só `pctInvalidezDoenca`/`pctRendaInvalidez`); a Etapa 6 achou mais dois campos no
    mesmo caso ao conferir contra o `calc()` de verdade.
  - **"travado"** (`fatorClt`, `fatorServidor`): input desabilitado, sempre 1,00 — decisão de
    design de propósito (README), não limitação.
  - A "Simulação" ao lado escolhe **um** estudo em aberto de verdade pra mostrar o efeito antes
    de salvar — prefere um que já tenha renda preenchida (`temRenda` em `AbaFatores`), senão
    mostraria zero em tudo pra qualquer lead recém-chegado sem nada respondido ainda. Compara o
    valor com os fatores em edição contra o valor com os fatores salvos, não contra um mapa
    congelado (não tem por que existir um mapa gerado pra simular).
- **Horários sugeridos (aba 2)**: os três slots (`HorarioSugerido`) e três chaves em `Corretor`.
  `ofereceCampoAberto` e `pulaFimDeSemana` são reais — mudam `FormularioLead.tsx` (esconde/mostra
  "Nenhum desses") e `calcularDataHorario()` (empurra sábado/domingo pra segunda,
  `src/lib/horarios-sugeridos.ts`, testado em `horarios-sugeridos.test.ts`) tanto na prévia
  (client) quanto na gravação de verdade (`confirmarAgendamento`, server) — os dois têm que usar
  a mesma função com o mesmo flag, senão a prévia mente. `aceitaHorarioOcupado` é só documentação
  por enquanto: fica gravado no banco, mas não há checagem de agenda nenhuma pra ligar/desligar —
  o app nunca consultou o Google Agenda antes de oferecer um horário, com ou sem essa chave (ver
  o cartão "Conflito não bloqueia", que já descrevia esse comportamento antes da Etapa 6).
- **LGPD e retenção (aba 3)**:
  - Consentimentos: lê `Cliente` direto, sem tabela própria. "exportar CSV" é uma Route Handler
    (`src/app/painel/ajustes/exportar-consentimentos/route.ts`) — 4 colunas, sem biblioteca.
  - `diasRetencao` mora em `FatoresCalculo` (não em `Corretor`) só porque a linha já existe
    1:1 por corretor. `carregarKpis`/`AbaLgpd` agora recebem esse número em vez do `120`
    hardcoded que existia desde a Etapa 3 — `avisos120` no dashboard (`src/app/painel/dashboard/
    page.tsx`) continua com o nome antigo (não vale a pena renomear só por causa disso), mas o
    valor comparado já vem de `FatoresCalculo.diasRetencao`.
  - **Pedido de exclusão LGPD** (`registrarExclusaoLgpd`, `src/app/painel/ajustes/actions.ts`) é
    a ação mais destrutiva do app inteiro: `prisma.cliente.delete` de verdade (cascade leva
    estudos/mapas/agendamentos/eventos/notas), sobra só `ExclusaoLgpd` (4 campos, sem nome/
    telefone/e-mail — decisão 6 do README). Antes de apagar, junta `googleEventId` dos
    agendamentos futuros do cliente e manda no payload de `webhookEsquecer`, pro n8n cancelar na
    agenda de verdade (o app nunca fala com o Google Agenda direto). Modal de confirmação em dois
    passos, nome do cliente escrito por extenso — é fácil de mais pra ser um clique só.
  - **Achado real durante o teste desta etapa**: o campo de dias de retenção só tinha
    `onBlur` pra salvar (sem botão). No ambiente de teste (Browser pane), cliques e Tab reais não
    disparavam o evento de blur do input de jeito nenhum (confirmado com `elementFromPoint` e um
    listener nativo direto no elemento — não é reconciliação do React, o navegador simplesmente
    não emitiu o evento nesse contexto). Não dava pra garantir que isso não aconteceria também
    num navegador de verdade em alguma situação (username autocomplete, extensão, etc.), e todo
    o resto da tela usa botão explícito — então adicionei um "Salvar" visível (mais Enter) em vez
    de confiar só no blur. Guarde esse padrão: **campo que salva sozinho sempre precisa de uma
    saída explícita também**, não só um efeito colateral de perder o foco.
- **Acesso e senha (aba 4)**: **referência, não funcional** — os 3 passos de recuperação de senha
  e as "Regras do acesso" são os mesmos textos estáticos do protótipo, sem formulário de verdade
  por trás. Não tem login real no app hoje (`obterCorretorAtual()` em `src/lib/corretor-atual.ts`
  segue sendo o substituto — só busca "o corretor", sem senha nem sessão). A tela de login/senha
  de verdade vive em `Acesso e Identidade.dc.html`, que **nunca esteve nas 6 etapas** combinadas
  com o Edgar — é trabalho novo, não uma etapa esquecida, e só deveria entrar em pauta quando (se)
  o produto for abrir para mais de um corretor.
- **Perfil e marca (aba 5, adicionada 2026-09-03 a pedido do Edgar — não vem de Ajustes.dc.html
  nem estava nas 6 etapas)**: nome/cargo/corretora/SUSEP/WhatsApp/e-mail/endereço/razão social
  (texto, um "Salvar perfil" só) e três imagens (foto do corretor, logo claro pra fundo escuro,
  logo escuro pra fundo claro — cada uma salva sozinha ao escolher o arquivo, sem precisar do
  botão). `endereco` é campo novo em `Corretor` (não existia no protótipo original).
  - **Imagem = data URL no banco, não arquivo.** `fotoUrl`/`logoClaroUrl`/`logoEscuroUrl`
    guardam uma string `data:image/...;base64,...` direto na coluna (`FileReader.
    readAsDataURL` no navegador, ~1,5MB de arquivo por imagem no máximo). Decisão de propósito
    pra não montar upload-pra-disco/S3 só pra um corretor — ver a nota em `prisma/schema.prisma`
    pra quando isso deixar de valer a pena (mais de um corretor, ou imagens maiores).
  - **Sete lugares usam essas imagens**, cada um escolhendo claro ou escuro pelo fundo:
    capa da apresentação e cabeçalho do e-mail (fundo escuro → `logoClaroUrl`), cabeçalho da
    proposta A4 (fundo branco → `logoEscuroUrl`), tela inicial do link de captação (fundo escuro
    → `logoClaroUrl`), barra lateral do painel (→ `fotoUrl`, cai pra inicial do nome se não
    houver), última tela da apresentação e assinatura do e-mail (→ `fotoUrl`), e as duas telas de
    contato do formulário do lead (→ `fotoUrl`). Sem imagem, cada lugar mantém a caixa tracejada
    "LOGO"/"FOTO" de sempre — nada trava. `construirApresentacao()` (`src/lib/apresentacao.ts`)
    é quem repassa as três URLs pro objeto `r` que as três saídas consomem; captação e painel
    lêem `corretor.fotoUrl`/`logoClaroUrl` direto, sem passar por `r`.

## Notas operacionais

- **Depois de qualquer mudança em `prisma/schema.prisma`, reinicie o `next dev`** — não basta
  `prisma db push` + `prisma generate`. O processo do dev server já tem o Prisma Client antigo no
  cache de módulos do Node; `generate` reescreve o client em disco mas o processo rodando não
  recarrega sozinho. Sintoma: `PrismaClientValidationError` mencionando um campo que você acabou
  de adicionar, mesmo com o client em disco correto (`node_modules/.prisma/client/index.d.ts` já
  atualizado). Editou o schema → `db:push` → `generate` → **reinicie o servidor** (aconteceu de
  verdade em 2026-09-02, campo `Agendamento.textoLivre`).
- **Nunca rode dois `npm install` ao mesmo tempo nesta pasta** (nem em background nem em
  terminais diferentes) — já corrompeu o `node_modules` uma vez nesta sessão (pacotes de um
  processo pisando nos do outro, `ENOTEMPTY`). Rode um de cada vez e espere terminar.
- Prisma está pinado em `7.10.0` **de propósito** — a tag `latest` do pacote aponta pra uma
  release candidate (`8.0.0-rc.12`) por enquanto. Não rode `npm i @prisma/client@latest` nem
  `prisma@latest` sem checar se o Prisma 8 já saiu estável.
- **`npx tsc --noEmit` pode falhar com erro de sintaxe dentro de `.next/dev/types/validator.ts`**
  (algo como "Unexpected keyword or identifier" numa linha que começa no meio de uma palavra,
  tipo `ific extends AppPageConfig...`) enquanto o `next dev` está rodando e recompilando rotas ao
  mesmo tempo — é o Turbopack reescrevendo esse arquivo gerado, não erro de código de verdade
  (aconteceu de verdade em 2026-09-03). Não é preciso parar o servidor: normalmente já resolve
  rodar `tsc` de novo, ou visitar uma rota no navegador (o que força a regeneração) antes de
  tentar de novo. Só apague `.next` como último recurso, e nesse caso reinicie o `next dev` e
  visite pelo menos uma página **antes** de rodar `tsc` de novo — sem isso faltam os tipos
  globais (`LayoutProps` etc.) que o Next só gera depois de compilar alguma rota.

