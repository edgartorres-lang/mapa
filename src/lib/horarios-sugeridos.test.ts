import { describe, expect, it } from "vitest";
import { avancarDias, calcularDataHorario } from "./horarios-sugeridos";

/**
 * "Pular fim de semana" (Ajustes → Horários sugeridos, Etapa 6): se a data calculada cair em
 * sábado ou domingo, empurra pra segunda-feira seguinte, no mesmo horário. Referência:
 * quinta 2026-09-03 é dia da semana 4 (quinta) — dias relativos a partir dela cobrem os dois
 * casos de fim de semana e um caso que não muda nada.
 */
describe("calcularDataHorario — pularFimDeSemana", () => {
  const QUINTA = new Date(2026, 8, 3); // quinta-feira, 03/09/2026

  it("sem o flag, nunca empurra — mesmo caindo em fim de semana", () => {
    // quinta + 3 dias = domingo
    const d = calcularDataHorario({ diaRelativo: "em_tres_dias", hora: "15:00" }, QUINTA, false);
    expect(d.getDay()).toBe(0); // domingo, sem ajuste
  });

  it("empurra sábado para a segunda seguinte, mesma hora", () => {
    // quinta + 2 dias = sábado
    const d = calcularDataHorario({ diaRelativo: "depois_de_amanha", hora: "09:00" }, QUINTA, true);
    expect(d.getDay()).toBe(1); // segunda
    expect(d.getDate()).toBe(7); // 07/09/2026
    expect(d.getHours()).toBe(9);
  });

  it("empurra domingo para a segunda seguinte, mesma hora", () => {
    // quinta + 3 dias = domingo
    const d = calcularDataHorario({ diaRelativo: "em_tres_dias", hora: "16:00" }, QUINTA, true);
    expect(d.getDay()).toBe(1); // segunda
    expect(d.getDate()).toBe(7); // 07/09/2026
    expect(d.getHours()).toBe(16);
  });

  it("não mexe quando a data já cai em dia útil", () => {
    // quinta + 1 dia = sexta
    const d = calcularDataHorario({ diaRelativo: "amanha", hora: "15:00" }, QUINTA, true);
    expect(d.getDay()).toBe(5); // sexta, sem ajuste
    expect(d.getDate()).toBe(4);
  });
});

/**
 * `avancarDias` gera os candidatos extras da checagem de agenda (Ajustes → Acesso e
 * Integrações, "Aceitar horário já ocupado" desligado) — empurra um horário já calculado pra
 * frente, mesma hora, reaplicando o pulo de fim de semana no resultado (não só na data base).
 */
describe("avancarDias", () => {
  const QUINTA = new Date(2026, 8, 3); // quinta-feira, 03/09/2026
  const base = calcularDataHorario({ diaRelativo: "amanha", hora: "15:00" }, QUINTA, false); // sexta 04/09

  it("offset 0 devolve a mesma data", () => {
    const d = avancarDias(base, 0, true);
    expect(d.getTime()).toBe(base.getTime());
  });

  it("empurra N dias mantendo a hora, sem pular fim de semana", () => {
    const d = avancarDias(base, 2, false); // sexta + 2 = domingo
    expect(d.getDay()).toBe(0);
    expect(d.getHours()).toBe(15);
  });

  it("reaplica o pulo de fim de semana no resultado, não só na base", () => {
    const d = avancarDias(base, 2, true); // sexta + 2 = domingo → empurra pra segunda
    expect(d.getDay()).toBe(1);
    expect(d.getDate()).toBe(7); // 07/09/2026
    expect(d.getHours()).toBe(15);
  });
});
