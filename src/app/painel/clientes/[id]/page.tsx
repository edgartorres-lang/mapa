import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ESTAGIO_INFO, corDoEstagio, textoDias, fundoSuaveDoEstagio, nomeDoEstagio, diasDesde } from "@/lib/funil";
import { brl } from "@/lib/formato";
import type { EstagioFunil } from "@/lib/enums";
import { ModalExclusao } from "@/components/painel/ModalExclusao";
import { ModalDuplicar } from "@/components/painel/ModalDuplicar";
import { duplicarEstudo } from "@/app/estudo/actions";
import { mudarEstagio, criarNota, excluirMapaIsolado } from "./actions";

const PASSOS_FUNIL: EstagioFunil[] = ["lead", "estudo", "apresentado", "cotando", "fechado"];
const ABAS = [
  { chave: "resumo", rotulo: "Resumo" },
  { chave: "comparar", rotulo: "Comparar mapas" },
  { chave: "anotacoes", rotulo: "Anotações" },
] as const;

export default async function PaginaCliente({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const { id } = await params;
  const { aba = "resumo" } = await searchParams;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      estudos: { orderBy: { criadoEm: "desc" }, include: { mapa: true } },
      eventos: { orderBy: { criadoEm: "desc" }, take: 20 },
      notas: { orderBy: { criadoEm: "desc" } },
    },
  });
  if (!cliente) notFound();

  const mapas = cliente.estudos.filter((e) => e.mapa).map((e) => ({ estudo: e, mapa: e.mapa! })).sort((a, b) => b.mapa.numeroVersao - a.mapa.numeroVersao);
  const estudoAberto = cliente.estudos.find((e) => e.status === "aberto");
  const idadeCliente = cliente.nascimento ? Math.floor(diasDesde(cliente.nascimento) / 365.2425) : null;
  const ultimoMovimento = cliente.eventos[0]?.criadoEm ?? cliente.criadoEm;
  const diasParado = diasDesde(ultimoMovimento);

  const subtitulo = [cliente.profissao, idadeCliente !== null ? `${idadeCliente} anos` : null, cliente.estadoCivil].filter(Boolean).join(" · ");

  return (
    <div style={{ padding: "26px 30px" }}>
      <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "22px 24px", marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ width: 54, height: 54, borderRadius: "50%", background: "var(--azul-claro-fundo)", display: "grid", placeItems: "center", font: "600 19px var(--font-titulo)", color: "var(--marinho)", flex: "none" }}>
              {cliente.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ font: "600 19px var(--font-titulo)", color: "var(--marinho)" }}>{cliente.nome}</span>
                <span
                  style={{
                    font: "600 10.5px var(--font-interface)",
                    padding: "4px 10px",
                    borderRadius: 999,
                    color: corDoEstagio(cliente.estagioFunil),
                    background: fundoSuaveDoEstagio(cliente.estagioFunil),
                  }}
                >
                  {nomeDoEstagio(cliente.estagioFunil)}
                </span>
              </div>
              {subtitulo && <div style={{ font: "400 12.5px var(--font-interface)", color: "var(--texto-secundario)", marginTop: 4 }}>{subtitulo}</div>}
              <div style={{ font: "400 12px var(--font-interface)", color: "var(--texto-terciario)", marginTop: 4 }}>
                {[cliente.telefone, cliente.email].filter(Boolean).join(" · ") || "Sem contato registrado"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 9 }}>
            {!estudoAberto && mapas[0] && (
              <ModalDuplicar clienteNome={cliente.nome} acaoConfirmar={duplicarEstudo.bind(null, mapas[0].estudo.id)} />
            )}
            {(estudoAberto || mapas[0]) && (
              <Link
                href={`/estudo/${(estudoAberto ?? mapas[0].estudo).id}`}
                style={{ font: "700 12.5px var(--font-interface)", color: "#fff", background: "var(--azul)", border: "none", padding: "11px 18px", borderRadius: 999, whiteSpace: "nowrap" }}
              >
                Abrir {estudoAberto ? "estudo" : "mapa atual"}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
        {ABAS.map((a) => {
          const ativo = a.chave === aba;
          return (
            <Link
              key={a.chave}
              href={`/painel/clientes/${id}?aba=${a.chave}`}
              style={{
                font: "600 12.5px var(--font-interface)",
                padding: "10px 16px",
                borderRadius: "9px 9px 0 0",
                color: ativo ? "var(--marinho)" : "var(--texto-secundario)",
                background: ativo ? "#fff" : "transparent",
                border: ativo ? "1px solid var(--borda)" : "1px solid transparent",
                borderBottom: ativo ? "1px solid #fff" : "1px solid transparent",
                marginBottom: -1,
              }}
            >
              {a.rotulo}
            </Link>
          );
        })}
      </div>

      {aba === "resumo" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
          <div>
            <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px", marginBottom: 16 }}>
              <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 14 }}>Mapas gerados</div>
              {mapas.length === 0 && <div style={{ font: "400 13px var(--font-interface)", color: "var(--texto-terciario)" }}>Nenhum mapa gerado ainda.</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {mapas.map(({ estudo, mapa }, i) => {
                  const atual = i === 0;
                  return (
                    <div
                      key={mapa.id}
                      style={{
                        border: `1px solid ${atual ? "var(--sucesso-borda)" : "var(--borda)"}`,
                        background: atual ? "#F8FEF5" : "#fff",
                        borderRadius: 10,
                        padding: "14px 16px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ font: "600 13px var(--font-interface)", color: "var(--texto)" }}>Mapa da Proteção v{mapa.numeroVersao}</span>
                          <span
                            style={{
                              font: "700 9.5px var(--font-interface)",
                              padding: "2px 8px",
                              borderRadius: 999,
                              color: atual ? "#fff" : "var(--texto-secundario)",
                              background: atual ? "var(--verde)" : "var(--fundo-alt)",
                            }}
                          >
                            {atual ? "atual" : "anterior"}
                          </span>
                        </div>
                        <span style={{ font: "700 14px var(--font-interface)", color: "var(--marinho)" }}>{brl(mapa.capitalAProteger)}</span>
                      </div>
                      <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 10 }}>
                        Gerado em {mapa.geradoEm.toLocaleDateString("pt-BR")}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <Link href={`/estudo/${estudo.id}`} style={{ font: "600 11px var(--font-interface)", color: "var(--marinho)", border: "1.5px solid var(--borda)", padding: "6px 10px", borderRadius: 999 }}>
                            Abrir
                          </Link>
                          <Link href={`/estudo/${estudo.id}/apresentacao`} style={{ font: "600 11px var(--font-interface)", color: "var(--marinho)", border: "1.5px solid var(--borda)", padding: "6px 10px", borderRadius: 999 }}>
                            Apresentação
                          </Link>
                          <Link href={`/estudo/${estudo.id}/proposta`} style={{ font: "600 11px var(--font-interface)", color: "var(--marinho)", border: "1.5px solid var(--borda)", padding: "6px 10px", borderRadius: 999 }}>
                            Proposta
                          </Link>
                          <Link href={`/estudo/${estudo.id}/memoria`} style={{ font: "600 11px var(--font-interface)", color: "var(--marinho)", border: "1.5px solid var(--borda)", padding: "6px 10px", borderRadius: 999 }}>
                            Memória
                          </Link>
                          {atual && !estudoAberto && (
                            <ModalDuplicar rotuloBotao="Duplicar" clienteNome={cliente.nome} acaoConfirmar={duplicarEstudo.bind(null, estudo.id)} />
                          )}
                        </div>
                        <ModalExclusao
                          rotuloBotao="Excluir mapa"
                          titulo={`Excluir o Mapa da Proteção v${mapa.numeroVersao}?`}
                          subtitulo={`${cliente.nome} · gerado em ${mapa.geradoEm.toLocaleDateString("pt-BR")} · ${brl(mapa.capitalAProteger)}`}
                          vaiEmbora={[
                            `O Mapa da Proteção v${mapa.numeroVersao} e as saídas geradas dele (apresentação, proposta, e-mail).`,
                            `O estudo de ${estudo.criadoEm.toLocaleDateString("pt-BR")} que originou este mapa, com todas as respostas.`,
                          ]}
                          oQueFica={[
                            `O cadastro de ${cliente.nome}: contato, dependentes, origem e consentimento.`,
                            ...(mapas.length > 1 ? ["Os outros mapas deste cliente, que continuam no histórico."] : []),
                            "As anotações e o histórico do CRM.",
                          ]}
                          rotuloConfirmar="Excluir mapa e estudo"
                          acaoConfirmar={excluirMapaIsolado.bind(null, estudo.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
              <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 14 }}>Histórico</div>
              {cliente.eventos.length === 0 && <div style={{ font: "400 13px var(--font-interface)", color: "var(--texto-terciario)" }}>Sem movimento ainda.</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {cliente.eventos.map((ev) => (
                  <div key={ev.id} style={{ display: "grid", gridTemplateColumns: "52px 1fr", gap: 12, font: "400 12px/1.5 var(--font-interface)" }}>
                    <span style={{ color: "var(--texto-terciario)" }}>{ev.criadoEm.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                    <span style={{ color: "var(--texto)" }}>{ev.texto}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px", marginBottom: 16 }}>
              <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 12 }}>Estágio no funil</div>
              <div style={{ display: "flex", gap: 6 }}>
                {PASSOS_FUNIL.map((estagio) => {
                  const ativo = cliente.estagioFunil === estagio;
                  const acao = mudarEstagio.bind(null, cliente.id, estagio);
                  return (
                    <form key={estagio} action={acao} style={{ flex: 1 }}>
                      <button
                        type="submit"
                        style={{
                          width: "100%",
                          font: "600 10.5px var(--font-interface)",
                          padding: "8px 4px",
                          borderRadius: 8,
                          color: ativo ? "#fff" : "var(--texto-secundario)",
                          background: ativo ? ESTAGIO_INFO[estagio].cor : "#fff",
                          border: `1.5px solid ${ativo ? ESTAGIO_INFO[estagio].cor : "var(--borda)"}`,
                          cursor: "pointer",
                        }}
                      >
                        {ESTAGIO_INFO[estagio].nome}
                      </button>
                    </form>
                  );
                })}
              </div>
              <div style={{ marginTop: 10 }}>
                {cliente.estagioFunil !== "perdido" ? (
                  <form action={mudarEstagio.bind(null, cliente.id, "perdido")}>
                    <button type="submit" style={{ font: "600 11px var(--font-interface)", color: "var(--alerta-texto)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      Marcar como perdido
                    </button>
                  </form>
                ) : (
                  <span style={{ font: "600 11px var(--font-interface)", color: "var(--alerta-texto)" }}>Perdido</span>
                )}
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
              <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 12 }}>Cadastro</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {[
                  ["Nascimento", cliente.nascimento?.toLocaleDateString("pt-BR") ?? "—"],
                  ["Telefone", cliente.telefone ?? "—"],
                  ["E-mail", cliente.email ?? "—"],
                  ["Profissão", cliente.profissao ?? "—"],
                  ["Estado civil", cliente.estadoCivil ?? "—"],
                  ["Origem", cliente.origem ?? "—"],
                  ["Cliente desde", cliente.criadoEm.toLocaleDateString("pt-BR")],
                  ["Último movimento", `${textoDias(diasParado)} atrás`],
                ].map(([rotulo, valor]) => (
                  <div key={rotulo} style={{ display: "flex", justifyContent: "space-between", gap: 12, font: "400 12px var(--font-interface)" }}>
                    <span style={{ color: "var(--texto-terciario)" }}>{rotulo}</span>
                    <span style={{ color: "var(--texto)", fontWeight: 500, textAlign: "right" }}>{valor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {aba === "comparar" && <AbaComparar mapas={mapas} />}

      {aba === "anotacoes" && (
        <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px", maxWidth: 640 }}>
          <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 4 }}>Anotações</div>
          <div style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 16 }}>Nunca entram em PDF nem e-mail.</div>
          <form
            action={async (formData: FormData) => {
              "use server";
              await criarNota(cliente.id, String(formData.get("texto") ?? ""));
            }}
            style={{ display: "flex", gap: 8, marginBottom: 18 }}
          >
            <input
              type="text"
              name="texto"
              placeholder="Escrever uma anotação…"
              style={{ flex: 1, padding: "10px 12px", border: "1.5px solid var(--borda)", borderRadius: 9, font: "500 13px var(--font-interface)", background: "#fbfdff" }}
            />
            <button type="submit" style={{ font: "700 12.5px var(--font-interface)", color: "#fff", background: "var(--marinho)", border: "none", padding: "10px 18px", borderRadius: 999, cursor: "pointer" }}>
              Adicionar
            </button>
          </form>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cliente.notas.length === 0 && <div style={{ font: "400 13px var(--font-interface)", color: "var(--texto-terciario)" }}>Nenhuma anotação ainda.</div>}
            {cliente.notas.map((nota) => (
              <div key={nota.id} style={{ borderLeft: "3px solid var(--verde)", paddingLeft: 14 }}>
                <div style={{ font: "400 10.5px var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 3 }}>{nota.criadoEm.toLocaleDateString("pt-BR")}</div>
                <div style={{ font: "400 12.5px/1.6 var(--font-interface)", color: "var(--texto)" }}>{nota.texto}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AbaComparar({ mapas }: { mapas: { estudo: { id: string }; mapa: { numeroVersao: number; capitalAProteger: number; vitalicia: number; temporaria: number; custoEducacionalTotal: number; pensaoMensal: number } }[] }) {
  if (mapas.length < 2) {
    return (
      <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "22px 24px" }}>
        <div style={{ font: "400 13px/1.7 var(--font-interface)", color: "var(--texto-secundario)" }}>
          Este cliente tem {mapas.length === 0 ? "nenhum mapa" : "só um mapa"} gerado — a comparação aparece a partir do
          segundo mapa (depois de duplicar o estudo e gerar de novo).
        </div>
      </div>
    );
  }

  const [depois, antes] = mapas; // mapas[0] é o mais recente
  const linhas = [
    { rotulo: "Capital em seguro de vida", a: antes.mapa.capitalAProteger, b: depois.mapa.capitalAProteger },
    { rotulo: "Cobertura vitalícia", a: antes.mapa.vitalicia, b: depois.mapa.vitalicia },
    { rotulo: "Cobertura temporária", a: antes.mapa.temporaria, b: depois.mapa.temporaria },
    { rotulo: "Custo educacional", a: antes.mapa.custoEducacionalTotal, b: depois.mapa.custoEducacionalTotal },
    { rotulo: "Pensão de educação (mês)", a: antes.mapa.pensaoMensal, b: depois.mapa.pensaoMensal },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid var(--borda)", borderRadius: 12, padding: "20px 22px" }}>
      <div style={{ font: "600 15px var(--font-titulo)", color: "var(--marinho)", marginBottom: 4 }}>
        v{antes.mapa.numeroVersao} → v{depois.mapa.numeroVersao}
      </div>
      <div style={{ font: "400 11.5px var(--font-interface)", color: "var(--texto-terciario)", marginBottom: 16 }}>Os dois mapas mais recentes.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 0.8fr", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--borda)", font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".06em", color: "var(--texto-terciario)" }}>
        <span>Número</span>
        <span>Antes (v{antes.mapa.numeroVersao})</span>
        <span>Depois (v{depois.mapa.numeroVersao})</span>
        <span>Variação</span>
      </div>
      {linhas.map((l) => {
        const dif = l.a ? Math.round(((l.b - l.a) / l.a) * 100) : 0;
        const cor = dif > 0 ? "var(--verde-escuro)" : dif < 0 ? "var(--alerta-texto)" : "var(--texto-terciario)";
        return (
          <div key={l.rotulo} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 0.8fr", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--fundo-alt)", font: "500 12.5px var(--font-interface)" }}>
            <span style={{ color: "var(--texto)" }}>{l.rotulo}</span>
            <span style={{ color: "var(--texto-secundario)" }}>{brl(l.a)}</span>
            <span style={{ color: "var(--texto)", fontWeight: 700 }}>{brl(l.b)}</span>
            <span style={{ color: cor, fontWeight: 700 }}>
              {dif > 0 ? "+" : ""}
              {dif}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
