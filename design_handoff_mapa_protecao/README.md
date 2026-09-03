# Handoff: Mapa da Proteção

Ferramenta de estudo de seguro de vida para corretor, com CRM, captação por link público
e três formatos de saída. Português do Brasil. Corretor: Setor Norte Seguros (Amapá, Brasil).

## Overview

O corretor recebe leads por um link público único (tráfego pago), preenche ou revisa um estudo
de necessidades de seguro de vida, gera um "Mapa da Proteção" travado e o apresenta em reunião.
O lead **nunca recebe PDF pelo formulário** — ele termina agendando uma reunião. O corretor envia
os documentos depois, se quiser.

Escopo desta V1: um corretor. A estrutura de dados já prevê vários (cada estudo nasce com dono).

## About the Design Files

Os arquivos `.dc.html` deste pacote são **referências de design criadas em HTML** — protótipos que
mostram aparência e comportamento pretendidos. **Não são código de produção para copiar.**

A tarefa é **recriar estes designs no ambiente do codebase de destino**, usando os padrões e as
bibliotecas já estabelecidos ali. Se o projeto ainda não existe, escolha a stack e implemente.
A stack pretendida pelo cliente está em "Infraestrutura pretendida", abaixo.

Cada arquivo `.dc.html` é um documento único com template + uma classe de lógica. Para abrir no
navegador, mantenha o `support.js` na mesma pasta. A lógica de cálculo dentro deles é **a fonte da
verdade do racional** — vale portar as fórmulas lendo o código, não reescrevendo de memória.

## Fidelity

**Alta fidelidade (hifi).** Cores, tipografia, espaçamentos e estados finais. Recrie a UI
fielmente usando as bibliotecas do codebase. O cálculo é real e funciona nos protótipos.

Exceções, propositalmente marcadas como placeholder nos arquivos:
- Logo, foto do corretor e QR code aparecem como caixas tracejadas com rótulo.
- Ícones: o design usa quase nenhum. Onde há glifo (`✓`, `✕`, `←`, `↻`), troque pelo set de
  ícones do codebase, no mesmo tamanho.
- Sem biblioteca de gráficos: todas as barras são `div`s com largura percentual. Mantenha assim.

---

## Infraestrutura pretendida

- VPS com EasyPanel.
- **n8n orquestra todas as integrações.** O front-end só chama webhooks; não fale com
  Google Agenda, WhatsApp, e-mail ou IA diretamente.
- Evolution API para WhatsApp.
- Google Agenda para os agendamentos.
- IA (via n8n) para os textos "Resumo para o cliente" e "Análise interna".

Consequência de arquitetura: toda integração é `POST` para um webhook do n8n e leitura posterior
de status. O front-end nunca guarda credencial de terceiro.

---

## Vocabulário obrigatório

Está em `ESPECIFICACAO.md` (glossário completo) e em `Glossário.dc.html` (versão navegável).
**Use estes termos em nomes de tabela, campo, componente, rota e texto de UI.** Eles foram
definidos com o cliente e evitam ambiguidade.

Os quatro que mais afetam o código:

| Termo | Significado |
|---|---|
| **Estudo** | Em aberto. Aceita alteração e **recalcula com os fatores atuais**. |
| **Mapa da Proteção** | O estudo gerado. **Travado**: valores congelados, não mudam nem se os fatores mudarem. |
| **Duplicar estudo** | Único caminho de correção depois de gerar. Cria estudo novo; o mapa anterior continua visível. |
| **Capital a proteger** | Necessidade total menos as receitas liquidáveis. É o número que a proposta apresenta. |

Distinção crítica: **excluir mapa** ≠ **excluir cliente**. Excluir mapa apaga o mapa e o estudo que
o gerou, mantendo o cadastro. Excluir cliente (pedido LGPD) apaga tudo, deixando só o registro do
pedido com data.

---

## Racional do cálculo

Fonte da verdade: método `calc()` em `Mapa da Proteção 1a+1b - Unificado.dc.html`.
Reproduzido aqui em prosa para conferência.

### Fatores de risco por vínculo

Incidem sobre a renda **de cada vínculo separadamente**, nunca sobre o total.

| Vínculo | Fator de renda | Fator de pensão | Invalidez aplicável |
|---|---|---|---|
| CLT | 1,00 | 1,00 | sim |
| Servidor público | 1,00 | 0,60 | não (RPPS já cobre) |
| Autônomo, liberal, empresário | 1,25 | 1,00 | sim |

