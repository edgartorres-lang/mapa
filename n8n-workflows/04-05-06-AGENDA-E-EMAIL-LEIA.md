# Três workflows novos: agendar na Google Agenda, enviar o Mapa por e-mail, e esquecer (LGPD)

Import geral: mesmos passos de sempre, ver `00-COMO-IMPORTAR.md`. Aqui só o que é específico
de cada um dos três.

Combinados, esses três fecham o ciclo: quando o cliente escolhe um horário, o `04-agendar`
cria o evento na sua Google Agenda **e guarda o id do evento no sistema**; se um dia o cliente
pedir pra ser esquecido (LGPD), o `06-esquecer` usa esse id guardado pra cancelar o compromisso
sozinho, sem você precisar caçar na agenda manualmente.

---

## Credencial que falta — Google Agenda via OAuth (mesmo projeto do Gmail)

Você **já criou** um projeto no Google Cloud pro Gmail (ver `02-03-NOTIFICACOES-LEIA.md`) — não
precisa criar um projeto novo, só ativar mais uma API nele.

**Passo 1 — ativar a API do Google Agenda no mesmo projeto:**
1. Acesse console.cloud.google.com, logado com `edgartorres@setornorteseguros.com.br`, e
   confirme que o projeto selecionado no topo é o mesmo que você criou pro Gmail (algo como
   "Mapa da Proteção").
2. Vá em **"APIs e serviços" → "Biblioteca"**, busque **"Google Calendar API"** e clique
   **"Ativar"**.

**Passo 2 — no n8n, criar a credencial:**
1. Em qualquer um dos nodes que usam "Google Calendar Setor Norte" (ex.: "Criar evento" no
   `04-agendar`), clique na credencial → **"+ Create New"** → escolha o tipo **"Google Calendar
   OAuth2 API"**.
2. Cole o **mesmo ID do cliente e Chave secreta** que você já usa na credencial do Gmail — é o
   mesmo projeto do Google Cloud, então o mesmo ID/Chave serve. Não precisa gerar um novo.
   - Único cuidado: se o n8n pedir uma URL de redirecionamento diferente pra essa credencial,
     volte no Google Cloud (Credenciais → seu ID do cliente OAuth) e adicione essa URL na lista
     de "URIs de redirecionamento autorizados" (pode ter mais de uma).
3. Clique **"Sign in with Google"**, autorize, e salve com o nome **"Google Calendar Setor
   Norte"** (é esse nome que os três workflows abaixo já esperam encontrar).

Só precisa fazer isso uma vez. Depois de conectado, os três workflows usam a mesma credencial.

---

## `04-agendar.json` — cria o evento na sua Google Agenda

Dispara quando o cliente escolhe um horário no link de captação (`webhookAgendar`, chave
**"Integração de Agenda"** em Ajustes → Acesso e Integrações). Diferente dos outros webhooks,
esse **o sistema espera a resposta** — porque precisa do id do evento criado de volta, pra
poder cancelar depois se for preciso.

- O evento leva **só nome e forma de contato** do cliente — nenhum valor do estudo entra no
  título ou na descrição (mesmo não-negociável do resto do app).
- Se o cliente escolheu uma data e hora certas, o node "Tem data resolvida?" segue pro "Criar
  evento" e cria de fato na sua agenda (calendário principal — `primary`).
- Se o cliente só deixou uma sugestão em texto livre (sem data certa), não cria evento nenhum
  — responde `googleEventId: null`, e o sistema salva o agendamento do mesmo jeito, só sem
  vínculo com a agenda. Você decide o horário manualmente depois.
- Duração padrão do evento: 45 minutos (vem do campo `duracao` no payload, já configurado
  assim no app).

### Novo (2026-09-09): confirmação por e-mail pro cliente

Depois de criar o evento, se o cliente tiver e-mail cadastrado **e** a chave "Integração de
E-mail" também estiver ligada em Ajustes (não só "Integração de Agenda" — são independentes),
o workflow manda um e-mail curto confirmando o horário ("Seu horário está confirmado: [data],
às [hora]"), assinado com o nome do corretor. Só dispara quando existe data/hora certa — uma
sugestão em texto livre (ainda não confirmada de fato) não gera e-mail nenhum.

- Pra editar o texto, mexe no node "Montar texto de confirmação".
- Usa a mesma credencial Gmail dos outros e-mails — não precisa configurar de novo.

---

## `05-enviar-mapa.json` — envia o Mapa pro cliente por e-mail (HTML)

Dispara quando você clica pra enviar o Mapa gerado pro cliente (`webhookEnviarMapa`, chave
**"Integração de E-mail"** em Ajustes → Acesso e Integrações).

**Atualizado 2026-09-09**: o e-mail passou de texto puro pra **HTML com a identidade visual do
Mapa** (mesmas cores usadas no resto do app) — card branco com cabeçalho azul-marinho, capital
total em destaque, linhas de vitalícia/temporária/Pensão de Criação, e a distribuição por
categoria com uma bolinha colorida igual à barra da apresentação. Continua **sem link** pra
nenhuma página do sistema (decisão de 2026-09-08, mantida — só o conteúdo mudou de texto pra
HTML). Não existe ainda um PDF de verdade gerado pelo app — os campos `anexos.a4`/`anexos.slides`
que chegam no payload seguem **reservados pro futuro** e este workflow não faz nada com eles.

- Pra editar o visual, mexe no node "Montar texto do email" — é código, monta um HTML com
  tabelas (padrão de e-mail, funciona em qualquer cliente de e-mail) e estilo direto em cada
  elemento. As cores estão em variáveis no topo do código (`MARINHO`, `FUNDO`, etc.) — mudar ali
  muda em tudo.
- Usa a **mesma credencial Gmail** já configurada pro `02-lead-agradecimento.json` — não precisa
  configurar de novo.

---

## `06-esquecer.json` — LGPD: cancela os compromissos futuros do cliente

Dispara quando alguém pede exclusão dos dados (LGPD) e existiam agendamentos futuros com
`googleEventId` salvo (`webhookEsquecer`, sem toggle — sempre ativo, é obrigação legal). Não
espera resposta do sistema (dispara e segue).

- Recebe uma lista de ids de evento (`eventosFuturos`) — um cliente pode ter mais de um
  compromisso marcado.
- Pra cada id, cancela (deleta) o evento correspondente na sua Google Agenda.
- Se a lista vier vazia (cliente nunca chegou a agendar, ou os agendamentos eram só sugestões
  em texto livre sem evento criado), o workflow simplesmente não tem nada pra cancelar — não dá
  erro.

---

## Teste de verdade

1. Ative os três workflows (toggle "Active").
2. No painel, confirme que **"Integração de Agenda"** e **"Integração de E-mail"** estão ligadas
   em Ajustes → Acesso e Integrações, com as URLs de Production dos três workflows coladas nos
   campos certos.
3. Abra o link de captação, preencha até a etapa de agendamento (com um e-mail seu de teste) e
   escolha um horário certo (não texto livre). Confira: apareceu o evento na sua Google Agenda,
   com só nome+contato? Chegou o e-mail de confirmação de horário?
4. No painel do cliente, gere um Mapa (se ainda não tiver) e clique pra enviar por e-mail. Confira
   se chegou o e-mail em HTML, com o visual certo e os valores certos.
5. Se quiser testar o `esquecer`: peça exclusão LGPD de um cliente de teste que tenha um
   agendamento com evento criado, e confira se o evento sumiu da sua agenda.
6. Se algo não chegar, olhe a aba "Executions" de cada workflow no n8n — mostra o erro exato
   (credencial errada, URL errada, etc.).
