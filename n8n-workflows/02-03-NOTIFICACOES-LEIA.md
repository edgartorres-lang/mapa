# Dois workflows novos: e-mail de agradecimento + aviso por WhatsApp

Import geral: mesmos passos de sempre, ver `00-COMO-IMPORTAR.md`. Aqui só o que é específico
de cada um dos dois.

---

## `02-lead-agradecimento.json` — e-mail pro lead

Dispara sempre que alguém termina o formulário público (`webhookLead`, sem toggle — sempre
ativo). Manda um e-mail curto de "recebemos seu contato" pro próprio lead, assinado com o nome
da corretora. Se o lead não deixou e-mail (só telefone), o node "Tem e-mail?" barra e nada é
enviado — sem erro, só não faz nada.

### Credencial que falta — Gmail via OAuth (não SMTP)

**Atualizado 2026-09-07**: descobrimos testando que sua conta é Google Workspace, e desde março
de 2025 o Google não aceita mais usuário+senha (nem "senha de app") pra Workspace — só OAuth. Por
isso o node "Enviar e-mail" usa o node **Gmail nativo do n8n** (não mais SMTP genérico) — dá mais
trabalho de configurar uma vez só, mas depois de autorizado, funciona sozinho pra sempre, sem
senha nenhuma trafegando.

**Passo 1 — criar um projeto no Google Cloud (grátis, leva uns 5 minutos):**
1. Acesse console.cloud.google.com, logado com `edgartorres@setornorteseguros.com.br`.
2. No topo, clique em "Selecionar projeto" → "Novo projeto". Nome: algo como "Mapa da Proteção".
   Criar.
3. Com o projeto selecionado, vá em **"APIs e serviços" → "Biblioteca"**, busque **"Gmail API"**
   e clique **"Ativar"**.
4. Vá em **"APIs e serviços" → "Tela de permissão OAuth"**. Tipo de usuário: **"Interno"** (você
   está numa organização Workspace, então essa opção existe e é a mais simples — só gente do seu
   próprio domínio consegue usar, o que é exatamente o seu caso). Preenche nome do app ("Mapa da
   Proteção") e e-mail de contato (o seu). Salvar.
5. Vá em **"APIs e serviços" → "Credenciais"** → **"Criar credenciais" → "ID do cliente OAuth"**.
   Tipo de aplicativo: **"Aplicativo da Web"**. Nome: qualquer um.
6. **Antes de salvar**, abra o n8n numa aba separada, vá criar a credencial "Gmail OAuth2 API"
   (próximo passo) — ela mostra uma **URL de redirecionamento** pronta pra copiar. Cole essa URL
   no campo **"URIs de redirecionamento autorizados"** aqui no Google Cloud, aí sim clique
   "Criar".
7. O Google mostra um **ID do cliente** e uma **Chave secreta do cliente** — copia os dois.

**Passo 2 — no n8n:**
1. Clique no node "Enviar e-mail" → na credencial, **"+ Create New"** → escolha o tipo
   **"Gmail OAuth2 API"**.
2. Cole o **ID do cliente** e a **Chave secreta** que você copiou do Google Cloud.
3. Clique **"Sign in with Google"** (ou "Conectar minha conta") — abre uma tela de login do
   Google de verdade, você autoriza, e pronto — sem senha trafegando pro n8n nenhuma vez.
4. Salve a credencial com um nome tipo "Gmail Setor Norte".

Só precisa fazer isso uma vez. Se um dia o token expirar ou for revogado, o n8n avisa e é só
clicar em "Reconectar" na credencial.

### Texto do e-mail

Está em português simples, sem falar em valor de cobertura (mesmo não-negociável do resto do
app). Pra editar o texto, é só abrir o node "Enviar e-mail" no n8n e mexer no campo "Text" — não
precisa mexer no Mapa nem me pedir, é local ali mesmo.

---

## `03-notificar-whatsapp.json` — aviso pra você por WhatsApp

Dispara em 4 situações (lead novo, lead repetido, pediu pra ser chamado no WhatsApp em vez de
agendar, escolheu horário) — só quando a chave **"Integração WhatsApp"** estiver ligada em
Ajustes → Acesso e Integrações (`webhookNotificar`). Manda pro **WhatsApp que já está salvo no
seu cadastro** (Ajustes → Perfil e marca) — não precisa configurar número nenhum aqui.

### O que falta preencher — Evolution API

Você já tem Evolution API rodando no seu VPS (junto com o n8n). O node **"Enviar WhatsApp
(Evolution API)"** está com três campos de exemplo, óbvios de achar (procure por "SEU"/"COLE" no
node):

1. **URL** — troque `https://SEU-EVOLUTION-API.com/message/sendText/NOME-DA-INSTANCIA` pelo
   endereço de verdade da sua Evolution API + o nome da instância que você já usa.
2. **Header `apikey`** — troque `COLE-SUA-API-KEY-AQUI` pela chave de API da sua instância.

Esses dois dados são só seus (senha, basicamente) — nunca vão pro GitHub nem passam por mim,
preenche direto no n8n.

### Mensagens

Cada tipo de evento vira uma frase diferente (node "Montar mensagem", em código) — pra editar o
texto, mexe ali. Exemplos do que chega:

- 🆕 Lead novo: Maria Teste (Dentista) — via Link · campanha X.
- 🔁 Maria Teste preencheu o link de novo (lead repetido) — via Link · campanha X.
- 💬 Maria Teste pediu pra ser chamado no WhatsApp em vez de agendar um horário.
- 📅 Maria Teste escolheu um horário de reunião — confira a agenda.

---

## Teste de verdade

1. Ative os dois workflows (toggle "Active").
2. Abra o link de captação público e preencha o formulário até o fim, com um e-mail seu de
   teste.
3. Confira: chegou o e-mail de agradecimento? Chegou o WhatsApp de aviso (se a chave "Integração
   WhatsApp" estiver ligada em Ajustes)?
4. Se não chegar nada, olhe o histórico de execuções do workflow no próprio n8n (aba
   "Executions") — mostra o erro exato (credencial errada, URL errada, etc.).