```
renda_equivalente = Σ (renda_do_vínculo × fator_do_vínculo)
fator_pensao      = Σ (renda_do_vínculo × fator_pensao_do_vínculo) ÷ Σ renda_do_vínculo
```

### Renda familiar e participação

```
renda_familiar = renda_segurado + renda_conjuge (se incluída) + rendas_permanentes_de_terceiros (as marcadas)
participacao   = renda_segurado ÷ renda_familiar
```

Rendas permanentes de terceiros (aluguéis, dividendos) **não são seguráveis**: permanecem após o
falecimento. Entram na renda familiar e reduzem a necessidade via participação — nunca como
abatimento de capital.

### Cobertura vitalícia

```
vitalicia = patrimonio_total × (pct_custo_transmissao / 100) + renda_mensal_segurado × meses_vitalicia
```
Padrões: `pct_custo_transmissao = 15`, `meses_vitalicia = 12`.
Todo o patrimônio entra, liquidável ou não.

### Cobertura temporária

```
temp_bruta      = renda_equivalente × participacao × prazo_manutencao_anos × 12
receitas_liq    = patrimonio_liquidavel + fgts + inss + previdencia_privada + seguro_atual
temp_liquida    = max(0, temp_bruta − receitas_liq)
teto            = renda_mensal × 12 × multiplicador_teto
manutencao      = min(temp_liquida, teto)          // se cortou, a UI avisa
temporaria      = manutencao + Σ objetivos_incluidos
```
Padrões: `prazo_manutencao_anos = 5`, `multiplicador_teto = 8`.
Sem dependentes financeiros, `manutencao = 0` e a temporária é só os objetivos.

### Capital em seguro de vida

```
capital_vida = vitalicia + temporaria
```

### Custo educacional

Fases, por **idade em anos completos** do dependente:

| Fase | Faixa |
|---|---|
| Pré-escola | 1 a 5 |
| Fundamental | 6 a 14 |
| Médio | 15 a 17 |
| Superior | 18 a 22 |
| Pós-graduação | 23 a 24 |

O valor informado por fase é **o custo mensal de UM filho**. Para cada filho, para cada fase ainda
não vencida:

```
anos_restantes_na_fase = fase.idade_final − max(idade_do_filho, fase.idade_inicial) + 1
custo_do_filho        += valor_mensal_da_fase × 12 × anos_restantes_na_fase
```

Despesas extras de estudo (inglês, esporte, intercâmbio), cada uma com prazo próprio de
**1 a 10 anos ou indeterminado**:

```
anos = prazo_escolhido > 0 ? prazo_escolhido : (25 − idade_do_filho_mais_novo)
total_da_despesa = valor_mensal × 12 × anos
```

```
custo_educacional_total = Σ custo_por_filho + Σ total_das_despesas_extras
```

Conferência obrigatória (caso da Marina, usado em todos os protótipos): dois filhos de 14 e 11 anos,
R$ 2.000/mês por filho no fundamental, R$ 2.500 médio, R$ 3.200 superior, extras de R$ 600 (3 anos)
e R$ 320 (indeterminado). Resultado: **despesa de hoje R$ 4.920/mês** (2.000 + 2.000 + 920) e
**custo educacional total R$ 759.360**. Se o seu port der outro número, o bug é seu.

### Pensão de educação

```
pensao_mensal = custo_educacional_total × fator_pensao × participacao ÷ (prazo_pensao_anos × 12)
```
`prazo_pensao_anos` ∈ {1, 5, 10, 15, 20}, padrão 15. A UI sugere o valor mais próximo de
`25 − idade_do_filho_mais_novo`.

Também exiba a média sem diluição: `custo_educacional_total ÷ (anos_até_25 × 12)`.

### Invalidez e complementares

```
invalidez_acidente      = renda_mensal × 12 × anos_invalidez            // anos_invalidez = 5
invalidez_doenca        = invalidez_acidente × 0,50
renda_vitalicia_invalidez = renda_mensal × 0,50                          // zero se servidor
dit                     = renda_mensal × 0,70                            // por mês
doencas_graves          = renda_mensal × 12 × 1,5
```

### Capital a proteger

```
necessidade_morte = vitalicia + temporaria + custo_educacional_total
capital_a_proteger = necessidade_morte − receitas_liquidaveis
```
Se negativo, a UI troca o rótulo para "Capital excedente" e exibe o valor absoluto.

