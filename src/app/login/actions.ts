"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verificarSenha } from "@/lib/senha";
import { criarSessaoCookie } from "@/lib/sessao-cookie";

export async function entrar(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const redirectPara = String(formData.get("redirect") ?? "") || "/painel/dashboard";

  const paginaErro = (motivo: string) => {
    const url = new URL("/login", "http://local");
    url.searchParams.set("erro", motivo);
    if (redirectPara !== "/painel/dashboard") url.searchParams.set("redirect", redirectPara);
    return `${url.pathname}${url.search}`;
  };

  if (!email || !senha) redirect(paginaErro("1"));

  const corretor = await prisma.corretor.findUnique({ where: { email } });
  // Mensagem genérica em ambos os casos (e-mail não existe / senha errada) — não dá pra alguém
  // testando adivinhar se um e-mail está cadastrado só pela mensagem de erro.
  if (!corretor || !(await verificarSenha(senha, corretor.senhaHash))) {
    redirect(paginaErro("1"));
  }

  await criarSessaoCookie(corretor.id);
  redirect(redirectPara);
}
