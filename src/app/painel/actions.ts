"use server";

import { redirect } from "next/navigation";
import { apagarSessaoCookie } from "@/lib/sessao-cookie";

/** Botão "Sair" da sidebar. Stateless (ver sessao.ts) — apaga só o cookie deste aparelho. */
export async function sair() {
  await apagarSessaoCookie();
  redirect("/login");
}