### Fatores editáveis

Todos os padrões acima vivem em Ajustes → Fatores de cálculo, por corretor. Ao salvar:
**estudos em aberto recalculam; mapas gerados não mudam.** A tela informa quantos estudos serão
afetados antes de confirmar.

---

## Telas

### 1. Painel do Corretor — `Painel do Corretor.dc.html`

Barra lateral fixa de 216px, `#0F3D63`, com seis itens (Dashboard, Funil, Clientes, Estudos,
Link de captação, Ajustes), cada um com badge de contagem. Botão "+ Novo estudo" em `#39CC00`
no rodapé, acima do cartão do corretor.

**Dashboard.** Saudação em Fraunces 27px. Grid de 4 KPIs (leads do mês, capital no funil,
fechados, parados 120+ dias). Painel de aviso `#FCF3D9`/`#EEDCA6` listando mapas sem movimento há
mais de 120 dias, cada linha com "Retomar contato" e "Excluir mapa" — **o botão de excluir abre
confirmação; nunca exclui direto**. Abaixo, grid 1.35fr/1fr: "Precisa de você hoje" (fila ordenada
por dias parados, com bolinha de estágio, ação sugerida e capital) e, à direita, funil em barras
horizontais + cartão do link de captação com 3 estatísticas.

**Funil.** Grid de 6 colunas iguais, fundo `#EDF2F7`, radius 12px. Cabeçalho da coluna: bolinha
de 8px na cor do estágio, nome, contagem, soma de capital. Cartões brancos com borda esquerda de
3px na cor do estágio: nome, profissão, capital, dias parados. Coluna vazia mostra um bloco
tracejado com texto explicando o que entra ali. Barra de métricas no rodapé.

**Clientes.** Busca por nome, profissão ou telefone. Filtros em pílula: Todos, os 6 estágios,
"Fora do funil", "Parados 120+ dias". Tabela de 5 colunas
(`1.7fr 1.1fr 1fr 1fr 0.9fr`): cliente + subtítulo, badge de estágio, contagem de mapas, capital
alinhado à direita, último movimento. Linha inteira clicável.

**Página do cliente.** Cabeçalho branco com avatar circular de 54px (inicial em Fraunces 19px
sobre `#E7F0FA`), nome, badge de estágio, subtítulo com profissão/idade/estado civil/filhos, linha
de contatos, e dois botões: "Duplicar estudo" (contorno) e "Abrir mapa atual" (`#1B72BE`).
Três abas: Resumo, Comparar mapas, Anotações.
- *Resumo*: grid 1.4fr/1fr. Esquerda: lista de mapas gerados — o atual com borda `#C8EFB7` e fundo
  `#F8FEF5` e badge verde "atual", os anteriores em branco com badge cinza "anterior"; cada um com
  ações Abrir / Apresentação / Proposta / Duplicar e, à direita, "Excluir mapa" em `#C4570B`.
  Abaixo, histórico em duas colunas (data 52px + texto). Direita: estágio no funil com 5 passos
  clicáveis, e o cadastro em pares rótulo/valor.
- *Comparar mapas*: tabela antes/depois/variação percentual, verde para aumento, laranja para queda.
  Com menos de dois mapas, mostra a explicação em vez da tabela.
- *Anotações*: entradas com borda esquerda verde de 3px, mais um campo de texto. **Nunca entram em
  PDF nem e-mail.**

Modal de exclusão: separa em dois blocos o que vai embora (`#FDF1E7`) e o que fica (`#EAFBE3`).

### 2. Ciclo do Estudo — `Ciclo do Estudo.dc.html`

Cinco etapas em barra lateral de 250px. Documenta a máquina de estados do estudo.

1. **Estudo em aberto.** Barra `#E7F0FA` com badge "Estudo em aberto", nome, horário do autosave,
   e dois botões distintos: "Salvar" (contorno) e "Gerar Mapa da Proteção" (`#0F3D63` sólido).
   Quatro números em cartões. Aviso `#FCF3D9` explicando que recalcula com os fatores atuais.
   Bloco "Revisão antes de gerar": itens verdes (`✓`) e laranja (`!`) — os laranja **não bloqueiam**.
2. **Mapa gerado.** Mesma estrutura com moldura verde e badge "Mapa gerado · travado".
   **Não existe botão de editar em nenhum lugar.** Três saídas + bloco explicando que a correção
   é duplicar.
