"use client";

const ID_ESTILO = "regra-pagina-impressao";

/**
 * Troca a regra @page antes de imprimir — mesmo princípio do protótipo (`imprimir(modo)` em
 * Mapa da Proteção 1a+1b - Unificado.dc.html, ~linha 1075). Usado tanto pela barra de saída
 * (apresentação/proposta) quanto pelo botão "Baixar A4" do compositor de e-mail, que precisa
 * funcionar mesmo sem o usuário ter passado pela tela da proposta antes.
 */
export function imprimirComo(modo: "slides" | "a4") {
  let estilo = document.getElementById(ID_ESTILO) as HTMLStyleElement | null;
  if (!estilo) {
    estilo = document.createElement("style");
    estilo.id = ID_ESTILO;
    document.head.appendChild(estilo);
  }
  estilo.textContent = modo === "slides" ? "@page{size:A4 landscape;margin:0}" : "@page{size:A4 portrait;margin:0}";
  window.print();
}
