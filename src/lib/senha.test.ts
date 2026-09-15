import { describe, expect, it } from "vitest";
import { hashSenha, verificarSenha } from "./senha";

describe("hashSenha / verificarSenha", () => {
  it("a senha certa bate com o hash gerado", async () => {
    const hash = await hashSenha("segredo-forte-123");
    expect(await verificarSenha("segredo-forte-123", hash)).toBe(true);
  });

  it("senha errada não bate", async () => {
    const hash = await hashSenha("segredo-forte-123");
    expect(await verificarSenha("outra-coisa", hash)).toBe(false);
  });

  it("a mesma senha gera hashes diferentes (salt aleatório)", async () => {
    const a = await hashSenha("mesma-senha");
    const b = await hashSenha("mesma-senha");
    expect(a).not.toBe(b);
    expect(await verificarSenha("mesma-senha", a)).toBe(true);
    expect(await verificarSenha("mesma-senha", b)).toBe(true);
  });

  it("hash em formato inesperado (ex.: o placeholder do seed) não bate com nada, sem lançar erro", async () => {
    expect(await verificarSenha("qualquer-coisa", "sem-senha-ainda")).toBe(false);
  });
});