3. **Duplicar.** As três versões (v1 anterior, v2 atual, v3 em aberto) com selos de cor distintos,
   ao lado da comparação v1 → v2.
4. **Memória de cálculo.** Cinco grupos, cada um com barra vertical colorida de 6px, total à
   direita, e linhas com rótulo + fórmula em texto pequeno + valor.
5. **Excluir mapa.** Efeitos em cartões coloridos + a fila dos 120 dias com três estados:
   aguardando autorização, fora da contagem (cliente fechado), data prevista de entrada.

Três modais: gerar (lista o que trava), duplicar (o que acontece), excluir (o que sai × o que fica).

### 3. Captação e Agendamento — `Captação e Agendamento.dc.html`

Cinco telas. As do lead aparecem em moldura de celular: `#1A1A1A`, radius 34px, padding 9px,
tela interna de 390px com radius 27px.

1. **Link de captação.** Endereço único + botão Copiar. Lista de campanhas (UTM), cada uma com
   leads e taxa de agendamento. QR em cartão `#0F3D63`. Funil de 30 dias em 4 números + 4 barras.
2. **Agendar a apresentação.** Última tela do formulário. Cabeçalho `#0F3D63` com progresso 5/5.
   Três horários em cartões com radio circular; o campo aberto é um cartão **tracejado** que, ao ser
   escolhido, revela um input. Botão fica `#CBD6E1` até haver escolha, então vira `#39CC00`.
   Ao lado: tabela da regra de montagem, aviso de que horário ocupado é aceito, e o cartão do que
   vai para a agenda.
3. **Confirmação.** Círculo verde com `✓`, dia e hora, três próximos passos, cartão do corretor com
   SUSEP. Ao lado, o que o lead **não** recebe, e a variação do texto para quem não agenda.
4. **Lead repetido.** Preenchimento novo → cadastro encontrado → quatro consequências. Cartão do
   dashboard mostrando a diferença de renda informada, com "Abrir o v3" e "Comparar com o v2".
5. **Aviso de lead novo.** Moldura de WhatsApp (fundo `#E5DDD5`), duas mensagens em cartões brancos
   com radius 10px e canto superior esquerdo de 3px. Tabela de gatilhos e o fluxo
   formulário → webhook → n8n → integrações → dashboard.

### 4. Ajustes — `Ajustes.dc.html`

Quatro abas em barra lateral de 250px.

1. **Fatores de cálculo.** Grid 1.35fr/1fr. Esquerda: cinco grupos de campos (vitalícia,
   temporária, educação, fatores por vínculo, invalidez e complementares); cada linha é
   `1fr 116px` com rótulo + nota e input de 62px centralizado + unidade. Campo alterado ganha
   borda `#1B72BE`; campo diferente do padrão mas já salvo ganha borda `#C8EFB7`. CLT e servidor
   são `disabled` em 1,00. Direita, sticky: painel `#0F3D63` com o efeito ao salvar e a contagem
   (estudos em aberto recalculam / mapas gerados intactos), botões Restaurar e "Salvar e
   recalcular"; abaixo, a simulação ao vivo do estudo da Marina, cada linha com valor novo,
   valor anterior e variação percentual.
2. **Horários sugeridos.** Três slots, cada um com dia relativo (amanhã / depois de amanhã / em
   três dias), hora e duração. Três chaves: oferecer campo aberto, aceitar horário ocupado,
   pular fim de semana. Prévia ao vivo do que o lead vê.
3. **LGPD e retenção.** Tabela de consentimentos (nome, origem, data, status: aceito / verbal /
   pendente). Comparação lado a lado entre excluir mapa (`#FDF1E7`) e excluir cliente (borda preta).
   Campo de dias de retenção + quatro regras. Estado das seções da política de privacidade.
4. **Acesso e senha.** Os três passos da recuperação como cartões de 340px lado a lado, mais as
   regras de acesso.

### 5. Acesso e Identidade — `Acesso e Identidade.dc.html`

Seis telas em barra lateral de 250px.

