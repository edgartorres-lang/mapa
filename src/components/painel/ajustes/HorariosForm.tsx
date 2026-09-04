"use client";

import { useState } from "react";
import { calcularDataHorario, formatarDiaHorario } from "@/lib/horarios-sugeridos";
import { salvarHorariosSugeridos, salvarPreferenciasAgendamento } from "@/app/painel/ajustes/actions";

interface Slot {
  ordem: number;
  diaRelativo: string;
  hora: string;
  duracaoMin: number;
}

const DIAS = [
  { valor: "amanha", rotulo: "amanhã" },
  { valor: "depois_de_amanha", rotulo: "depois de amanhã" },
  { valor: "em_tres_dias", rotulo: "em três dias" },
];
const DURACOES = [30, 45, 60];

export function HorariosForm({
  slotsIniciais,
  ofereceCampoAbertoInicial,
  aceitaHorarioOcupadoInicial,
  pulaFimDeSemanaInicial,
}: {
  slotsIniciais: Slot[];
  ofereceCampoAbertoInicial: boolean;
  aceitaHorarioOcupadoInicial: boolean;
  pulaFimDeSemanaInicial: boolean;
}) {
  const [slots, setSlots] = useState(slotsIniciais);
  const [ofereceCampoAberto, setOfereceCampoAberto] = useState(ofereceCampoAbertoInicial);
  const [aceitaHorarioOcupado, setAceitaHorarioOcupado] = useState(aceitaHorarioOcupadoInicial);
  const [pulaFimDeSemana, setPulaFimDeSemana] = useState(pulaFimDeSemanaInicial);
  const [salvandoSlots, setSalvandoSlots] = useState(false);
  const [salvo, setSalvo] = useState(false);

  function mudarSlot(i: number, campo: keyof Slot, valor: string | number) {
    setSlots((s) => s.map((sl, idx) => (idx === i ? { ...sl, [campo]: valor } : sl)));
    setSalvo(false);
  }

  async function salvarTudo() {
    setSalvandoSlots(true);
    try {
      await Promise.all([
        salvarHorariosSugeridos(slots),
        salvarPreferenciasAgendamento({ ofereceCampoAberto, aceitaHorarioOcupado, pulaFimDeSemana }),
      ]);
      setSalvo(true);
    } finally {
      setSalvandoSlots(false);
    }
  }

  async function alternarPreferencia(campo: "ofereceCampoAberto" | "aceitaHorarioOcupado" | "pulaFimDeSemana") {
    const novo = {
      ofereceCampoAberto: campo === "ofereceCampoAberto" ? !ofereceCampoAberto : ofereceCampoAberto,
      aceitaHorarioOcupado: campo === "aceitaHorarioOcupado" ? !aceitaHorarioOcupado : aceitaHorarioOcupado,
      pulaFimDeSemana: campo === "pulaFimDeSemana" ? !pulaFimDeSemana : pulaFimDeSemana,
    };
    setOfereceCampoAberto(novo.ofereceCampoAberto);
    setAceitaHorarioOcupado(novo.aceitaHorarioOcupado);
    setPulaFimDeSemana(novo.pulaFimDeSemana);
    await salvarPreferenciasAgendamento(novo);
  }

  const previa = slots.map((s) => formatarDiaHorario(calcularDataHorario(s, new Date(), pulaFimDeSemana)));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 16, alignItems: "start" }}>
      <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "22px 24px" }}>
        <div style={{ font: "600 16px var(--font-titulo)", color: "var(--marinho)", marginBottom: 3 }}>As três opções fixas</div>
        <div style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 16 }}>
          Cada opção é um turno relativo ao dia em que o lead preenche, mais a hora. A regra não muda de lead para lead.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {slots.map((sl, i) => (
            <div key={sl.ordem} style={{ border: "1.5px solid var(--borda)", borderRadius: 11, padding: "15px 17px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ font: "700 11px var(--font-interface)", color: "var(--marinho)" }}>Opção {i + 1}</div>
                <div style={{ font: "600 11px var(--font-interface)", color: "var(--azul)" }}>
                  {previa[i].dia.split(",")[0]} · {sl.hora}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(120px,1fr) 88px 88px", gap: 10, alignItems: "end" }}>
                <div>
                  <div style={{ font: "500 10.5px var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 4 }}>Dia</div>
                  <select
                    value={sl.diaRelativo}
                    onChange={(e) => mudarSlot(i, "diaRelativo", e.target.value)}
                    style={{ width: "100%", padding: "9px 10px", border: "1.5px solid var(--borda)", borderRadius: 8, font: "500 12px var(--font-interface)", color: "var(--texto)", background: "#fbfdff", boxSizing: "border-box" }}
                  >
                    {DIAS.map((d) => (
                      <option key={d.valor} value={d.valor}>{d.rotulo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ font: "500 10.5px var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 4 }}>Hora</div>
                  <input
                    type="text"
                    value={sl.hora}
                    onChange={(e) => mudarSlot(i, "hora", e.target.value)}
                    style={{ width: "100%", padding: "9px 10px", border: "1.5px solid var(--borda)", borderRadius: 8, font: "700 12.5px var(--font-interface)", color: "var(--marinho)", background: "#fbfdff", textAlign: "center", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <div style={{ font: "500 10.5px var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 4 }}>Duração</div>
                  <select
                    value={sl.duracaoMin}
                    onChange={(e) => mudarSlot(i, "duracaoMin", parseInt(e.target.value, 10))}
                    style={{ width: "100%", padding: "9px 10px", border: "1.5px solid var(--borda)", borderRadius: 8, font: "500 12px var(--font-interface)", color: "var(--texto)", background: "#fbfdff", boxSizing: "border-box" }}
                  >
                    {DURACOES.map((d) => (
                      <option key={d} value={d}>{d === 60 ? "1 hora" : `${d} min`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={salvarTudo}
          disabled={salvandoSlots}
          style={{ marginTop: 16, width: "100%", cursor: "pointer", font: "700 12.5px var(--font-interface)", color: "#fff", background: salvo ? "var(--verde-escuro)" : "var(--marinho)", border: "none", padding: 13, borderRadius: 999 }}
        >
          {salvandoSlots ? "Salvando…" : salvo ? "✓ Salvo" : "Salvar horários"}
        </button>

        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--fundo-alt)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Toggle titulo="Oferecer o campo aberto" nota="O lead escreve o dia e a hora que preferir. Vai para a agenda como está." on={ofereceCampoAberto} onClick={() => alternarPreferencia("ofereceCampoAberto")} />
            <Toggle
              titulo="Aceitar horário já ocupado"
              nota='Ligado (padrão): sem consultar a agenda antes — você vê o conflito depois e remarca. Desligado: o app consulta o Google Agenda antes de sugerir horário ao lead (webhook "Google Agenda · disponibilidade", em Acesso e Integrações) e troca qualquer horário ocupado por outro livre automaticamente.'
              on={aceitaHorarioOcupado}
              onClick={() => alternarPreferencia("aceitaHorarioOcupado")}
            />
            <Toggle titulo="Pular fim de semana" nota="Se a próxima data cair em sábado ou domingo, empurra para segunda." on={pulaFimDeSemana} onClick={() => alternarPreferencia("pulaFimDeSemana")} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 3 }}>Como o lead vê agora</div>
          <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 14 }}>Simulando um preenchimento hoje.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {previa.map((p, i) => (
              <div key={i} style={{ border: "1.5px solid var(--borda)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto)" }}>{p.dia}</div>
                <div style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-secundario)", marginTop: 2 }}>{p.hora}</div>
              </div>
            ))}
            {ofereceCampoAberto && (
              <div style={{ border: "1.5px dashed var(--cinza-inativo)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto)" }}>Nenhum desses serve</div>
                <div style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-secundario)", marginTop: 2 }}>Digo o meu melhor dia e horário</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ background: "var(--nota-fundo)", border: "1px solid var(--nota-borda)", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--nota-texto)", marginBottom: 7 }}>Conflito não bloqueia</div>
          <div style={{ font: "400 11.5px/1.7 var(--font-interface)", color: "var(--nota-texto)" }}>
            {aceitaHorarioOcupado
              ? "A ferramenta não consulta a sua agenda antes de oferecer o horário. Se cair em cima de um compromisso, o evento entra igual e você remarca. Um lead perdido na tela custa mais que um remarcamento."
              : 'Com "Aceitar horário já ocupado" desligado, a ferramenta consulta o Google Agenda antes e troca um horário ocupado por outro automaticamente — mas a checagem só roda uma vez, quando o lead abre o link. Se ele demorar pra chegar na tela de agendar, ainda pode cair em cima de um compromisso novo; você vê e remarca do mesmo jeito.'}
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ titulo, nota, on, onClick }: { titulo: string; nota: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        gap: 11,
        alignItems: "flex-start",
        padding: "13px 15px",
        borderRadius: 9,
        background: on ? "var(--fundo-alt-2)" : "#fff",
        border: `1.5px solid ${on ? "var(--azul-claro-borda)" : "var(--borda)"}`,
      }}
    >
      <span
        style={{
          width: 17,
          height: 17,
          flex: "none",
          borderRadius: 4,
          display: "grid",
          placeItems: "center",
          fontSize: 10,
          color: "#fff",
          background: on ? "var(--azul)" : "transparent",
          border: `1.5px solid ${on ? "var(--azul)" : "var(--cinza-inativo)"}`,
          marginTop: 1,
        }}
      >
        {on ? "✓" : ""}
      </span>
      <div>
        <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--marinho)" }}>{titulo}</div>
        <div style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginTop: 2 }}>{nota}</div>
      </div>
    </button>
  );
}
