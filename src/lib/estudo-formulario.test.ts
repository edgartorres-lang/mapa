import { describe, expect, it } from "vitest";
import { paraEstudoFormulario, ESTUDO_VAZIO } from "./estudo-formulario";

/**
 * Bug real (2026-09-03): um cliente de teste antigo tinha `Estudo.dados` gravado como `{}`
 * (seed da Etapa 1, nunca passou por `criarEstudoNovo`/`enviarLead`). Abrir esse estudo — e,
 * pior, duplicar o Mapa gerado a partir dele — quebrava `calc()` com "Cannot read properties of
 * undefined (reading 'clt')", porque `d.vinculos` vinha `undefined`. `paraEstudoFormulario` é a
 * rede de segurança: qualquer leitura de `Estudo.dados` do banco deve passar por aqui.
 */
describe("paraEstudoFormulario", () => {
  it("preenche tudo com o padrão quando dados é {}", () => {
    const d = paraEstudoFormulario({});
    expect(d.vinculos).toEqual(ESTUDO_VAZIO.vinculos);
    expect(d.edu).toEqual(ESTUDO_VAZIO.edu);
    expect(d.anexos).toEqual(ESTUDO_VAZIO.anexos);
    expect(d.nome).toBe("");
  });

  it("preenche tudo com o padrão quando dados é null/undefined", () => {
    expect(paraEstudoFormulario(null)).toEqual(ESTUDO_VAZIO);
    expect(paraEstudoFormulario(undefined)).toEqual(ESTUDO_VAZIO);
  });

  it("preserva campos presentes e só completa os que faltam, inclusive dentro de vinculos", () => {
    const d = paraEstudoFormulario({
      nome: "Teste",
      vinculos: { clt: { on: true, renda: 5000 } }, // servidor/autonomo faltando de propósito
    });
    expect(d.nome).toBe("Teste");
    expect(d.vinculos.clt).toEqual({ on: true, renda: 5000 });
    expect(d.vinculos.servidor).toEqual(ESTUDO_VAZIO.vinculos.servidor);
    expect(d.vinculos.autonomo).toEqual(ESTUDO_VAZIO.vinculos.autonomo);
  });

  it("um EstudoFormulario já completo passa intacto", () => {
    expect(paraEstudoFormulario(ESTUDO_VAZIO)).toEqual(ESTUDO_VAZIO);
  });
});
