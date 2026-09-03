import { describe, expect, it } from "vitest";
import { calcularDataHorario } from "./horarios-sugeridos";

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
