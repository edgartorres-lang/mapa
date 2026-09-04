# Colocar o Mapa da Proteção no ar (EasyPanel)

Guia de publicação, escrito pra você seguir clicando no painel do EasyPanel — sem precisar saber
programar. Onde aparecer "me mande", é uma informação que você copia do painel e cola de volta
pra mim, aqui na conversa, pra eu terminar a parte técnica daqui.

O repositório já está pronto do lado do código (Dockerfile, configuração de build) — o que falta
é só a parte que só você consegue fazer: criar as coisas dentro da sua conta do EasyPanel.

---

## Antes de começar

- O site atual (o domínio que já existe) **não é mexido em nada** — o Mapa da Proteção vai morar
  no subdomínio **`mapa.setornorteseguros.com.br`** (já combinado), rodando como um serviço
  separado dentro do mesmo VPS com EasyPanel.
- Você vai precisar, em algum momento, entrar no painel de onde o domínio `setornorteseguros.com.br`
  é gerenciado (registro.br, ou onde quer que você tenha comprado o domínio) pra adicionar um
  registro DNS apontando pro VPS. Se não souber onde isso é, me avise antes de começar — dá pra
  descobrir.

---

## Passo 1 — Criar o serviço de banco (Postgres)

1. No painel do EasyPanel, dentro do projeto onde você quer colocar o Mapa da Proteção (pode ser
   um projeto novo, separado do site atual), clique em **"+ Service"** (ou "Add Service").
2. Escolha o template **Postgres** (banco de dados).
3. Dê um nome ao serviço — sugestão: `mapa-db`. Deixe usuário/senha no automático (o próprio
   EasyPanel gera).
4. Depois de criado, abra o serviço e procure a aba **"Connect"** (ou "Credentials"/"Info") —
   ela mostra a *connection string* completa, algo como:
   `postgresql://postgres:xxxxxxxx@mapa-db:5432/postgres`
5. **Me mande essa connection string aqui na conversa.** Eu uso ela, uma vez só, direto do meu
   terminal local, pra preparar as tabelas do banco (não fica salva em lugar nenhum do código —
   nunca vai pro GitHub). Depois disso ela também entra como variável de ambiente do próprio
   app (passo 3) — o app precisa dela pra funcionar de verdade.
   - Se o EasyPanel tiver uma opção tipo "Expose to internet" / "Enable public access" no
     serviço de Postgres, deixe **ligada temporariamente** só pra eu conseguir conectar — pode
     desligar de novo depois que eu confirmar que preparei o banco (passo 2).

---

## Passo 2 — Eu preparo o banco (feito por mim, depois que você mandar a connection string)

Assim que eu tiver a connection string, eu rodo, uma vez só:

- `npx prisma db push` — cria todas as tabelas no Postgres de produção, a partir do mesmo
  desenho que já está testado aqui no SQLite local.
- `npm run db:seed` — cria o seu cadastro de corretor (nome, SUSEP, WhatsApp, fatores de cálculo
  padrão, horários sugeridos padrão) — sem isso, o app abre em branco/com erro na primeira tela.

Aviso quando terminar, e você pode desligar o acesso público do Postgres nesse momento, se tiver
ligado.

---

## Passo 3 — Criar o serviço do app (Mapa da Proteção)

