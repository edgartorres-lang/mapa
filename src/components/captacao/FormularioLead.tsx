"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LEAD_VAZIO,
  PERGUNTAS_LEAD,
  RELS_LEAD,
  PRAZOS_LEAD,
  VINCULOS_LEAD,
  type LeadRespostas,
  type PerguntaLead,
} from "@/lib/lead-formulario";
import { idadeDe, mascaraData, mascaraTelefone } from "@/lib/formato";
import { formatarDiaHorario } from "@/lib/horarios-sugeridos";
import { enviarLead, confirmarAgendamento, type EscolhaAgendamento } from "@/app/captacao/actions";
import type { SlotResolvido } from "@/lib/disponibilidade-agenda";

const CHAVE_LOCAL = "mapa-captacao-v1";
const FASES_LEAD = [
  { k: "pre" as const, label: "Creche e pré-escola", faixa: "até 5 anos" },
  { k: "fund" as const, label: "Fundamental", faixa: "6 a 14 anos" },
  { k: "medio" as const, label: "Ensino médio", faixa: "15 a 17 anos" },
  { k: "sup" as const, label: "Faculdade", faixa: "18 a 22 anos" },
];

function formatarDinheiro(v: string): string {
  const d = String(v || "").replace(/\D/g, "").slice(0, 12);
  return d ? "R$ " + parseInt(d, 10).toLocaleString("pt-BR") : "";
}
function numeroDinheiro(v: string): number {
  const d = String(v || "").replace(/\D/g, "");
  return d ? parseInt(d, 10) : 0;
}

type Tela = "nome" | "welcome" | "q" | "contato" | "revisao" | "fim" | "ok";

interface CorretorPublico {
  nome: string;
  corretora: string | null;
  susep: string | null;
  whatsapp: string | null;
  ofereceCampoAberto: boolean;
  fotoUrl: string | null;
  logoClaroUrl: string | null;
}

/**
 * `slotsResolvidos` já vem checado contra a agenda de verdade (ou não, se a checagem estiver
 * desligada) — ver `resolverHorariosDisponiveis` em src/lib/disponibilidade-agenda.ts, chamado
 * no Server Component de `/captacao`. Por isso este componente só formata e exibe; não calcula
 * data nenhuma sozinho. Pode vir com menos de 3 posições (ou vazio) se algum horário sugerido não
 * achou candidato livre — `ofereceCampoAberto`/WhatsApp continuam como saída.
 */
