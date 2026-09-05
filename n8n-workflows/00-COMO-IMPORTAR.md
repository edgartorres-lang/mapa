# Como importar um workflow no n8n (passo a passo geral)

Vale pra este e pros próximos que eu for mandando. Sempre os mesmos passos.

## 1. Pegar a chave da Anthropic (Claude)

1. Acesse **https://console.anthropic.com/settings/keys** (crie uma conta se ainda não tiver —
   é separada da sua conta aqui comigo).
2. Clique em **"Create Key"**, dê um nome (ex.: "mapa-da-protecao-n8n") e copie a chave — ela só
   aparece uma vez.
3. Você vai precisar colocar um cartão/crédito na conta da Anthropic pra API funcionar (é
   cobrança por uso, não assinatura — cada geração de texto custa uma fração de centavo).

## 2. Criar a credencial no n8n (uma vez só, todos os workflows de IA reaproveitam)

1. No n8n, vá em **Credentials** (ícone de chave, barra lateral) → **"+ Add Credential"**.
2. Procure por **"Header Auth"** (Generic Credential Type → HTTP Header Auth).
3. Preencha:
   - **Name**: `anthropic-version` → não, espera — os campos aqui são **Name** (nome da
     credencial, ex.: `Anthropic API`) e depois **Header Name** / **Header Value**.
   - **Header Name**: `x-api-key`
   - **Header Value**: cole a chave que você copiou no passo 1.
4. Salve.

## 3. Importar o workflow

1. No n8n, vá em **Workflows** → **"+ Add Workflow"** → menu **"⋯"** (três pontinhos, canto
   superior direito) → **"Import from File"**.
2. Selecione o arquivo `.json` que eu te mandei (ex.: `01-gerar-texto.json`).
3. O workflow abre no editor, com os blocos já desenhados.
4. Clique no node **"Chamar Claude"** (o segundo bloco) → na seção de credencial, escolha
   **"Anthropic API"** (a que você criou no passo 2) — o import não traz a credencial junto, por
   segurança, então esse passo é manual sempre.
5. Clique em **"Save"** (canto superior direito).
6. Ligue o workflow no toggle **"Active"** (canto superior direito, ao lado de Save).

## 4. Pegar a URL do webhook

1. Clique no primeiro bloco (**"Webhook"**).
2. Copie a **URL de produção** (Production URL — não a de teste/"Test URL", que só funciona
   com o editor aberto).
3. Vai ser algo como `https://SEU-N8N.com/webhook/gerar-texto`.

## 5. Colar no Mapa da Proteção

1. Entre no Mapa → **Ajustes → Acesso e Integrações**.
2. Ache o cartão **"IA · textos do estudo"**.
3. Cole a URL no campo, clique em **"Testar"** (deve responder "✓ Respondeu ..." — mas repare:
   o teste manda um payload de mentira `{tipo:"teste",...}`, então a Claude provavelmente vai
   devolver um texto que não bate no formato esperado — o importante nesse teste é só confirmar
   que o n8n respondeu 200, não que o texto saiu perfeito).
4. Clique em **"Salvar"**.
5. Ligue a chave **"IA · textos do estudo"** (toggle ao lado do nome do cartão).

## 6. Teste de verdade

1. Abra um estudo em aberto no Mapa (Painel → Estudos → qualquer um) e vá até a etapa
   "Resultado".
2. Clique em **"Gerar textos"**.
3. Se aparecer o "Resumo para o cliente" e a "Análise interna" preenchidos, funcionou.
4. Se der erro, me manda a mensagem — geralmente é a credencial não estar selecionada no node,
   ou o workflow não estar "Active".
