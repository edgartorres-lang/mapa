# Dois workflows novos: e-mail de agradecimento + aviso por WhatsApp

Import geral: mesmos passos de sempre, ver `00-COMO-IMPORTAR.md`. Aqui só o que é específico
de cada um dos dois.

---

## `02-lead-agradecimento.json` — e-mail pro lead

Dispara sempre que alguém termina o formulário público (`webhookLead`, sem toggle — sempre
ativo). Manda um e-mail curto de "recebemos seu contato" pro próprio lead, assinado com o nome
da corretora. Se o lead não deixou e-mail (só telefone), o node "Tem e-mail?" barra e nada é
enviado — sem erro, só não faz nada.

### Credencial que falta

O node **"Enviar e-mail"** precisa de uma credencial **SMTP** (tipo nativo do n8n, "Email Send
(SMTP)"). Depois de importar:

1. Clique no node "Enviar e-mail" → na credencial, clique **"+ Create New"** (o import nunca traz
   credencial junto, por segurança — mesma regra do `gerar-texto`).
2. Preencha com o servidor SMTP que você usa pra mandar e-mail (Gmail/Google Workspace, Hostinger,
   Zoho, etc. — qualquer um serve, é só usuário/senha/servidor/porta padrão de SMTP). Se usar
   Gmail/Workspace, normalmente precisa gerar uma "senha de app" nas configurações de segurança da
   conta Google, não a senha normal.
3. Salve a credencial com um nome tipo "SMTP Setor Norte".

O campo "De" (`fromEmail`) hoje está fixo em `naoresponda@setornorteseguros.com.br` — troque pelo
endereço de verdade que você quer usar, direto no node, se for outro.

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
