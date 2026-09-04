/**
 * Chamada aos webhooks do n8n. Nunca fala direto com Google Agenda, WhatsApp, e-mail ou IA — só
 * dispara `POST` pra URL configurada pelo corretor (Corretor.webhookLead/Agendar/Notificar/
 * EnviarMapa/GerarTexto/Esquecer — tela em Ajustes → Acesso e Integrações). Nenhum webhook
 * recebe valor de cobertura (README, seção "Webhooks do n8n"), exceto `gerar-texto` (precisa dos
 * números pra escrever o resumo — a resposta nunca sai da tela do corretor, só os parágrafos que
 * viram "Resumo para o cliente"/"Análise interna").
 *
 * Best-effort: se a URL não estiver configurada ou o n8n estiver fora do ar, o disparo falha em
 * silêncio, logado no console. Uma reunião marcada não pode depender de um webhook estar de pé.
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

/**
 * Igual a `dispararWebhook`, mas devolve o corpo da resposta (JSON) em vez de só logar — usado
 * só por `gerar-texto`, o único webhook cuja resposta o app de fato lê (os outros são só
 * notificação, "dispare e esqueça"). `null` em qualquer falha (sem URL, timeout, resposta não-OK,
 * corpo que não é JSON) — quem chama decide o que mostrar ao corretor.
 */
export async function dispararWebhookComResposta<T = unknown>(url: string | null | undefined, payload: Record<string, unknown>, timeoutMs = 15000): Promise<{ ok: true; dados: T } | { ok: false; erro: string }> {
  if (!url) return { ok: false, erro: "Webhook não configurado. Configure a URL em Ajustes → Acesso e Integrações." };
  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!resposta.ok) return { ok: false, erro: `O webhook respondeu ${resposta.status}.` };
    const dados = (await resposta.json()) as T;
    return { ok: true, dados };
  } catch (erro) {
    console.warn(`[webhook] falha ao chamar ${url}:`, erro);
    return { ok: false, erro: "Não consegui falar com o webhook — confira a URL e se o n8n está no ar." };
  }
}

/**
 * Botão "Testar" da tela de Integrações — um POST de verdade, com payload de teste reconhecível,
 * só pra confirmar que a URL responde. Nunca lança erro: o botão sempre recebe um resultado pra
 * mostrar (✓/✗), nunca trava a tela — mesmo espírito best-effort dos outros webhooks.
 */
export async function testarWebhook(url: string): Promise<{ sucesso: boolean; detalhe: string }> {
  if (!url.trim()) return { sucesso: false, detalhe: "Informe uma URL antes de testar." };
  try {
    const inicio = Date.now();
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "teste", origem: "Mapa da Proteção · Ajustes → Integrações", quando: new Date().toISOString() }),
      signal: AbortSignal.timeout(8000),
    });
    const ms = Date.now() - inicio;
    if (!resposta.ok) return { sucesso: false, detalhe: `Respondeu ${resposta.status} em ${ms}ms.` };
    return { sucesso: true, detalhe: `Respondeu ${resposta.status} em ${ms}ms.` };
  } catch {
    return { sucesso: false, detalhe: "Não respondeu — confira a URL e se o n8n está no ar." };
  }
}