1. No mesmo projeto, clique em **"+ Service"** de novo, agora escolhendo **"App"** (ou "From
   Source"/"Git").
2. Conecte a conta do GitHub, se ainda não tiver conectado, e escolha o repositório
   **`edgartorres-lang/mapa`**, branch **`main`**.
3. No método de build, escolha **"Dockerfile"** (o repositório já tem um `Dockerfile` pronto na
   raiz — o EasyPanel deve detectar sozinho, mas confirme que a opção selecionada é essa, não
   "Nixpacks").
4. Na aba de **variáveis de ambiente** (Environment), adicione só uma:
   - `DATABASE_URL` = a mesma connection string do Postgres do passo 1 (mas usando o **nome
     interno do serviço** como host, ex.: `mapa-db`, não um endereço público — o EasyPanel
     normalmente já mostra essa versão "interna" pra você copiar, é mais rápida e não depende de
     deixar o Postgres exposto).
   - As URLs dos 6 webhooks do n8n **não são variável de ambiente** — ficam guardadas no banco,
     por corretor, e se configuram depois de o app estar no ar, direto pela tela
     **Ajustes → Acesso e Integrações** (passo 6 abaixo). Não precisa (nem dá) pra preencher
     aqui.
5. Na aba de **porta** (Port/Networking), confirme que a porta exposta é **3000** (é o que o
   Dockerfile usa).
6. Ainda não clique em Deploy — falta o domínio (próximo passo), pra já subir certo de primeira.

---

## Passo 4 — Domínio e SSL

1. Na aba **"Domains"** do serviço do app, adicione `mapa.setornorteseguros.com.br`.
2. O EasyPanel vai te mostrar um endereço IP (o do seu VPS) — copie esse IP.
3. No painel onde o domínio `setornorteseguros.com.br` é gerenciado (registro.br, ou onde você
   registrou), crie um registro **A** com nome/host `mapa` (só isso, sem o resto do domínio)
   apontando pro IP do VPS que você copiou no passo anterior. Se tiver dúvida de onde criar esse
   registro (às vezes o DNS é gerenciado num lugar diferente de onde o domínio foi comprado), me
   mostra a tela do painel de DNS que eu te aponto o campo certo.
4. Volte no EasyPanel e peça pra gerar o certificado SSL (normalmente automático, via Let's
   Encrypt, assim que o DNS propagar — pode levar de alguns minutos a algumas horas).

---

## Passo 5 — Deploy

1. Clique em **Deploy** no serviço do app.
2. Acompanhe o log de build — a primeira vez demora um pouco mais (uns 3–5 minutos), porque
   instala tudo do zero.
3. Quando terminar, acesse `https://mapa.setornorteseguros.com.br` — deve abrir o painel do
   corretor, já com o seu cadastro (feito no passo 2).

---

## Passo 6 — Depois do ar: ligar o n8n de verdade

O app já está pronto pra isso desde a etapa de Integrações — é só entrar em
**Ajustes → Acesso e Integrações** (dentro do próprio Mapa da Proteção, já publicado) e colar as
URLs dos 6 webhooks do seu n8n, testar cada uma com o botão "Testar", e ligar as chaves das que
você quiser ativas (agenda, WhatsApp, e-mail, IA — lead e exclusão LGPD disparam sozinhos, sem
chave).

---

## O que já está pronto do lado do código (pra referência, não precisa fazer nada aqui)

- `Dockerfile` — build em duas etapas: instala e builda numa imagem, a imagem final só leva o
  necessário pra rodar (`output: "standalone"` do Next.js).
- `next.config.ts` — `serverExternalPackages` evita um bug real que eu encontrei testando o build
  de produção aqui: sem essa configuração, faltava o pacote `@prisma/adapter-pg` inteiro dentro
  do build final, e o app só quebraria ao tentar falar com o Postgres de verdade — silencioso até
  aparecer em produção. Corrigido e testado antes de eu escrever este guia.
- `package.json` — `postinstall` roda `prisma generate` sozinho a cada instalação (necessário no
  Dockerfile, que instala do zero).
- `.dockerignore` — garante que `.env`, o banco SQLite local e o `node_modules` da sua máquina
  nunca entram na imagem de produção.

## Pendências conhecidas, pra depois desta etapa

- Sem migração formal do Prisma ainda (`prisma/migrations/` não existe) — o primeiro deploy usa
  `db push` (sincroniza o schema direto, sem histórico de migração), igual já é feito no SQLite
  local. Funciona bem pra uma base nova, sem dado nenhum ainda. Se um dia precisar mudar o
  schema **depois** de já ter clientes de verdade no Postgres, vale considerar migrar pra
  `prisma migrate deploy` (com histórico) — não é urgente agora.
- PDF de verdade (Chromium headless via n8n) continua fora de escopo — a proposta A4 e a
  apresentação seguem saindo por "imprimir do navegador" (ver AGENTS.md).
- Login/senha de verdade continua fora de escopo — só um corretor, sem sessão, por decisão sua.
