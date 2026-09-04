/**
 * Catálogo dos 7 webhooks do n8n — Ajustes → Acesso e Integrações. Porta de `Acesso e
 * Identidade.dc.html`, tela 6 (`INT`, ~linha 501, mais a lista de referência "Webhooks a criar no
 * n8n", ~linha 612). O protótipo só desenhava campo de URL pros 4 com toggle (agenda, WhatsApp,
 * e-mail, IA) — `lead` e `esquecer` apareciam só na lista de referência, sem input. O Edgar pediu
 * (2026-09-04) pra também terem campo de URL, só que sem toggle — eles disparam sozinhos quando o
 * evento acontece, não são "serviço que se liga e desliga". `campoAtivo: null` marca esse caso.
 * `webhookChecarAgenda` (também 2026-09-04, junto da checagem real de conflito) não vem do
 * protótipo — é campo novo, agrupado com `webhookAgendar` sob o mesmo `campoAtivo` (mesma
 * integração "Google Agenda", dois webhooks: um cria o evento, outro consulta disponibilidade).
 */

export type CampoWebhookUrl = "webhookAgendar" | "webhookChecarAgenda" | "webhookNotificar" | "webhookEnviarMapa" | "webhookGerarTexto" | "webhookLead" | "webhookEsquecer";
export type CampoIntegracaoAtiva = "integracaoAgendaAtiva" | "integracaoWhatsappAtiva" | "integracaoEmailAtiva" | "integracaoIaAtiva";

export const CAMPOS_WEBHOOK_URL: readonly CampoWebhookUrl[] = ["webhookAgendar", "webhookChecarAgenda", "webhookNotificar", "webhookEnviarMapa", "webhookGerarTexto", "webhookLead", "webhookEsquecer"];
export const CAMPOS_INTEGRACAO_ATIVA: readonly CampoIntegracaoAtiva[] = ["integracaoAgendaAtiva", "integracaoWhatsappAtiva", "integracaoEmailAtiva", "integracaoIaAtiva"];

export interface DefinicaoWebhook {
  chave: CampoWebhookUrl;
  campoAtivo: CampoIntegracaoAtiva | null;
  nome: string;
  desc: string;
  rotuloCampo: string;
  placeholder: string;
  nota: string;
  /** Pra o painel de referência "Webhooks a criar no n8n" — rota/quando/payload exatos do
   * README.md, seção "Webhooks do n8n". */
  rota: string;
  quando: string;
  payload: string;
}

export const WEBHOOKS: DefinicaoWebhook[] = [
  {
    chave: "webhookAgendar",
    campoAtivo: "integracaoAgendaAtiva",
    nome: "Google Agenda",
    desc: "Lança a reunião escolhida pelo lead, com nome e contato. Nenhum valor do estudo entra no evento.",
    rotuloCampo: "Webhook de agendamento",
    placeholder: "https://n8n.seudominio.com/webhook/agendar",
    nota: "No n8n, este fluxo autentica no Google e cria o evento no seu calendário.",
    rota: "POST /webhook/agendar",
    quando: "Lead escolhe horário ou propõe um no campo aberto.",
    payload: "nome, contato, data, hora, duração",
  },
  {
    chave: "webhookChecarAgenda",
    campoAtivo: "integracaoAgendaAtiva",
    nome: "Google Agenda · disponibilidade",
    desc: "Consulta os horários livres antes de sugerir ao lead. Só é chamado com \"Aceitar horário já ocupado\" desligado (Ajustes → Horários sugeridos).",
    rotuloCampo: "Webhook de disponibilidade",
    placeholder: "https://n8n.seudominio.com/webhook/checar-agenda",
    nota: "Recebe uma lista de horários candidatos e devolve quais estão livres no seu Google Agenda.",
    rota: "POST /webhook/checar-agenda",
    quando: 'Lead chega na tela de agendar, só se "Aceitar horário já ocupado" estiver desligado.',
    payload: "lista de candidatos (id, data, duração) → devolve os ids livres",
  },
  {
    chave: "webhookNotificar",
    campoAtivo: "integracaoWhatsappAtiva",
    nome: "WhatsApp · Evolution",
    desc: "Avisa você quando um lead termina de preencher e quando escolhe horário.",
    rotuloCampo: "Webhook de notificação",
    placeholder: "https://n8n.seudominio.com/webhook/notificar",
    nota: "A instância da Evolution fica configurada no n8n, não aqui.",
    rota: "POST /webhook/notificar",
    quando: "Lead novo, horário escolhido, lead repetido, pedido de retorno por WhatsApp.",
    payload: "tipo do evento, nome, profissão, origem",
  },
  {
    chave: "webhookEnviarMapa",
    campoAtivo: "integracaoEmailAtiva",
    nome: "E-mail do mapa",
    desc: "Envia o resumo no corpo da mensagem com a proposta em anexo, depois de você revisar.",
    rotuloCampo: "Webhook de envio",
    placeholder: "https://n8n.seudominio.com/webhook/enviar-mapa",
    nota: "Remetente e domínio verificado ficam no fluxo do n8n.",
    rota: "POST /webhook/enviar-mapa",
    quando: "Você confirma o envio do e-mail.",
    payload: "destinatário, assunto, corpo, anexos",
  },
  {
    chave: "webhookGerarTexto",
    campoAtivo: "integracaoIaAtiva",
    nome: "IA · textos do estudo",
    desc: 'Escreve o "Resumo para o cliente" e a análise interna a partir dos números já calculados.',
    rotuloCampo: "Webhook de geração de texto",
    placeholder: "https://n8n.seudominio.com/webhook/gerar-texto",
    nota: "Recebe os números do estudo e devolve os parágrafos. A análise interna nunca sai da sua tela.",
    rota: "POST /webhook/gerar-texto",
    quando: "Você clica em gerar os textos do estudo.",
    payload: "números do estudo, perfil, dependentes",
  },
  {
    chave: "webhookLead",
    campoAtivo: null,
    nome: "Lead",
    desc: "Dispara sozinho quando um lead termina o formulário público — sem chave de ligar/desligar.",
    rotuloCampo: "Webhook de lead",
    placeholder: "https://n8n.seudominio.com/webhook/lead",
    nota: "Leva nome, telefone, e-mail e campanha.",
    rota: "POST /webhook/lead",
    quando: "Lead termina o formulário público.",
    payload: "nome, telefone, e-mail, campanha",
  },
  {
    chave: "webhookEsquecer",
    campoAtivo: null,
    nome: "Esquecer (LGPD)",
    desc: "Dispara sozinho quando você registra um pedido de exclusão — sem chave de ligar/desligar.",
    rotuloCampo: "Webhook de esquecimento",
    placeholder: "https://n8n.seudominio.com/webhook/esquecer",
    nota: "Leva um id opaco e os eventos futuros da agenda a cancelar — nunca nome, telefone ou e-mail.",
    rota: "POST /webhook/esquecer",
    quando: "Você registra um pedido de exclusão LGPD.",
    payload: "id opaco, eventos futuros a cancelar",
  },
];
