# Mapa da Proteção — contexto do projeto

Ferramenta de estudo de seguro de vida para corretor. Português do Brasil. Corretor: Setor Norte
Seguros (Amapá). Documentos de referência no projeto: `Glossário.dc.html`, `Mapa do site - Escopo.dc.html`,
`Notas - estrutura tecnica.md`. Protótipo funcional: `Mapa da Proteção 1a+1b - Unificado.dc.html`.

## Glossário (usar estes termos, sempre)

**Pessoas** — Corretor (usuário do sistema) · Lead (preencheu o link público) · Cliente (cadastrado, com
página e histórico) · Segurado (a renda protegida no estudo) · Dependente.

**Estados do estudo** — *Estudo*: em aberto, aceita alteração, recalcula com os fatores atuais.
*Mapa da Proteção*: o estudo gerado; travado, os valores não mudam mais nem se os fatores mudarem.
*Duplicar estudo*: único caminho depois de gerar. *Fatores de cálculo*: parâmetros do racional, em Ajustes.

**Números** — Renda equivalente (renda de cada vínculo × fator daquele vínculo, somada) · Renda familiar
(segurado + cônjuge incluído + terceiros permanentes) · Participação (renda do segurado ÷ renda familiar) ·
Cobertura vitalícia · Cobertura temporária · Pensão de educação · Custo educacional · Bem liquidável ·
Receitas liquidáveis · Capital a proteger · Teto de razoabilidade · DIT · Doenças graves.

**Saídas** — Apresentação (PDF 16:9 da reunião) · Proposta (PDF A4 de imprimir) · E-mail do mapa ·
Análise interna (IA, só na tela do corretor, nunca no PDF nem no e-mail) · Resumo para você (texto do
cliente, entra na proposta).

**Captação e CRM** — Link de captação (único, público, para tráfego pago) · Página do lead ·
Horários sugeridos · Funil (lead, estudo, apresentado, cotando, fechado, perdido) · Cotação (prêmios das
seguradoras; fora da V1).

## Racional do cálculo

- Fator de risco incide sobre a renda **de cada vínculo**, não sobre o total. CLT 1,00 · servidor 1,00 com
  fator de pensão 0,60 · autônomo/liberal/empresário 1,25.
- **Vitalícia** = patrimônio total × % de custo de transmissão (padrão 15%) + 12 meses de renda do segurado.
- **Temporária** = renda equivalente × participação × prazo de manutenção (padrão 5 anos), menos receitas
  liquidáveis, mais objetivos incluídos. Limitada pelo teto de razoabilidade (padrão 8× a renda anual).
- **Custo educacional** = por filho, por fase (pré 1–5, fundamental 6–14, médio 15–17, superior 18–22,
  pós 23–24), valor mensal **de um filho** × 12 × anos restantes até os 25, mais despesas extras de estudo
  pelo prazo de cada uma (1 a 10 anos ou indeterminado = até o mais novo completar 25).
- **Pensão de educação** = custo educacional × fator de pensão × participação ÷ (prazo da pensão × 12).
- **Invalidez** por acidente = 5 anos de renda; por doença = 50% disso; renda vitalícia por invalidez = 50%
  da renda mensal (não se aplica a servidor). **DIT** = 70% da renda mensal. **Doenças graves** = 1,5 × renda anual.
- Rendas permanentes de terceiros (aluguéis, dividendos) **não** são seguráveis: entram na renda familiar e
  reduzem a necessidade pela participação.

## Decisões de produto

- Um corretor agora; cada estudo nasce com dono para abrir a outros corretores depois.
- Fatores de cálculo editáveis em Ajustes. Estudo em aberto recalcula; mapa gerado não muda.
- Salvar = rascunho, quantas vezes quiser. Gerar Mapa da Proteção = definitivo. Informação nova depois disso
  pede duplicar o estudo; os mapas anteriores continuam visíveis na página do cliente.
- Mapa gerado pode ser excluído: apaga o mapa e o estudo que o gerou, mantendo o cadastro do cliente. Aos
  120 dias sem movimento no CRM o dashboard avisa, mas só exclui com autorização do corretor; cliente
  fechado não entra na contagem.
- O lead **não recebe PDF**: o formulário termina em reunião agendada. O corretor envia o PDF se quiser.
- Link de captação único para tráfego pago, com UTM por campanha. Lead repetido (mesmo telefone ou e-mail)
  vira nova versão do estudo, não cliente duplicado. Sem confirmação de telefone por código.
- O lead escolhe um horário sugerido; a ferramenta lança no Google Agenda apenas nome e contato. Horário
  ocupado é aceito — o corretor remarca. São 3 opções fixas (tarde de amanhã, manhã e tarde de depois de
  amanhã) mais um campo aberto para o lead propor dia e horário — qualquer escolha vai direto para a agenda,
  e a confirmação o corretor faz com o cliente.
- Todo preenchimento entra no topo do funil, agendado ou não. Cliente sem nenhum estudo fica fora do funil:
  passa a ser só um contato na lista.
- Integrações (Google Agenda, Evolution/WhatsApp, e-mail, IA) são orquestradas no n8n; o front-end chama webhooks.

## Estilo visual

Marinho #0F3D63 · azul #1B72BE · verde #39CC00 · fundo #F3F6FA · borda #DEE7EF · texto #1A1A1A e #5B6B7A ·
alerta #C4570B sobre #FDF1E7 · nota #8a6a00 sobre #FCF3D9. Títulos em Fraunces, interface em Inter.