1. **Login.** Card de 920px dividido: painel esquerdo de 410px em `#0F3D63` com dois círculos
   decorativos (`rgba(57,204,0,.13)` e `rgba(27,114,190,.35)`), logo claro no topo e título em
   Fraunces 30px; direita em branco com e-mail, senha, "Esqueci a senha", checkbox de sessão
   persistente, botão `#1B72BE`, divisor "ou" e "Criar uma conta" em contorno. Ao lado, os quatro
   estados de erro documentados (senha errada com mensagem única, bloqueio após 5 tentativas,
   sessão expirada com retorno à tela de origem, botão em "Entrando…").
2. **Criar conta.** Card de 520px: nome, corretora, SUSEP, e-mail, senha — cada campo com nota
   dizendo onde aquele dado aparece nos documentos. Aceite dos termos obrigatório; o botão fica
   `#CBD6E1` até ser marcado.
3. **Primeiro acesso.** Três passos (marca, contato, fatores) com stepper horizontal. Grid
   1.1fr/1fr: passos à esquerda, prévia em miniatura da proposta A4 à direita, com "Fazer isso
   depois" sempre disponível.
4. **Perfil.** Foto circular de 88px tracejada, sete campos (o último ocupa duas colunas), e o
   cartão de contato da apresentação em coluna sticky **atualizando ao vivo** conforme digita.
   Botão de salvar só ativa quando há mudança.
5. **Marca e logo.** Dois slots de upload lado a lado — um em fundo branco (logo escuro), um em
   `#0F3D63` (logo claro). Quatro opções de cor de destaque em swatches de 64px com anel de
   seleção. Tabela dos cinco lugares onde a marca entra, com a versão usada em cada um, e prévia
   da capa da apresentação refletindo a cor escolhida.
6. **Integrações.** Quatro cartões (Google Agenda, WhatsApp/Evolution, e-mail, IA), cada um com
   toggle de 42×23px, campo de URL do webhook e nota do que o n8n faz naquele fluxo. Ao lado, o
   painel `#0F3D63` explicando a arquitetura e a **lista dos cinco webhooks a criar no n8n**, com
   o payload de cada um.

### 6. Estudo — `Mapa da Proteção 1a+1b - Unificado.dc.html`

O protótipo funcional, com dois modos alternáveis no cabeçalho:
- **Etapas**: barra lateral com andamento, pendências por etapa, Voltar/Continuar.
- **Abas**: cabeçalho escuro com abas + painel direito de pendências clicáveis.

Cinco etapas: Perfil, Dependentes e objetivos, Custos e patrimônio, Contato e consentimento,
Resultado. Bloqueio do resultado exige: nome, nascimento, profissão, um vínculo com renda, um
dependente (se marcado que tem), contato e consentimento LGPD.

O resultado contém as três saídas em tamanho real e imprimíveis:
- **Apresentação**: 6 slides de 960×540 (equivalem a 1920×1080). `@page { size: A4 landscape }`.
- **Proposta**: 3 páginas de 794×1123 (A4 a 96dpi). `@page { size: A4 portrait }`.
- **E-mail**: corpo de 600px + compositor com destinatário, assunto e o que incluir.

Também: "Resumo para o cliente" (texto do cliente, entra na proposta) e "Análise interna"
(argumentos de venda, fundo `#FCF3D9`) — **a análise interna nunca sai da tela do corretor**.

### 7. Celular do Corretor — `Celular do Corretor.dc.html`

Quatro telas em 390px, todas dentro de moldura de aparelho. **Não é um app separado**: é a mesma
aplicação em viewport estreito, no mesmo banco e no mesmo estudo. Começar no celular e terminar no
computador é o caso comum.

1. **Dashboard.** Cabeçalho `#0F3D63` com saudação e **três** indicadores (não quatro — capital no
   funil fica no desktop). Aviso dos 120 dias como **só leitura**, mandando resolver no computador.
   Fila "precisa de você hoje" com botão de WhatsApp verde em cada linha. Barra inferior de quatro
   abas: Hoje, Clientes, Estudos, Mais. O funil em colunas não existe aqui — vira lista dentro de
   Clientes.
2. **Modo conversa.** O estudo quebrado em 16 telas, uma pergunta por tela. Barra de progresso de
   4px, seta de voltar no topo, "Pular para o resultado" no rodapé. Três tipos de resposta: texto
   (input de 17px), opções (cartões de 52px com checkbox de 20px) e dinheiro (valor grande em
   Fraunces 30px + três atalhos de faixa + "Digitar"). Nota de contexto em `#FCF3D9` mostrando o
   efeito da resposta, para o corretor conferir em voz alta. Rótulo "Salvo" no rodapé.
