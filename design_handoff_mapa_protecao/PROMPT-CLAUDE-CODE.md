# Prompt para o Claude Code

Cole tudo abaixo da linha na primeira mensagem, com o terminal aberto na pasta descompactada.

---

Estou construindo o **Mapa da Proteção**, uma ferramenta de estudo de seguro de vida para o meu
trabalho como corretor. Sou corretor único da Setor Norte Seguros, no Amapá. Todo o produto é em
português do Brasil.

Nesta pasta estão os arquivos de design que preparei. Leia, nesta ordem, antes de escrever qualquer
linha de código:

1. `README.md` — descreve as 20 telas, os design tokens, o racional do cálculo em fórmulas e o que
   está fora do escopo.
2. `ESPECIFICACAO.md` — glossário obrigatório, racional e decisões de produto.
3. `Mapa da Proteção 1a+1b - Unificado.dc.html` — o protótipo do estudo. O método `calc()` da classe
   de lógica é a **fonte da verdade das fórmulas**. Leia o código; não reescreva de memória.

Os arquivos `.dc.html` são **protótipos de referência em HTML**, não código de produção. A tarefa é
recriar esses designs em uma aplicação real. Eles abrem no navegador se o `support.js` estiver na
mesma pasta — use isso para conferir comportamento sempre que tiver dúvida.

## Onde vai rodar

- VPS com EasyPanel.
- **n8n orquestra todas as integrações.** O front-end só chama webhooks; nunca fala direto com
  Google Agenda, WhatsApp, e-mail ou IA, e nunca guarda credencial de terceiro.
- Evolution API para WhatsApp, Google Agenda para os agendamentos, IA via n8n para os textos
  "Resumo para você" e "Análise interna".

Não escolha stack ainda. Primeiro me proponha duas opções, com prós e contras para uma VPS com
EasyPanel e um usuário só, e me diga qual você recomenda e por quê.

## O que não pode ser negociado

**O vocabulário.** Está no glossário do `ESPECIFICACAO.md`. Use esses termos em nomes de tabela,
campo, componente, rota e texto de interface. Foram definidos com cuidado e evitam ambiguidade nas
nossas conversas.

**A distinção entre estudo e mapa.** *Estudo* está em aberto, aceita alteração e recalcula com os
fatores atuais. *Mapa da Proteção* é o estudo gerado: travado, valores congelados, não mudam nem se
eu alterar os fatores depois. Depois de gerar, o único caminho de correção é **duplicar o estudo** —
e os mapas anteriores continuam visíveis na página do cliente. Não deve existir botão de editar um
mapa gerado em lugar nenhum.

**Excluir mapa ≠ excluir cliente.** Excluir mapa apaga o mapa e o estudo que o gerou, mantendo o
cadastro. Excluir cliente (pedido LGPD) apaga tudo e deixa só o registro do pedido com data. Se o
cliente ficar sem nenhum estudo, ele sai do funil e passa a ser só um contato na lista.

**A limpeza dos 120 dias nunca é automática.** Um job diário marca os mapas sem movimento no CRM,
o dashboard avisa, e a exclusão só acontece com a minha autorização explícita. Cliente fechado não
entra na contagem. Qualquer movimento no CRM zera o contador.

**O lead não recebe PDF.** O formulário público termina com uma reunião agendada. Nenhum valor de
cobertura aparece para ele antes da nossa conversa. Eu envio o PDF depois, se quiser.

**A análise interna nunca sai da minha tela.** É o texto com argumentos de venda gerado pela IA.
Não entra no PDF nem no e-mail, em nenhuma circunstância.

**`corretor_id` em estudo, cliente e mapa desde o primeiro dia.** Hoje sou só eu, mas quero abrir a
ferramenta para outros corretores depois, e não quero migrar dados por causa disso.

## Ordem de trabalho

Não faça tudo de uma vez. Uma etapa por vez, me mostrando o resultado antes de seguir.

**Etapa 1 — Fundação.** Stack escolhida, modelo de dados, e o motor de cálculo portado do `calc()`
com testes automatizados. Os testes precisam conferir contra o caso da Marina, que está no
`README.md`: dois filhos de 14 e 11 anos, R$ 2.000/mês por filho no fundamental, e o resultado deve
dar **despesa de educação de R$ 4.920/mês** e **custo educacional total de R$ 759.360**. Se der
outro número, o port está errado. Não avance com teste vermelho.

**Etapa 2 — Estudo.** As cinco etapas de preenchimento, autosave, e as três saídas
(apresentação 16:9, proposta A4 de três páginas, e-mail de 600px), todas imprimindo corretamente.

**Etapa 3 — Painel.** Dashboard, funil, lista de clientes, página do cliente com histórico de mapas.

**Etapa 4 — Ciclo do estudo.** Gerar, duplicar, excluir, memória de cálculo.

**Etapa 5 — Captação.** Link público, formulário do lead, agendamento, avisos. Aqui entram os
webhooks do n8n — me diga exatamente quais eu preciso criar e qual payload cada um recebe.

**Etapa 6 — Ajustes.** Fatores de cálculo, horários sugeridos, LGPD e retenção, acesso e senha.

## Como quero trabalhar

- Fidelidade visual alta: as cores, a tipografia e os espaçamentos do `README.md` são para seguir.
  Fraunces nos títulos, Inter na interface, e nenhuma sombra em nenhum lugar — a separação é por
  borda de 1px.
- Explique decisões técnicas em português claro. Não sou desenvolvedor; se algo for um risco,
  me diga em que situação isso me morde.
- Quando uma escolha depender de como eu trabalho, pergunte em vez de assumir.
- Se algo no design não fizer sentido técnico ou de produto, aponte antes de implementar. Prefiro
  discutir a descobrir depois.

Comece lendo os arquivos e me apresentando: as duas opções de stack com a sua recomendação, o
modelo de dados proposto, e o que você achou ambíguo ou faltando na especificação.
