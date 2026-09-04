import { afterEach, describe, expect, it, vi } from "vitest";
import type { HorarioSugerido } from "@prisma/client";
import { resolverHorariosDisponiveis } from "./disponibilidade-agenda";

/**
 * Checagem real de agenda (Ajustes → Acesso e Integrações, "Google Agenda · disponibilidade") —
 * ver a doc no topo de disponibilidade-agenda.ts pras decisões do Edgar. Mocka `fetch` global em
 * vez de bater num n8n de verdade — mesma ideia do resto do app (webhooks são best-effort, sem
 * infra externa nos testes).
 */
function horario(ordem: number, diaRelativo: string, hora: string): HorarioSugerido {
  return { id: `h${ordem}`, corretorId: "c1", ordem, diaRelativo, hora, duracaoMin: 60 };
}

const QUINTA = new Date(2026, 8, 3); // quinta-feira, 03/09/2026
const HORARIOS = [horario(0, "amanha", "15:00"), horario(1, "depois_de_amanha", "09:00"), horario(2, "depois_de_amanha", "15:00")];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolverHorariosDisponiveis", () => {
  it("aceitaHorarioOcupado ligado (padrão) — não chama o webhook, devolve os horários como sempre", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const r = await resolverHorariosDisponiveis({ aceitaHorarioOcupado: true, integracaoAgendaAtiva: true, webhookChecarAgenda: "https://x/checar" }, HORARIOS, false, QUINTA);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(r).toHaveLength(3);
    expect(r.map((s) => s.ordem)).toEqual([0, 1, 2]);
  });

  it("sem webhookChecarAgenda configurado — mesmo com o toggle desligado, não checa", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const r = await resolverHorariosDisponiveis({ aceitaHorarioOcupado: false, integracaoAgendaAtiva: true, webhookChecarAgenda: null }, HORARIOS, false, QUINTA);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(r).toHaveLength(3);
  });

  it("todos livres — devolve os 3 horários originais (tentativa 0)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string) as { candidatos: { id: string }[] };
        const livres = body.candidatos.filter((c) => c.id.endsWith("-0")).map((c) => c.id);
        return new Response(JSON.stringify({ livres }), { status: 200 });
      }),
    );

    const r = await resolverHorariosDisponiveis({ aceitaHorarioOcupado: false, integracaoAgendaAtiva: true, webhookChecarAgenda: "https://x/checar" }, HORARIOS, false, QUINTA);

    expect(r).toEqual([
      { ordem: 0, dataHoraISO: calcularEsperado(0) },
      { ordem: 1, dataHoraISO: calcularEsperado(1) },
      { ordem: 2, dataHoraISO: calcularEsperado(2) },
    ]);

    function calcularEsperado(ordem: number) {
      const h = HORARIOS[ordem];
      const dias = h.diaRelativo === "amanha" ? 1 : 2;
      const [hora, min] = h.hora.split(":").map(Number);
      return new Date(QUINTA.getFullYear(), QUINTA.getMonth(), QUINTA.getDate() + dias, hora, min).toISOString();
    }
  });

  it("horário ocupado (tentativa 0 indisponível) — troca por um dia depois automaticamente", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string) as { candidatos: { id: string }[] };
        // a posição 0 só está livre na tentativa 1 (+1 dia); as outras, na tentativa 0.
        const livres = body.candidatos.filter((c) => (c.id.startsWith("0-") ? c.id === "0-1" : c.id.endsWith("-0"))).map((c) => c.id);
        return new Response(JSON.stringify({ livres }), { status: 200 });
      }),
    );

    const r = await resolverHorariosDisponiveis({ aceitaHorarioOcupado: false, integracaoAgendaAtiva: true, webhookChecarAgenda: "https://x/checar" }, HORARIOS, false, QUINTA);

    expect(r).toHaveLength(3);
    const slot0 = r.find((s) => s.ordem === 0)!;
    // amanhã (04/09) + 1 dia de tentativa = 05/09, mesma hora 15:00
    expect(new Date(slot0.dataHoraISO).getDate()).toBe(5);
    expect(new Date(slot0.dataHoraISO).getHours()).toBe(15);
  });

  it("nenhuma tentativa livre pra uma posição — some da lista, sem travar as outras", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string) as { candidatos: { id: string }[] };
        // posição 1 nunca está livre; as outras, na tentativa 0.
        const livres = body.candidatos.filter((c) => !c.id.startsWith("1-") && c.id.endsWith("-0")).map((c) => c.id);
        return new Response(JSON.stringify({ livres }), { status: 200 });
      }),
    );

    const r = await resolverHorariosDisponiveis({ aceitaHorarioOcupado: false, integracaoAgendaAtiva: true, webhookChecarAgenda: "https://x/checar" }, HORARIOS, false, QUINTA);

    expect(r.map((s) => s.ordem)).toEqual([0, 2]);
  });

  it("webhook falha (erro de rede) — cai de volta pros horários sem checar, não trava o lead", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("falha de rede");
      }),
    );

    const r = await resolverHorariosDisponiveis({ aceitaHorarioOcupado: false, integracaoAgendaAtiva: true, webhookChecarAgenda: "https://x/checar" }, HORARIOS, false, QUINTA);

    expect(r).toHaveLength(3);
  });

  it("webhook responde formato inesperado — mesmo fallback best-effort", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ algumaOutraCoisa: true }), { status: 200 })),
    );

    const r = await resolverHorariosDisponiveis({ aceitaHorarioOcupado: false, integracaoAgendaAtiva: true, webhookChecarAgenda: "https://x/checar" }, HORARIOS, false, QUINTA);

    expect(r).toHaveLength(3);
  });
});