3. **Resultado.** Capital sugerido em Fraunces 34px sobre marinho, quatro coberturas em cartão com
   borda esquerda colorida, e "já protegido" como barra de proporção. Rodapé com "Apresentar" e
   "Enviar". **Sem botão de gerar o mapa.**
4. **Cliente.** Avatar de 46px, WhatsApp / Ligar / Nota em botões de 46px logo abaixo do nome, mapa
   atual em moldura verde, versões anteriores em cinza, histórico como lista curta de três entradas.

**Regras do celular:** alvo de toque nunca abaixo de 46px (botão principal 54px); uma coluna
sempre; ação principal em rodapé fixo; **nenhuma tabela com rolagem horizontal**.

**O que o celular não faz**, por decisão de produto: gerar o Mapa da Proteção, imprimir a proposta,
editar fatores de cálculo e autorizar exclusões. São ações definitivas — pedem tela grande.

### 8. Página do lead — `Link do Cliente - Protótipo.dc.html`

Formulário público, mobile, uma pergunta por tela, 12 a 16 perguntas. Começa pelo nome e passa a
tratar a pessoa pelo nome. Botão voltar em toda parte. Termina em contato + LGPD + agendamento.

---

## Interações e comportamento

- **Autosave** no estudo: grava a cada alteração, rótulo "Salvo automaticamente · HH:MM".
  No protótipo é `localStorage`; em produção, `PATCH` no servidor com debounce.
- **Gerar Mapa da Proteção**: modal listando os valores que serão congelados → grava snapshot →
  o estudo fica somente-leitura para sempre.
- **Duplicar**: copia todas as respostas para um estudo novo em aberto; o mapa anterior permanece.
- **Excluir mapa**: modal com "o que vai embora" e "o que fica". Se era o único estudo do cliente,
  ele sai do funil e vira contato na lista.
- **Fila dos 120 dias**: job diário às 8h marca clientes sem movimento no CRM. Só o dashboard avisa
  (nunca WhatsApp). Cliente fechado é ignorado. **Exclusão só com autorização explícita**, e ela é
  **por cliente**: leva todos os mapas e estudos dele, mantendo o cadastro — a confirmação informa
  quantos são. Excluir um mapa isolado existe, mas só pela página do cliente.
  Conta como movimento qualquer `evento_historico`: nota, mudança de estágio, mapa gerado, e-mail ou
  WhatsApp enviado, novo preenchimento do link. Abrir a página **não** conta.
- **Agendamento**: ver a seção "Agendamento" abaixo. `Captação e Agendamento.dc.html` é a fonte da
  verdade da regra dos horários.
- **Lead repetido**: telefone OU e-mail iguais reaproveitam o cadastro e abrem estudo novo.
  Sem confirmação de telefone por código (risco de dado falso aceito de propósito).
- **Impressão**: a apresentação imprime em A4 deitado, a proposta em A4 em pé. O elemento troca a
  regra `@page` antes de chamar `window.print()`. Cadeia de containers com `display: contents` e
  `.noprint { display: none }`.

Sem animações além de transições de cor em hover. Nada pulsa, nada desliza.

## Agendamento

Três horários fixos, calculados a partir da data do preenchimento:

1. **Opção 1** — tarde de **amanhã**
2. **Opção 2** — manhã de **depois de amanhã**
3. **Opção 3** — tarde de **depois de amanhã**

Dois dos três caem no mesmo dia, de propósito: cobre quem só fala cedo e quem só fala à tarde.
Mais um campo aberto onde o lead escreve o dia e a hora que preferir.

Qualquer escolha, inclusive a do campo aberto, vai direto para o Google Agenda; a confirmação o
corretor faz com o cliente. **Não consulta a agenda antes** — horário ocupado é aceito e o corretor
remarca. O evento leva **apenas nome e contato**, nunca valores do estudo.

As três opções são configuráveis em Ajustes → Horários sugeridos: dia relativo (amanhã / depois de
amanhã / em três dias), hora e duração.

## Estado

Estudo: `{ perfil, vinculos[], conjuge, terceiros[], dependentes[], educacao{fases}, extras[],
prazos, teto, objetivos[], bens[], reservas, contato, consentimento }`.
Derivados nunca são persistidos — recalculam a cada render enquanto o estudo está em aberto.

Mapa: snapshot congelado de todos os derivados + os fatores usados na geração + data/hora.

## Design tokens

