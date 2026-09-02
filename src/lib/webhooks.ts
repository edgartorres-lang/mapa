/**
 * Chamada aos webhooks do n8n. Nunca fala direto com Google Agenda, WhatsApp, e-mail ou IA — só
 * dispara `POST` pra URL configurada pelo corretor (Corretor.webhookLead/Agendar/Notificar/...).
 * Nenhum webhook recebe valor de cobertura (README, seção "Webhooks do n8n"), exceto
 * `gerar-texto`, que ainda não está conectado (Etapa 5 não mexe em IA).
 *
 * Best-effort: se a URL não estiver configurada (nenhuma tela de Ajustes/Integrações grava isso
 * ainda — ver AGENTS.md) ou o n8n estiver fora do ar, o disparo falha em silêncio, logado no
 * console. Uma reunião marcada não pode depender de um webhook estar de pé.
 */
export async function dispararWebhook(url: string | null | undefined, payload: Record<string, unknown>): Promise<void> {
  if (!url) {
    console.log("[webhook] não configurado — payload que seria enviado:", payload);
    return;
  }
  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!resposta.ok) {
      console.warn(`[webhook] ${url} respondeu ${resposta.status}`);
    }
  } catch (erro) {
    console.warn(`[webhook] falha ao chamar ${url}:`, erro);
  }
}
