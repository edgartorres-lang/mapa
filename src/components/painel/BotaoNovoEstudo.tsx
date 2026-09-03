"use client";

import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { criarEstudoNovo, abrirOuCriarEstudoDoCliente } from "@/app/estudo/actions";

/**
 * Botão "+ Novo estudo" do menu lateral. Bug real reportado pelo Edgar: clicar aqui enquanto
 * olhava a página de um cliente criava um cliente novo em branco, sem relação nenhuma com quem
 * estava na tela. A rota `/painel/clientes/[id]` é a única pista de "qual cliente" que o menu
 * lateral (Server Component, sem acesso à URL da página) tem disponível — por isso este botão
 * precisa ser Client Component, só pra ler o pathname com `usePathname()`.
 *
 * Fora da página de um cliente (dashboard, funil, lista de clientes, etc.), continua criando um
 * cliente novo em branco — comportamento de sempre.
 */
export function BotaoNovoEstudo() {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const clienteId = /^\/painel\/clientes\/([^/]+)$/.exec(pathname ?? "")?.[1] ?? null;

  function clicar() {
    startTransition(async () => {
      if (clienteId) await abrirOuCriarEstudoDoCliente(clienteId);
      else await criarEstudoNovo();
    });
  }

  return (
    <button
      type="button"
      onClick={clicar}
      disabled={pending}
      style={{ width: "100%", font: "700 12.5px var(--font-interface)", color: "#fff", background: "var(--verde)", border: "none", padding: "11px", borderRadius: 999, cursor: pending ? "default" : "pointer", marginBottom: 14 }}
    >
      {pending ? "Abrindo…" : "+ Novo estudo"}
    </button>
  );
}