| Uso | Valor |
|---|---|
| Marinho (primário, cabeçalhos, texto de destaque) | `#0F3D63` |
| Azul (ações, links) | `#1B72BE` |
| Verde (confirmação, sucesso, travado) | `#39CC00` |
| Verde escuro (texto sobre fundo verde claro) | `#2f8a12` |
| Fundo da aplicação | `#F3F6FA` |
| Fundo alternativo de bloco | `#EDF2F7` / `#F7FAFD` |
| Borda | `#DEE7EF` |
| Borda de campo em foco / alterado | `#1B72BE` |
| Texto principal | `#1A1A1A` |
| Texto secundário | `#5B6B7A` |
| Texto terciário, rótulos | `#8FA0AF` |
| Cinza de contorno inativo | `#CBD6E1` |
| Alerta (texto) | `#C4570B` |
| Alerta (fundo / borda) | `#FDF1E7` / `#F0CBA8` |
| Nota (texto) | `#8a6a00` |
| Nota (fundo / borda) | `#FCF3D9` / `#EEDCA6` |
| Sucesso (fundo / borda) | `#EAFBE3` / `#C8EFB7` |
| Azul claro (fundo / borda) | `#E7F0FA` / `#C9E0F5` |
| Amarelo de estágio "cotando" | `#D9A400` |

Cores dos estágios do funil: lead `#8FA0AF`, estudo `#1B72BE`, apresentado `#0F3D63`,
cotando `#D9A400`, fechado `#39CC00`, perdido `#C4570B`.

**Tipografia.** Títulos em **Fraunces** (500/600/700); interface em **Inter** (400/500/600/700).
Escala usada: 9px e 9,5px para rótulos em caixa alta com `letter-spacing: .08–.11em`;
10,5–12px para texto secundário; 12,5–13,5px para corpo e labels; 14–16px para títulos de bloco;
19–27px Fraunces para títulos de tela; 34–82px Fraunces nos slides.
Números monetários sempre em Inter 600/700.

**Espaçamento.** Padding de cartão 20–24px. Gap de grid 10–16px. Padding de página 26–32px.
Raio: 8–9px em campos e cartões pequenos, 11–12px em cartões, 14px em modais, 999px em botões.
Sem sombras em nenhum lugar — a separação é por borda de 1px ou 1,5px.

**Moeda.** `R$ 1.284.000` (pt-BR, sem centavos). Formato curto em cartões: `R$ 1,28 mi`,
`R$ 720 mil`.

## Assets

Nenhum binário. Logo, foto e QR são placeholders tracejados a serem substituídos pela marca real.
Fontes via Google Fonts (Fraunces, Inter).

## Files

| Arquivo | Conteúdo |
|---|---|
| `ESPECIFICACAO.md` | Glossário, racional e decisões de produto. **Leia primeiro.** |
| `Mapa da Proteção 1a+1b - Unificado.dc.html` | Estudo completo + cálculo + 3 saídas. Fonte da verdade das fórmulas. |
| `Painel do Corretor.dc.html` | Dashboard, funil, clientes, página do cliente. |
| `Ciclo do Estudo.dc.html` | Salvar, gerar, duplicar, excluir, memória de cálculo. |
| `Captação e Agendamento.dc.html` | Link público, agendar, confirmação, lead repetido, avisos. |
| `Ajustes.dc.html` | Fatores de cálculo, horários, LGPD, acesso. |
| `Acesso e Identidade.dc.html` | Login, criar conta, primeiro acesso, perfil, marca, integrações. |
| `Celular do Corretor.dc.html` | Dashboard, modo conversa, resultado e página do cliente em 390px. |
| `Link do Cliente - Protótipo.dc.html` | Formulário público do lead. |
| `Glossário.dc.html` | Glossário navegável, com pares que se confundem. |
| `Mapa do site - Escopo.dc.html` | 35 telas mapeadas; 27 marcadas para a V1. |
| `support.js` | Runtime dos arquivos `.dc.html`. Necessário só para abrir no navegador. |

## Fora do escopo da V1

- **Cotação por seguradora** (prêmios lado a lado). Decidido ficar para depois; o estágio "cotando"
  já existe no funil, mas não há tela.
- Multi-corretor: convite, permissões, marca por corretor, cobrança. **Ainda assim, modele
  `corretor_id` em estudo, cliente e mapa desde o início** — foi decisão explícita do cliente.
