# Como importar um workflow no n8n (passo a passo geral)

Vale pra este e pros próximos que eu for mandando. Sempre os mesmos passos.

## 1. A credencial da Anthropic (Claude)

Você já tem uma — apareceu como **"Anthropic account 2"** em Credentials, testada com sucesso.
Não precisa criar nada novo; o workflow já vem configurado pra usar exatamente essa (é do tipo
nativo "Anthropic" do n8n, não um Header Auth genérico — atualizei o `01-gerar-texto.json` pra
isso depois de ver que você já tinha essa credencial pronta).

Se um dia precisar criar uma do zero (outra conta, ou se essa expirar): Credentials → "+ Add
Credential" → procure **"Anthropic"** → cole a **API Key** (gerada em
https://console.anthropic.com/settings/keys — precisa de cartão cadastrado lá, é cobrança por
uso).

## 2. Importar o workflow

1. No n8n, vá em **Workflows** → **"+ Add Workflow"** → menu **"⋯"** (três pontinhos, canto
   superior direito) → **"Import from File"**.
2. Selecione o arquivo `.json` que eu te mandei (ex.: `01-gerar-texto.json`).
3. O workflow abre no editor, com os blocos já desenhados.
4. Clique no node **"Chamar Claude"** (o segundo bloco, o que mostra o aviso de credencial
   faltando) → na seção de credencial, escolha **"Anthropic account 2"** — o import nunca traz
   credencial junto, por segurança, então esse clique é sempre manual, mesmo já tendo a
   credencial pronta.
5. Clique em **"Save"** (canto superior direito).
6. Ligue o workflow no toggle **"Active"** (canto superior direito, ao lado de Save) — ou
   **"Publish"**, dependendo da versão do seu n8n (é a mesma coisa: coloca o workflow rodando de
   verdade, não só no modo de teste do editor).

## 3. Pegar a URL do webhook

1. Clique no primeiro bloco (**"Webhook"**).
2. Copie a **URL de produção** (Production URL — não a de teste/"Test URL", que só funciona
   com o editor aberto).
3. Vai ser algo como `https://SEU-N8N.com/webhook/gerar-texto`.

## 4. Colar no Mapa da Proteção

1. Entre no Mapa → **Ajustes → Acesso e Integrações**.
2. Ache o cartão **"IA · textos do estudo"**.
3. Cole a URL no campo, clique em **"Testar"** (deve responder "✓ Respondeu ..." — mas repare:
   o teste manda um payload de mentira `{tipo:"teste",...}`, então a Claude provavelmente vai
   devolver um texto que não bate no formato esperado — o importante nesse teste é só confirmar
   que o n8n respondeu 200, não que o texto saiu perfeito).
4. Clique em **"Salvar"**.
5. Ligue a chave **"IA · textos do estudo"** (toggle ao lado do nome do cartão).

## 5. Teste de verdade

1. Abra um estudo em aberto no Mapa (Painel → Estudos → qualquer um) e vá até a etapa
   "Resultado".
2. Clique em **"Gerar textos"**.
3. Se aparecer o "Resumo para o cliente" e a "Análise interna" preenchidos, funcionou.
4. Se der erro, me manda a mensagem — geralmente é a credencial não estar selecionada no node,
   ou o workflow não estar "Active".
