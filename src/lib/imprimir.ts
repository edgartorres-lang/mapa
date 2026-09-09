"use client";

const ID_ESTILO = "regra-pagina-impressao";

/**
 * Troca a regra @page antes de imprimir — mesmo princípio do protótipo (`imprimir(modo)` em
 * Mapa da Proteção 1a+1b - Unificado.dc.html, ~linha 1075). Usado tanto pela barra de saída
 * (apresentação/proposta) quanto pelo botão "Baixar A4" do compositor de e-mail, que precisa
 * funcionar mesmo sem o usuário ter passado pela tela da proposta antes.
 *
 * Achado real (2026-09-09): "slides" (`.slide16`, 960×540 — proporção 16:9) imprimindo numa
 * folha A4 deitada (proporção ~1,41:1, bem diferente de 16:9) sobrava um monte de margem em
 * branco embaixo/à direita, o slide ficava pequeno e desalinhado — visto de verdade num PDF
 * exportado. Corrigido usando uma folha sob medida do tamanho exato do slide ampliado (mesma
 * proporção 16:9, sem sobra nenhuma) em vez de forçar A4. O zoom de ampliação em si é aplicado
 * via CSS (`.slide16` em `@media print`, ver globals.css) — aqui só declara o tamanho da folha
 * pra bater com esse zoom (960×1,2 / 540×1,2). "a4" (proposta) não precisa de nada disso: já é
 * desenhada pixel a pixel no tamanho exato de impressão (794×1123 = A4 a 96dpi), por isso
 * continua só com o `size:A4 portrait` puro.
 */
export function imprimirComo(modo: "slides" | "a4") {
  let estilo = document.getElementById(ID_ESTILO) as HTMLStyleElement | null;
  if (!estilo) {
    estilo = document.createElement("style");
    estilo.id = ID_ESTILO;
    document.head.appendChild(estilo);
  }
  estilo.textContent = modo === "slides" ? "@page{size:1152px 648px;margin:0}" : "@page{size:A4 portrait;margin:0}";
  window.print();
}