export function FormularioLead({ corretor, slotsResolvidos, utmCampanha }: { corretor: CorretorPublico; slotsResolvidos: SlotResolvido[]; utmCampanha: string | null }) {
  const [tela, setTela] = useState<Tela>("nome");
  const [i, setI] = useState(0);
  const [a, setA] = useState<LeadRespostas>(LEAD_VAZIO);
  const [tocou, setTocou] = useState<Record<string, boolean>>({});
  const [voltarPara, setVoltarPara] = useState<"revisao" | null>(null);
  const [carregado, setCarregado] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [clienteId, setClienteId] = useState<string | null>(null);

  const [slotEscolhido, setSlotEscolhido] = useState<number | null>(null);
  const [outra, setOutra] = useState(false);
  const [outraTexto, setOutraTexto] = useState("");
  const [agendando, setAgendando] = useState(false);
  const [canalFinal, setCanalFinal] = useState<"agenda" | "sugerido" | "whatsapp" | null>(null);
  const [dataFinal, setDataFinal] = useState<string | null>(null);

  // Retoma de onde parou — mesma ideia do protótipo (localStorage), pra sobreviver a fechar a aba.
  // `localStorage` só existe no navegador: ler no inicializador do useState quebraria a
  // hidratação (o servidor nunca vê essa API). Rodar depois de montar, num efeito, é a exceção
  // reconhecida a "não faça setState num efeito" — não dá pra evitar aqui.
  /* eslint-disable react-hooks/set-state-in-effect -- carregar o que foi salvo no navegador só é
     possível depois de montar (localStorage não existe no servidor); ver comentário acima. */
  useEffect(() => {
    try {
      const bruto = localStorage.getItem(CHAVE_LOCAL);
      if (bruto) {
        const salvo = JSON.parse(bruto);
        // "ok" é estado terminal (ver efeito de salvamento abaixo) — nunca é retomado, mesmo que
        // tenha sobrado um registro assim de antes desta correção. Retomar nele mostraria uma
        // confirmação incompleta, porque canalFinal/dataFinal nunca foram persistidos.
        if (salvo.tela && salvo.tela !== "ok") {
          if (salvo.a) setA(salvo.a);
          setTela(salvo.tela);
          if (typeof salvo.i === "number") setI(salvo.i);
          if (salvo.tocou) setTocou(salvo.tocou);
        }
      }
    } catch {
      // localStorage indisponível (janela privada etc.) — segue sem retomar.
    }
    setCarregado(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!carregado) return;
    try {
      // "ok" é estado terminal — nunca salva (nem tenta retomar nele): canalFinal/dataFinal são
      // só estado local, nunca vão pro localStorage, então retomar em "ok" perderia essa parte
      // e mostraria uma confirmação incompleta. O próprio handleConfirmar já limpa o localStorage
      // ao chegar aqui — isto é só a rede de segurança pra esse efeito não escrever de novo por
      // cima (ele roda de novo a cada mudança de estado, inclusive quando tela vira "ok").
      if (tela === "ok") {
        localStorage.removeItem(CHAVE_LOCAL);
      } else {
        localStorage.setItem(CHAVE_LOCAL, JSON.stringify({ tela, i, a, tocou }));
      }
    } catch {
      // idem — se não der pra salvar, o preenchimento só não sobrevive a fechar a aba.
    }
  }, [tela, i, a, tocou, carregado]);

  const visiveis = useMemo(() => PERGUNTAS_LEAD.filter((q) => !q.cond || q.cond(a)), [a]);
  const atual = visiveis[Math.min(i, visiveis.length - 1)] ?? visiveis[0];

  function respondida(q: PerguntaLead): boolean {
    if (q.tipo === "people") return !!tocou.deps;
    if (q.tipo === "items") return (a[q.key] as { desc: string; valor: string }[]).some((x) => x.desc || x.valor) || !!tocou[q.key];
    if (q.tipo === "extras") return a.extras.some((x) => x.desc || x.valor) || !!tocou.extras;
    if (q.tipo === "group") return Object.values(a.res).some(Boolean) || !!tocou.res;
    if (q.tipo === "phases") return a.estudos.on !== null;
    if (q.tipo === "multi") return a.vinculo.length > 0;
    if (q.tipo === "fontes") return a.vinculo.every((v) => a.fontes[v]);
    if (q.tipo === "note") return true;
    return !!a[q.key];
  }

  function setCampo<K extends keyof LeadRespostas>(key: K, valor: LeadRespostas[K]) {
    setA((s) => ({ ...s, [key]: valor }));
    setTocou((t) => ({ ...t, [key]: true }));
  }

  function proxima() {
    if (voltarPara === "revisao") {
      setVoltarPara(null);
      setTela("revisao");
      return;
    }
    if (i >= visiveis.length - 1) {
      setTela("contato");
    } else {
      setI(i + 1);
    }
  }
  function voltar() {
    if (voltarPara === "revisao") {
      setVoltarPara(null);
      setTela("revisao");
      return;
    }
    if (tela === "contato") {
      setTela("q");
      setI(visiveis.length - 1);
      return;
    }
    if (i === 0) setTela("welcome");
    else setI(i - 1);
  }
  function corrigir(chave: keyof LeadRespostas) {
    const idx = Math.max(0, visiveis.findIndex((q) => q.key === chave));
    setI(idx);
    setVoltarPara("revisao");
    setTela("q");
  }

  const contatoOk = !!(a.contato.wpp || a.contato.email) && a.lgpd;

  async function handleEnviar() {
    setEnviando(true);
    try {
      const r = await enviarLead(a, utmCampanha);
      setClienteId(r.clienteId);
      setTela("fim");
    } finally {
      setEnviando(false);
    }
  }

  async function handleConfirmar(escolha: EscolhaAgendamento) {
    if (!clienteId) return;
    setAgendando(true);
    try {
      const r = await confirmarAgendamento(clienteId, escolha);
      setCanalFinal(r.canal);
      if ("dataHora" in r) setDataFinal(r.dataHora ?? null);
      setTela("ok");
      try {
        localStorage.removeItem(CHAVE_LOCAL);
      } catch {
        // sem problema não conseguir limpar — o formulário já terminou de qualquer jeito.
      }
    } finally {
      setAgendando(false);
    }
  }

  const slots = slotsResolvidos.map((s) => formatarDiaHorario(new Date(s.dataHoraISO)));

  return (
    <div style={{ minHeight: "100vh", background: "var(--fundo)", display: "flex", justifyContent: "center", fontFamily: "var(--font-interface)" }}>
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" }}>
        {tela === "nome" && (
          <TelaNome
            nome={a.nome}
            corretor={corretor}
            onNome={(v) => setCampo("nome", v)}
            onContinuar={() => setTela("welcome")}
          />
        )}

        {tela === "welcome" && (
          <TelaWelcome nome={a.nome} corretora={corretor.corretora} total={visiveis.length + 2} onVoltar={() => setTela("nome")} onContinuar={() => setTela("q")} />
        )}

        {tela === "q" && atual && (
          <TelaPergunta
            q={atual}
            a={a}
            indice={i}
            total={visiveis.length}
            respondidaAtual={respondida(atual)}
            setCampo={setCampo}
            onVoltar={voltar}
            onContinuar={proxima}
            onPular={() => {
              setTocou((t) => ({ ...t, [atual.key]: true }));
              proxima();
            }}
          />
        )}

        {tela === "contato" && (
          <TelaContato
            a={a}
            contatoOk={contatoOk}
            onWpp={(v) => setCampo("contato", { ...a.contato, wpp: mascaraTelefone(v) })}
            onEmail={(v) => setCampo("contato", { ...a.contato, email: v })}
            onLgpd={() => setCampo("lgpd", !a.lgpd)}
            onVoltar={voltar}
            onContinuar={() => contatoOk && setTela("revisao")}
          />
        )}

        {tela === "revisao" && <TelaRevisao a={a} onCorrigir={corrigir} onEnviar={handleEnviar} enviando={enviando} />}

        {tela === "fim" && (
          <TelaAgendar
            nome={a.nome}
            slots={slots}
            ofereceCampoAberto={corretor.ofereceCampoAberto}
            slotEscolhido={slotEscolhido}
            outra={outra}
            outraTexto={outraTexto}
            agendando={agendando}
            onEscolherSlot={(idx) => {
              setSlotEscolhido(idx);
              setOutra(false);
            }}
            onPedirOutra={() => {
              setOutra(true);
              setSlotEscolhido(null);
            }}
            onOutraTexto={setOutraTexto}
            onConfirmar={() => {
              if (outra && outraTexto) handleConfirmar({ tipo: "sugerido", texto: outraTexto });
              else if (!outra && slotEscolhido !== null) {
                const s = slotsResolvidos[slotEscolhido];
                if (s) handleConfirmar({ tipo: "horario", ordem: s.ordem, dataHoraISO: s.dataHoraISO });
              }
            }}
            onWhatsapp={() => handleConfirmar({ tipo: "whatsapp" })}
          />
        )}

        {tela === "ok" && (
          <TelaConfirmacao
            email={a.contato.email}
            corretor={corretor}
            canal={canalFinal}
            dataFinal={dataFinal}
            outraTexto={outraTexto}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Marca({ escuro = true }: { escuro?: boolean }) {
  return (
    <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".16em", color: escuro ? "var(--verde)" : "var(--azul)", marginBottom: 14 }}>
      Mapa da proteção
    </div>
  );
}

function TelaNome({ nome, corretor, onNome, onContinuar }: { nome: string; corretor: CorretorPublico; onNome: (v: string) => void; onContinuar: () => void }) {
  return (
    <div style={{ flex: 1, background: "var(--marinho)", padding: "36px 26px 28px", display: "flex", flexDirection: "column", color: "#fff" }}>
      {corretor.logoClaroUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL local, sem imagem remota pra otimizar
        <img src={corretor.logoClaroUrl} alt={corretor.corretora ?? corretor.nome} style={{ maxWidth: 120, maxHeight: 46, objectFit: "contain" }} />
      ) : (
        <div style={{ width: 46, height: 46, borderRadius: 11, border: "1px dashed rgba(255,255,255,.45)", display: "grid", placeItems: "center", font: "600 8px var(--font-interface)", color: "rgba(255,255,255,.6)", flex: "none" }}>
          LOGO
        </div>
      )}
      <div style={{ flex: 1, minHeight: 20 }} />
      <Marca />
      <div style={{ font: "600 30px/1.22 var(--font-titulo)", marginBottom: 12 }}>Antes de começar: como é o seu nome?</div>
      <div style={{ font: "400 13.5px/1.7 var(--font-interface)", color: "rgba(255,255,255,.72)", marginBottom: 20 }}>É o único dado que preciso agora. Telefone e e-mail ficam para o fim.</div>
      <input
        type="text"
        value={nome}
        onChange={(e) => onNome(e.target.value)}
        placeholder="Nome e sobrenome"
        style={{ width: "100%", boxSizing: "border-box", padding: 17, border: "1.5px solid rgba(255,255,255,.3)", borderRadius: 14, font: "600 17px var(--font-interface)", color: "var(--marinho)", background: "#fff", marginBottom: 14 }}
      />
      <button
        type="button"
        onClick={onContinuar}
        disabled={!nome}
        style={{ font: "700 15px var(--font-interface)", color: nome ? "var(--marinho)" : "rgba(255,255,255,.7)", background: nome ? "#fff" : "rgba(255,255,255,.35)", border: "none", padding: 17, borderRadius: 14, cursor: nome ? "pointer" : "default", width: "100%" }}
      >
        Continuar
      </button>
      <div style={{ flex: 1, minHeight: 20 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.16)" }}>
        {corretor.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL local, sem imagem remota pra otimizar
          <img src={corretor.fotoUrl} alt={corretor.nome} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flex: "none" }} />
        ) : (
          <div style={{ width: 42, height: 42, borderRadius: "50%", border: "1px dashed rgba(255,255,255,.45)", display: "grid", placeItems: "center", font: "600 7.5px var(--font-interface)", color: "rgba(255,255,255,.6)", flex: "none" }}>
            FOTO
          </div>
        )}
        <div>
          <div style={{ font: "600 13px var(--font-interface)" }}>{corretor.nome}</div>
          <div style={{ font: "400 11.5px var(--font-interface)", color: "rgba(255,255,255,.6)" }}>
            {corretor.corretora} {corretor.susep ? `· ${corretor.susep}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}

function TelaWelcome({ nome, corretora, total, onVoltar, onContinuar }: { nome: string; corretora: string | null; total: number; onVoltar: () => void; onContinuar: () => void }) {
  const saudacao = nome ? nome.split(" ")[0] : "Olá";
  return (
    <div style={{ flex: 1, background: "var(--marinho)", padding: "26px 26px 28px", display: "flex", flexDirection: "column", color: "#fff" }}>
      <button type="button" onClick={onVoltar} style={{ border: "none", background: "none", color: "rgba(255,255,255,.7)", font: "600 13px var(--font-interface)", cursor: "pointer", padding: 0, textAlign: "left", flex: "none" }}>
        ‹ Voltar
      </button>
      <div style={{ flex: 1, minHeight: 20 }} />
      <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".16em", color: "var(--verde)", marginBottom: 14 }}>{corretora}</div>
      <div style={{ font: "600 30px/1.2 var(--font-titulo)", marginBottom: 16 }}>{saudacao}, são {total} perguntas sobre a sua família.</div>
      <div style={{ font: "400 14px/1.75 var(--font-interface)", color: "rgba(255,255,255,.8)", marginBottom: 10 }}>
        Elas servem para eu preparar o seu mapa de proteção antes da nossa conversa. Leva cerca de 6 minutos e pode parar no meio — o link guarda o que você já respondeu, e você pode voltar em qualquer pergunta.
      </div>
      <div style={{ font: "400 13px/1.7 var(--font-interface)", color: "rgba(255,255,255,.58)", marginBottom: 24 }}>Nenhum valor de seguro aparece aqui. Os números eu apresento pessoalmente.</div>
      <button type="button" onClick={onContinuar} style={{ font: "700 15px var(--font-interface)", color: "var(--marinho)", background: "#fff", border: "none", padding: 17, borderRadius: 14, cursor: "pointer", width: "100%" }}>
        Começar
      </button>
      <div style={{ flex: 1, minHeight: 20 }} />
    </div>
  );
}

function TelaContato({
  a,
  contatoOk,
  onWpp,
  onEmail,
  onLgpd,
  onVoltar,
  onContinuar,
}: {
  a: LeadRespostas;
  contatoOk: boolean;
  onWpp: (v: string) => void;
  onEmail: (v: string) => void;
  onLgpd: () => void;
  onVoltar: () => void;
  onContinuar: () => void;
}) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <BarraProgresso onVoltar={onVoltar} pct={100} rotulo="quase lá" />
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 20px" }}>
        <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".12em", color: "var(--azul)", marginBottom: 10 }}>Contato</div>
        <div style={{ font: "600 24px/1.28 var(--font-titulo)", color: "var(--marinho)", marginBottom: 22 }}>Como falo com você?</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 7 }}>WhatsApp</div>
          <input
            type="text"
            value={a.contato.wpp}
            onChange={(e) => onWpp(e.target.value)}
            placeholder="(00) 00000-0000"
            style={{ width: "100%", boxSizing: "border-box", padding: 15, border: "1.5px solid var(--borda)", borderRadius: 12, font: "600 16px var(--font-interface)", color: "var(--texto)", background: "#fff" }}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 7 }}>E-mail</div>
          <input
            type="text"
            value={a.contato.email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder="nome@email.com"
            style={{ width: "100%", boxSizing: "border-box", padding: 15, border: "1.5px solid var(--borda)", borderRadius: 12, font: "600 16px var(--font-interface)", color: "var(--texto)", background: "#fff" }}
          />
        </div>
        <div
          onClick={onLgpd}
          style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "14px 16px", border: `1.5px solid ${a.lgpd ? "var(--verde)" : "var(--borda)"}`, borderRadius: 12, background: a.lgpd ? "var(--sucesso-fundo)" : "#fff" }}
        >
          <span style={{ width: 18, height: 18, flex: "none", marginTop: 1, borderRadius: 5, display: "grid", placeItems: "center", fontSize: 11, color: "#fff", background: a.lgpd ? "var(--verde)" : "transparent", border: `1.5px solid ${a.lgpd ? "var(--verde)" : "var(--cinza-inativo)"}` }}>
            {a.lgpd ? "✓" : ""}
          </span>
          <span style={{ font: "400 12.5px/1.6 var(--font-interface)", color: "var(--texto)" }}>
            Autorizo o uso dos meus dados para a elaboração deste estudo e o contato do corretor. Posso pedir a exclusão a qualquer momento.
          </span>
        </div>
      </div>
      <RodapeBotao rotulo={contatoOk ? "Continuar" : "Informe WhatsApp ou e-mail e marque a autorização"} habilitado={contatoOk} onClick={onContinuar} />
    </div>
  );
}

function BarraProgresso({ onVoltar, pct, rotulo }: { onVoltar: () => void; pct: number; rotulo: string }) {
  return (
    <div style={{ flex: "none", padding: "10px 22px 14px", display: "flex", alignItems: "center", gap: 12, background: "var(--fundo)" }}>
      <button type="button" onClick={onVoltar} style={{ border: "none", background: "none", font: "600 12.5px var(--font-interface)", color: "var(--azul)", cursor: "pointer", padding: "4px 6px 4px 0", whiteSpace: "nowrap" }}>
        ‹ Voltar
      </button>
      <div style={{ flex: 1, height: 5, borderRadius: 99, background: "var(--borda)", overflow: "hidden" }}>
        <div style={{ height: "100%", background: "var(--verde)", borderRadius: 99, width: `${pct}%` }} />
      </div>
      <span style={{ font: "600 11px var(--font-interface)", color: "var(--texto-secundario)" }}>{rotulo}</span>
    </div>
  );
}

function RodapeBotao({ rotulo, habilitado, onClick }: { rotulo: string; habilitado: boolean; onClick: () => void }) {
  return (
    <div style={{ flex: "none", padding: "10px 24px 26px" }}>
      <button
        type="button"
        onClick={onClick}
        disabled={!habilitado}
        style={{ width: "100%", font: "700 15px var(--font-interface)", color: "#fff", background: habilitado ? "var(--azul)" : "var(--cinza-inativo)", border: "none", padding: 16, borderRadius: 14, cursor: habilitado ? "pointer" : "default" }}
      >
        {rotulo}
      </button>
    </div>
  );
}

function TelaPergunta({
  q,
  a,
  indice,
  total,
  respondidaAtual,
  setCampo,
  onVoltar,
  onContinuar,
  onPular,
}: {
  q: PerguntaLead;
  a: LeadRespostas;
  indice: number;
  total: number;
  respondidaAtual: boolean;
  setCampo: <K extends keyof LeadRespostas>(key: K, valor: LeadRespostas[K]) => void;
  onVoltar: () => void;
  onContinuar: () => void;
  onPular: () => void;
}) {
  const pct = Math.round(((indice + 1) / (total + 1)) * 100);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <BarraProgresso onVoltar={onVoltar} pct={pct} rotulo={`${indice + 2}/${total + 2}`} />
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 20px" }}>
        <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".12em", color: "var(--azul)", marginBottom: 10 }}>{q.grupo}</div>
        <div style={{ font: "600 24px/1.28 var(--font-titulo)", color: "var(--marinho)", marginBottom: 10 }}>{q.label}</div>
        {q.help && <div style={{ font: "400 13px/1.65 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 22 }}>{q.help}</div>}

        <CampoPergunta q={q} a={a} setCampo={setCampo} onContinuar={onContinuar} />
      </div>
      <div style={{ flex: "none", padding: "10px 24px 26px" }}>
        <button
          type="button"
          onClick={onPular}
          style={{ width: "100%", font: "700 15px var(--font-interface)", color: "#fff", background: respondidaAtual ? "var(--azul)" : "var(--texto-terciario)", border: "none", padding: 16, borderRadius: 14, cursor: "pointer" }}
        >
          {respondidaAtual ? "Continuar" : "Pular esta pergunta"}
        </button>
      </div>
    </div>
  );
}

function CampoPergunta({
  q,
  a,
  setCampo,
  onContinuar,
}: {
  q: PerguntaLead;
  a: LeadRespostas;
  setCampo: <K extends keyof LeadRespostas>(key: K, valor: LeadRespostas[K]) => void;
  onContinuar: () => void;
}) {
  if (q.tipo === "date") {
    const idade = idadeDe(a.nasc, new Date());
    return (
      <div>
        <input
          type="text"
          value={a.nasc}
          onChange={(e) => setCampo("nasc", mascaraData(e.target.value))}
          placeholder="dd/mm/aaaa"
          style={estiloCampoGrande}
        />
        {idade !== null && <div style={{ font: "600 13px var(--font-interface)", color: "var(--verde-escuro)", marginTop: 10 }}>{Math.floor(idade)} anos</div>}
      </div>
    );
  }

  if (q.tipo === "choice") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {(q.opts || []).map((o) => {
          const sel = a[q.key] === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => {
                setCampo(q.key, o as LeadRespostas[typeof q.key]);
                setTimeout(onContinuar, 160);
              }}
              style={{ textAlign: "left", cursor: "pointer", borderRadius: 12, padding: 15, background: sel ? "var(--azul-claro-fundo)" : "#fff", border: `1.5px solid ${sel ? "var(--azul)" : "var(--borda)"}`, color: sel ? "var(--marinho)" : "var(--texto)", font: "600 14px var(--font-interface)" }}
            >
              {sel ? "✓ " : ""}
              {o}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.tipo === "multi") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {VINCULOS_LEAD.map((o) => {
          const sel = a.vinculo.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => {
                const l = a.vinculo.slice();
                const at = l.indexOf(o);
                if (at >= 0) l.splice(at, 1);
                else l.push(o);
                setCampo("vinculo", l);
              }}
              style={{ display: "flex", alignItems: "center", gap: 10, textAlign: "left", cursor: "pointer", borderRadius: 12, padding: 15, background: sel ? "var(--azul-claro-fundo)" : "#fff", border: `1.5px solid ${sel ? "var(--azul)" : "var(--borda)"}`, color: sel ? "var(--marinho)" : "var(--texto)", font: "600 14px var(--font-interface)" }}
            >
              <span style={{ width: 18, height: 18, flex: "none", borderRadius: 5, display: "grid", placeItems: "center", fontSize: 11, color: "#fff", background: sel ? "var(--azul)" : "transparent", border: `1.5px solid ${sel ? "var(--azul)" : "var(--cinza-inativo)"}` }}>{sel ? "✓" : ""}</span>
              {o}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.tipo === "money") {
    const atalhos = ["R$ 5.000", "R$ 10.000", "R$ 15.000"];
    return (
      <div>
        <input
          type="text"
          inputMode="numeric"
          value={a[q.key] as string}
          onChange={(e) => setCampo(q.key, formatarDinheiro(e.target.value) as LeadRespostas[typeof q.key])}
          placeholder="R$ 0"
          style={{ ...estiloCampoGrande, font: "700 22px var(--font-titulo)", color: "var(--marinho)" }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {atalhos.map((s) => (
            <button key={s} type="button" onClick={() => setCampo(q.key, s as LeadRespostas[typeof q.key])} style={{ font: "600 12.5px var(--font-interface)", color: "var(--marinho)", background: "#fff", border: "1.5px solid var(--borda)", padding: "9px 13px", borderRadius: 99, cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (q.tipo === "fontes") {
    const soma = a.vinculo.reduce((t, v) => t + numeroDinheiro(a.fontes[v] || ""), 0);
    const rendaNum = numeroDinheiro(a.renda);
    const vazio = soma === 0;
    const bate = soma > 0 && rendaNum > 0 && Math.abs(soma - rendaNum) <= Math.max(50, rendaNum * 0.02);
    return (
      <div style={{ background: "#fff", border: "1.5px solid var(--borda)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 15 }}>
        {a.vinculo.map((v) => (
          <div key={v}>
            <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 7 }}>{v}</div>
            <input
              type="text"
              inputMode="numeric"
              value={a.fontes[v] || ""}
              onChange={(e) => setCampo("fontes", { ...a.fontes, [v]: formatarDinheiro(e.target.value) })}
              placeholder="R$ por mês"
              style={{ width: "100%", boxSizing: "border-box", padding: 12, border: "1.5px solid var(--borda)", borderRadius: 10, font: "600 15px var(--font-interface)", color: "var(--marinho)", background: "#fbfdff" }}
            />
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 12, borderTop: "1px solid var(--borda)" }}>
          <span style={{ font: "600 12.5px var(--font-interface)", color: "var(--texto-secundario)" }}>Somando as fontes</span>
          <span style={{ font: "700 15px var(--font-interface)", color: vazio ? "var(--texto-terciario)" : bate ? "var(--verde)" : "var(--alerta-texto)" }}>{soma ? "R$ " + soma.toLocaleString("pt-BR") : "—"}</span>
        </div>
      </div>
    );
  }

  if (q.tipo === "people") {
    return (
      <div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {a.deps.map((p, idx) => {
            const idade = idadeDe(p.nasc, new Date());
            return (
              <div key={idx} style={{ border: `1.5px solid ${p.nome && idade !== null ? "var(--borda)" : "var(--alerta-borda)"}`, borderRadius: 12, padding: 14 }}>
                <input
                  type="text"
                  value={p.nome}
                  onChange={(e) => {
                    const d = a.deps.slice();
                    d[idx] = { ...d[idx], nome: e.target.value };
                    setCampo("deps", d);
                  }}
                  placeholder="Nome"
                  style={{ width: "100%", boxSizing: "border-box", padding: 11, border: "1.5px solid var(--borda)", borderRadius: 9, font: "500 14px var(--font-interface)", marginBottom: 8 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={p.nasc}
                    onChange={(e) => {
                      const d = a.deps.slice();
                      d[idx] = { ...d[idx], nasc: mascaraData(e.target.value) };
                      setCampo("deps", d);
                    }}
                    placeholder="dd/mm/aaaa"
                    style={{ flex: 1, boxSizing: "border-box", padding: 11, border: "1.5px solid var(--borda)", borderRadius: 9, font: "500 14px var(--font-interface)" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const d = a.deps.slice();
                      d[idx] = { ...d[idx], rel: RELS_LEAD[(RELS_LEAD.indexOf(d[idx].rel as (typeof RELS_LEAD)[number]) + 1) % RELS_LEAD.length] };
                      setCampo("deps", d);
                    }}
                    style={{ font: "600 12.5px var(--font-interface)", color: "var(--marinho)", background: "var(--fundo)", border: "1.5px solid var(--borda)", borderRadius: 9, padding: "0 12px", cursor: "pointer" }}
                  >
                    {p.rel}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = a.deps.slice();
                      d.splice(idx, 1);
                      setCampo("deps", d);
                    }}
                    style={{ width: 38, border: "1.5px solid var(--borda)", borderRadius: 9, color: "var(--alerta-texto)", background: "#fff", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ font: "600 11.5px var(--font-interface)", color: idade !== null ? "var(--verde-escuro)" : "var(--alerta-texto)", marginTop: 6 }}>
                  {idade !== null ? `${Math.floor(idade)} anos` : "falta a data de nascimento"}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button type="button" onClick={() => setCampo("deps", a.deps.concat([{ nome: "", nasc: "", rel: "Filho(a)" }]))} style={estiloBotaoAdicionar}>
            + adicionar pessoa
          </button>
          {a.deps.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setCampo("deps", []);
                setTimeout(onContinuar, 140);
              }}
              style={{ font: "600 13px var(--font-interface)", color: "var(--texto-secundario)", background: "none", border: "none", cursor: "pointer" }}
            >
              Ninguém depende de mim
            </button>
          )}
        </div>
      </div>
    );
  }

  if (q.tipo === "items") {
    const ehPatrimonio = q.key === "patr";
    const lista = a[q.key] as { desc: string; valor: string; liquidavel?: boolean }[];
    const phDesc = q.key === "rendas" ? "Ex: aluguel do apartamento" : "Ex: casa própria";
    const phValor = q.key === "rendas" ? "Valor por mês" : "Valor aproximado";
    return (
      <div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {lista.map((it, idx) => (
            <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={it.desc}
                  onChange={(e) => {
                    const l = lista.slice();
                    l[idx] = { ...l[idx], desc: e.target.value };
                    setCampo(q.key, l as LeadRespostas[typeof q.key]);
                  }}
                  placeholder={phDesc}
                  style={{ flex: 1, boxSizing: "border-box", padding: 12, border: "1.5px solid var(--borda)", borderRadius: 10, font: "500 14px var(--font-interface)" }}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={it.valor}
                  onChange={(e) => {
                    const l = lista.slice();
                    l[idx] = { ...l[idx], valor: formatarDinheiro(e.target.value) };
                    setCampo(q.key, l as LeadRespostas[typeof q.key]);
                  }}
                  placeholder={phValor}
                  style={{ width: 120, boxSizing: "border-box", padding: 12, border: "1.5px solid var(--borda)", borderRadius: 10, font: "600 14px var(--font-interface)", color: "var(--marinho)" }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const l = lista.slice();
                    l.splice(idx, 1);
                    setCampo(q.key, l as LeadRespostas[typeof q.key]);
                  }}
                  style={{ width: 38, border: "1.5px solid var(--borda)", borderRadius: 9, color: "var(--alerta-texto)", background: "#fff", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
              {ehPatrimonio && (
                <button
                  type="button"
                  onClick={() => {
                    const l = lista.slice();
                    l[idx] = { ...l[idx], liquidavel: !l[idx].liquidavel };
                    setCampo(q.key, l as LeadRespostas[typeof q.key]);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    alignSelf: "flex-start",
                    padding: "7px 12px",
                    borderRadius: 999,
                    cursor: "pointer",
                    border: `1.5px solid ${it.liquidavel ? "var(--verde)" : "var(--borda)"}`,
                    background: it.liquidavel ? "var(--sucesso-fundo)" : "#fff",
                  }}
                >
                  <span
                    style={{
                      width: 15,
                      height: 15,
                      flex: "none",
                      borderRadius: 4,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 9,
                      color: "#fff",
                      background: it.liquidavel ? "var(--verde)" : "transparent",
                      border: `1.5px solid ${it.liquidavel ? "var(--verde)" : "var(--cinza-inativo)"}`,
                    }}
                  >
                    {it.liquidavel ? "✓" : ""}
                  </span>
                  <span style={{ font: "500 11.5px var(--font-interface)", color: "var(--texto)" }}>Consigo vender rápido, numa emergência</span>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCampo(q.key, lista.concat([ehPatrimonio ? { desc: "", valor: "", liquidavel: false } : { desc: "", valor: "" }]) as LeadRespostas[typeof q.key])}
          style={{ ...estiloBotaoAdicionar, marginTop: 12 }}
        >
          {q.key === "rendas" ? "+ adicionar renda" : "+ adicionar item"}
        </button>
      </div>
    );
  }

  if (q.tipo === "phases") {
    return (
      <div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setCampo("estudos", { ...a.estudos, on: true })}
            style={{ flex: 1, padding: 13, borderRadius: 11, font: "600 14px var(--font-interface)", cursor: "pointer", background: a.estudos.on === true ? "var(--azul)" : "#fff", border: `1.5px solid ${a.estudos.on === true ? "var(--azul)" : "var(--borda)"}`, color: a.estudos.on === true ? "#fff" : "var(--texto-secundario)" }}
          >
            Sim
          </button>
          <button
            type="button"
            onClick={() => {
              setCampo("estudos", { ...a.estudos, on: false });
              setTimeout(onContinuar, 160);
            }}
            style={{ flex: 1, padding: 13, borderRadius: 11, font: "600 14px var(--font-interface)", cursor: "pointer", background: a.estudos.on === false ? "var(--azul)" : "#fff", border: `1.5px solid ${a.estudos.on === false ? "var(--azul)" : "var(--borda)"}`, color: a.estudos.on === false ? "#fff" : "var(--texto-secundario)" }}
          >
            Não
          </button>
        </div>
        {a.estudos.on === true && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FASES_LEAD.map((f) => (
              <div key={f.k}>
                <div style={{ font: "600 13px var(--font-interface)", color: "var(--marinho)" }}>{f.label}</div>
                <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 6 }}>{f.faixa}</div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={a.estudos[f.k]}
                  onChange={(e) => setCampo("estudos", { ...a.estudos, [f.k]: formatarDinheiro(e.target.value) })}
                  placeholder="R$ por mês, por filho"
                  style={{ width: "100%", boxSizing: "border-box", padding: 11, border: "1.5px solid var(--borda)", borderRadius: 9, font: "600 14px var(--font-interface)", color: "var(--marinho)" }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (q.tipo === "extras") {
    return (
      <div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {a.extras.map((x, idx) => (
            <div key={idx} style={{ border: "1.5px solid var(--borda)", borderRadius: 11, padding: 12 }}>
              <input
                type="text"
                value={x.desc}
                onChange={(e) => {
                  const l = a.extras.slice();
                  l[idx] = { ...l[idx], desc: e.target.value };
                  setCampo("extras", l);
                }}
                placeholder="Descrição"
                style={{ width: "100%", boxSizing: "border-box", padding: 10, border: "1.5px solid var(--borda)", borderRadius: 9, font: "500 13.5px var(--font-interface)", marginBottom: 8 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={x.valor}
                  onChange={(e) => {
                    const l = a.extras.slice();
                    l[idx] = { ...l[idx], valor: formatarDinheiro(e.target.value) };
                    setCampo("extras", l);
                  }}
                  placeholder="R$ por mês"
                  style={{ flex: 1, boxSizing: "border-box", padding: 10, border: "1.5px solid var(--borda)", borderRadius: 9, font: "600 13.5px var(--font-interface)", color: "var(--marinho)" }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const l = a.extras.slice();
                    l[idx] = { ...l[idx], prazo: PRAZOS_LEAD[(PRAZOS_LEAD.indexOf(l[idx].prazo as (typeof PRAZOS_LEAD)[number]) + 1) % PRAZOS_LEAD.length] };
                    setCampo("extras", l);
                  }}
                  style={{ font: "600 11.5px var(--font-interface)", color: "var(--marinho)", background: "var(--fundo)", border: "1.5px solid var(--borda)", borderRadius: 9, padding: "0 10px", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  {x.prazo || PRAZOS_LEAD[0]}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const l = a.extras.slice();
                    l.splice(idx, 1);
                    setCampo("extras", l);
                  }}
                  style={{ width: 38, border: "1.5px solid var(--borda)", borderRadius: 9, color: "var(--alerta-texto)", background: "#fff", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setCampo("extras", a.extras.concat([{ desc: "", valor: "", prazo: PRAZOS_LEAD[0] }]))} style={{ ...estiloBotaoAdicionar, marginTop: 12 }}>
          + adicionar despesa
        </button>
      </div>
    );
  }

  if (q.tipo === "group") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[
          { k: "fgts" as const, label: "FGTS", help: "Saldo aproximado da conta." },
          { k: "prev" as const, label: "Previdência privada", help: "Valor acumulado hoje, se houver." },
          { k: "seg" as const, label: "Seguro de vida que você já tem", help: "Capital contratado, se já houver apólice." },
        ].map((c) => (
          <div key={c.k}>
            <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 4 }}>{c.label}</div>
            <div style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 7 }}>{c.help}</div>
            <input
              type="text"
              inputMode="numeric"
              value={a.res[c.k]}
              onChange={(e) => setCampo("res", { ...a.res, [c.k]: formatarDinheiro(e.target.value) })}
              placeholder="R$"
              style={{ width: "100%", boxSizing: "border-box", padding: 12, border: "1.5px solid var(--borda)", borderRadius: 10, font: "600 14px var(--font-interface)", color: "var(--marinho)" }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (q.tipo === "note") {
    return (
      <textarea
        value={a.obs}
        onChange={(e) => setCampo("obs", e.target.value)}
        placeholder="Opcional"
        rows={4}
        style={{ width: "100%", boxSizing: "border-box", padding: 14, border: "1.5px solid var(--borda)", borderRadius: 12, font: "500 14px/1.6 var(--font-interface)", resize: "vertical" }}
      />
    );
  }

  return null;
}

const estiloCampoGrande: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: 16,
  border: "1.5px solid var(--borda)",
  borderRadius: 14,
  font: "600 17px var(--font-interface)",
  color: "var(--texto)",
  background: "#fff",
};
const estiloBotaoAdicionar: React.CSSProperties = {
  font: "700 12.5px var(--font-interface)",
  color: "var(--azul)",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
};

function TelaRevisao({ a, onCorrigir, onEnviar, enviando }: { a: LeadRespostas; onCorrigir: (chave: keyof LeadRespostas) => void; onEnviar: () => void; enviando: boolean }) {
  const linhas: { rotulo: string; valor: string; ok: boolean; chave: keyof LeadRespostas }[] = [
    { rotulo: "Nascimento", valor: a.nasc || "em branco", ok: !!a.nasc, chave: "nasc" },
    { rotulo: "Estado civil", valor: a.civil || "em branco", ok: !!a.civil, chave: "civil" },
    { rotulo: "Trabalho", valor: a.vinculo.length ? a.vinculo.join(" + ") : "em branco", ok: a.vinculo.length > 0, chave: "vinculo" },
    { rotulo: "Renda do trabalho", valor: a.renda || "em branco", ok: !!a.renda, chave: "renda" },
    { rotulo: "Dependentes", valor: a.deps.length ? a.deps.map((d) => d.nome || "sem nome").join(", ") : "nenhum", ok: true, chave: "deps" },
    { rotulo: "Escola e faculdade", valor: a.estudos.on === true ? "sim" : a.estudos.on === false ? "não pagam" : "em branco", ok: a.estudos.on !== null || a.deps.length === 0, chave: "estudos" },
    { rotulo: "Patrimônio", valor: a.patr.filter((p) => p.desc || p.valor).length ? `${a.patr.length} item(ns)` : "nenhum", ok: true, chave: "patr" },
    { rotulo: "Contato", valor: [a.contato.wpp, a.contato.email].filter(Boolean).join(" · ") || "em branco", ok: !!(a.contato.wpp || a.contato.email), chave: "contato" as keyof LeadRespostas },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "26px 24px 20px" }}>
        <div style={{ font: "600 24px/1.28 var(--font-titulo)", color: "var(--marinho)", marginBottom: 6 }}>{(a.nome ? a.nome.split(" ")[0] + ", confira" : "Confira")} antes de enviar</div>
        <div style={{ font: "400 13px/1.6 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 20 }}>Pode corrigir qualquer resposta antes de enviar.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {linhas.map((l) => (
            <button
              key={l.rotulo}
              type="button"
              onClick={() => onCorrigir(l.chave === ("contato" as keyof LeadRespostas) ? "contato" : l.chave)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "13px 4px", border: "none", borderBottom: "1px solid var(--fundo-alt)", background: "none", cursor: "pointer", textAlign: "left", width: "100%" }}
            >
              <span style={{ font: "400 12.5px var(--font-interface)", color: "var(--texto-terciario)" }}>{l.rotulo}</span>
              <span style={{ font: "600 13px var(--font-interface)", color: l.ok ? "var(--texto)" : "var(--alerta-texto)", textAlign: "right" }}>{l.valor} ›</span>
            </button>
          ))}
        </div>
      </div>
      <RodapeBotao rotulo={enviando ? "Enviando…" : "Enviar e escolher horário"} habilitado={!enviando} onClick={onEnviar} />
    </div>
  );
}

function TelaAgendar({
  nome,
  slots,
  ofereceCampoAberto,
  slotEscolhido,
  outra,
  outraTexto,
  agendando,
  onEscolherSlot,
  onPedirOutra,
  onOutraTexto,
  onConfirmar,
  onWhatsapp,
}: {
  nome: string;
  slots: { dia: string; hora: string }[];
  ofereceCampoAberto: boolean;
  slotEscolhido: number | null;
  outra: boolean;
  outraTexto: string;
  agendando: boolean;
  onEscolherSlot: (i: number) => void;
  onPedirOutra: () => void;
  onOutraTexto: (v: string) => void;
  onConfirmar: () => void;
  onWhatsapp: () => void;
}) {
  const podeConfirmar = (outra && !!outraTexto) || (!outra && slotEscolhido !== null);
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "26px 24px 28px" }}>
      <div style={{ width: 54, height: 54, borderRadius: "50%", background: "var(--sucesso-fundo)", color: "var(--verde)", display: "grid", placeItems: "center", font: "700 23px var(--font-interface)", marginBottom: 20 }}>✓</div>
      <div style={{ font: "600 26px/1.25 var(--font-titulo)", color: "var(--marinho)", marginBottom: 12 }}>{nome ? nome.split(" ")[0] : "Tudo"}, recebi as suas respostas.</div>
      <div style={{ font: "400 13.5px/1.7 var(--font-interface)", color: "var(--texto-secundario)", marginBottom: 22 }}>Vou montar o seu mapa de proteção com essas respostas e apresentar pessoalmente. Escolha um horário na minha agenda.</div>
      <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 14, padding: 18, marginBottom: 12 }}>
        <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--texto-terciario)", marginBottom: 14 }}>Horários livres na agenda</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {slots.map((s, idx) => {
            const sel = !outra && slotEscolhido === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onEscolherSlot(idx)}
                style={{ cursor: "pointer", borderRadius: 11, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", background: sel ? "var(--azul-claro-fundo)" : "#fff", border: `1.5px solid ${sel ? "var(--azul)" : "var(--borda)"}`, color: sel ? "var(--marinho)" : "var(--texto)", font: "600 13.5px var(--font-interface)" }}
              >
                <span>{s.dia}</span>
                <span>{s.hora}</span>
              </button>
            );
          })}
          {ofereceCampoAberto && (
            <button
              type="button"
              onClick={onPedirOutra}
              style={{ cursor: "pointer", borderRadius: 11, padding: 14, textAlign: "left", background: outra ? "var(--azul-claro-fundo)" : "#fff", border: `1.5px dashed ${outra ? "var(--azul)" : "var(--azul-claro-borda)"}`, color: outra ? "var(--marinho)" : "var(--azul)", font: "600 13.5px var(--font-interface)" }}
            >
              Nenhum desses — quero sugerir outro dia
            </button>
          )}
          {outra && ofereceCampoAberto && (
            <input
              type="text"
              value={outraTexto}
              onChange={(e) => onOutraTexto(e.target.value)}
              placeholder="Ex: terça de manhã, ou 10/09 às 14h"
              style={{ width: "100%", boxSizing: "border-box", padding: 13, border: "1.5px solid var(--azul)", borderRadius: 11, font: "500 13.5px var(--font-interface)" }}
            />
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onConfirmar}
        disabled={!podeConfirmar || agendando}
        style={{ width: "100%", font: "700 15px var(--font-interface)", color: "#fff", background: podeConfirmar ? "var(--marinho)" : "var(--cinza-inativo)", border: "none", padding: 16, borderRadius: 14, cursor: podeConfirmar ? "pointer" : "default" }}
      >
        {agendando ? "Confirmando…" : "Confirmar horário"}
      </button>
      <button type="button" onClick={onWhatsapp} disabled={agendando} style={{ width: "100%", border: "none", background: "none", font: "600 13.5px var(--font-interface)", color: "var(--azul)", cursor: "pointer", padding: 15 }}>
        Prefiro que {"{Edgar}".replace("{Edgar}", "o corretor")} me chame no WhatsApp
      </button>
    </div>
  );
}

function TelaConfirmacao({
  email,
  corretor,
  canal,
  dataFinal,
  outraTexto,
}: {
  email: string;
  corretor: CorretorPublico;
  canal: "agenda" | "sugerido" | "whatsapp" | null;
  dataFinal: string | null;
  outraTexto: string;
}) {
  const texto =
    canal === "whatsapp"
      ? `${corretor.nome.split(" ")[0]} vai te chamar no WhatsApp para marcar o melhor momento. Suas respostas já estão com ele.`
      : canal === "sugerido"
        ? `Enviei a sua sugestão de horário (${outraTexto || "a data indicada"}) para ${corretor.nome.split(" ")[0]} confirmar na agenda dele.`
        : dataFinal
          ? `Nosso encontro está marcado para ${new Date(dataFinal).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" })} às ${new Date(dataFinal).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}, já reservado na agenda.`
          : "Nosso encontro está marcado, já reservado na agenda.";

  return (
    <div style={{ flex: 1, background: "var(--marinho)", padding: "34px 26px", display: "flex", flexDirection: "column", color: "#fff" }}>
      <div style={{ flex: 1 }} />
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(57,204,0,.2)", border: "1px solid rgba(57,204,0,.55)", color: "var(--verde)", display: "grid", placeItems: "center", font: "700 24px var(--font-interface)", marginBottom: 24 }}>✓</div>
      <div style={{ font: "600 29px/1.22 var(--font-titulo)", marginBottom: 14 }}>Combinado!</div>
      <div style={{ font: "400 14px/1.75 var(--font-interface)", color: "rgba(255,255,255,.78)", marginBottom: 18 }}>{texto}</div>
      {email && (
        <div style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 14, padding: "16px 18px", font: "400 12.5px/1.7 var(--font-interface)", color: "rgba(255,255,255,.75)" }}>
          Enviei um e-mail de agradecimento para <strong style={{ color: "#fff" }}>{email}</strong> com a confirmação e os contatos.
        </div>
      )}
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 22, borderTop: "1px solid rgba(255,255,255,.16)" }}>
        {corretor.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL local, sem imagem remota pra otimizar
          <img src={corretor.fotoUrl} alt={corretor.nome} style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flex: "none" }} />
        ) : (
          <div style={{ width: 42, height: 42, borderRadius: "50%", border: "1px dashed rgba(255,255,255,.45)", display: "grid", placeItems: "center", font: "600 7.5px var(--font-interface)", color: "rgba(255,255,255,.6)", flex: "none" }}>
            FOTO
          </div>
        )}
        <div>
          <div style={{ font: "600 13px var(--font-interface)" }}>{corretor.nome}</div>
          <div style={{ font: "400 11.5px var(--font-interface)", color: "rgba(255,255,255,.6)" }}>
            {corretor.whatsapp} {corretor.corretora ? `· ${corretor.corretora}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