- Tarefas e follow-up com data.
- Origem das campanhas como relatório próprio.
- Modelos de mensagem editáveis.

## Webhooks do n8n

A lista completa está na tela de Integrações (`Acesso e Identidade.dc.html`, tela 6). Resumo:

| Rota | Quando dispara | Payload |
|---|---|---|
| `POST /webhook/lead` | Lead termina o formulário público | nome, telefone, e-mail, campanha |
| `POST /webhook/agendar` | Lead escolhe horário ou propõe um | nome, contato, data, hora, duração |
| `POST /webhook/notificar` | Lead novo, horário escolhido, lead repetido | tipo, nome, profissão, origem |
| `POST /webhook/gerar-texto` | Corretor pede os textos do estudo | números do estudo, perfil, dependentes |
| `POST /webhook/enviar-mapa` | Corretor confirma o envio do e-mail | destinatário, assunto, corpo, anexos |
| `POST /webhook/esquecer` | Corretor registra pedido de exclusão LGPD | id opaco, eventos futuros a cancelar |

**Nenhum webhook recebe valor de cobertura**, com uma exceção justificada: `gerar-texto` precisa dos
números para escrever o resumo. O evento da agenda leva apenas nome e contato.

## Decisões fechadas depois da primeira leitura

Sete pontos que o desenvolvedor levantou como ambíguos, já respondidos pelo cliente:

1. **Serviço de PDF na VPS: aprovado.** Chromium headless em container próprio, chamado pelo n8n.
   Obrigatório porque "E-mail do mapa" é tela da V1 e precisa do anexo real. O PDF sai da **mesma
   marcação da tela** — não mantenha um segundo layout em paralelo. Nome do arquivo:
   `Mapa_de_Protecao_<Nome_do_Cliente>.pdf`. Se atrasar a Etapa 2, o botão "Baixar A4" do corretor
   usa a impressão do navegador na V1 e o serviço entra na Etapa 5.
2. **Quatro fases de educação no formulário do lead: intencional.** Pós-graduação é minoritária e não
   vale uma pergunta a mais num formulário de 16. No estudo do corretor a fase existe, aparece vazia
   e é preenchível. Se houver filho de 18 a 22 anos, a tela de resultado destaca a fase de pós em
   branco como pendência **opcional**.
3. **Limpeza dos 120 dias: por cliente, leva o histórico inteiro.** É o que faz a regra "sem estudo,
   sai do funil" fechar. A confirmação precisa dizer quantos mapas e estudos vão junto. Excluir um
   mapa isolado continua existindo, mas só pela página do cliente, por ação do corretor.
4. **Movimento no CRM: qualquer `evento_historico`.** Nota, mudança de estágio, mapa gerado, e-mail
   ou WhatsApp enviado, novo preenchimento do link. Abrir a página não conta.
5. **Horários: o protótipo é a fonte da verdade.** Tarde de amanhã, manhã de depois de amanhã, tarde
   de depois de amanhã. Dois no mesmo dia é de propósito. Ver a seção "Agendamento".
6. **Exclusão LGPD:** apaga a linha do cliente inteira. O registro que fica tem quatro campos —
   data do pedido, canal (WhatsApp / e-mail / verbal), `corretor_id`, id opaco. Sem nome, telefone
   ou e-mail. Dispare `POST /webhook/esquecer` para cancelar **eventos futuros** na agenda.
   Histórico de WhatsApp na Evolution e eventos passados ficam **fora da V1** — declare essa
   limitação na política de privacidade em vez de prometer o que o sistema não faz.
7. **Textos da IA travam com o mapa.** "Resumo para o cliente" e "Análise interna" ficam gravados no
   snapshot. Com o estudo em aberto, regenerar à vontade. Depois de gerar, o texto é aquele — mesmo
   motivo dos números. Exceção: a análise interna pode ganhar um botão de regenerar que grava o
   resultado como **anotação nova**, sem tocar no mapa.

## Onde começar

1. Ler `ESPECIFICACAO.md`.
2. Abrir `Mapa da Proteção 1a+1b - Unificado.dc.html` no navegador e preencher com
   "Preencher exemplo". Ler o método `calc()`. Portar as fórmulas e escrever testes contra os
   números da Marina citados acima.
3. Modelar o banco com a distinção estudo em aberto × mapa travado.
4. Construir o estudo, depois o painel, depois a captação, depois Ajustes.
