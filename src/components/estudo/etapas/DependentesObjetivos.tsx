"use client";

import type { EstudoFormulario } from "@/lib/estudo-formulario";
import { RELACOES_DEPENDENTE } from "@/lib/estudo-formulario";
import { FASES } from "@/lib/calc";
import { brl, idadeDe, mascaraData } from "@/lib/formato";
import {
  Cartao,
  CampoTexto,
  CampoDinheiro,
  CampoSelect,
  LinhaCheckbox,
  BotaoRemover,
  BotaoAdicionar,
} from "@/components/ui/Campos";

const NOME_FASE: Record<string, { nome: string; faixa: string }> = {
  pre: { nome: "Pré-escola", faixa: "1 a 5 anos" },
  fund: { nome: "Fundamental", faixa: "6 a 14 anos" },
  medio: { nome: "Médio", faixa: "15 a 17 anos" },
  sup: { nome: "Superior", faixa: "18 a 22 anos" },
  pos: { nome: "Pós-graduação", faixa: "23 a 24 anos" },
};

const PRAZOS_EXTRA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function DependentesObjetivos({
  dados,
  set,
  somenteLeitura,
}: {
  dados: EstudoFormulario;
  set: (patch: Partial<EstudoFormulario>) => void;
  somenteLeitura: boolean;
}) {
  const eduHojeTotal = dados.planoEdu
    ? dados.deps.reduce((soma, dep) => {
        const idade = idadeDe(dep.nasc, new Date());
        if (idade === null || dep.rel !== "Filho(a)") return soma;
        const anos = Math.floor(idade);
        const fase = FASES.find((f) => anos >= f.a0 && anos <= f.a1);
        return soma + (fase ? dados.edu[fase.k] || 0 : 0);
      }, 0) + dados.extras.filter((x) => x.valor > 0).reduce((a, x) => a + x.valor, 0)
    : 0;

  return (
    <fieldset disabled={somenteLeitura} style={{ border: "none", padding: 0, margin: 0 }}>
      <Cartao>
        <LinhaCheckbox marcado={dados.temDep} onToggle={() => set({ temDep: !dados.temDep })}>
          Possui dependentes financeiros
        </LinhaCheckbox>
        {dados.temDep && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dados.deps.map((d, i) => {
                const idade = idadeDe(d.nasc, new Date());
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 130px 110px 150px 34px", gap: 10, alignItems: "center" }}>
                    <CampoTexto
                      placeholder="Nome"
                      value={d.nome}
                      onChange={(v) => {
                        const deps = [...dados.deps];
                        deps[i] = { ...d, nome: v };
                        set({ deps });
                      }}
                    />
                    <CampoTexto
                      placeholder="dd/mm/aaaa"
                      value={d.nasc}
                      onChange={(v) => {
                        const deps = [...dados.deps];
                        deps[i] = { ...d, nasc: mascaraData(v) };
                        set({ deps });
                      }}
                    />
                    <div
                      style={{
                        font: "600 12.5px var(--font-interface)",
                        padding: "9px 8px",
                        borderRadius: 9,
                        textAlign: "center",
                        background: idade === null ? "var(--fundo-alt)" : "var(--sucesso-fundo)",
                        color: idade === null ? "var(--texto-terciario)" : "var(--verde-escuro)",
                      }}
                    >
                      {idade === null ? "—" : `${Math.floor(idade)} anos`}
                    </div>
                    <CampoSelect
                      value={d.rel}
                      onChange={(v) => {
                        const deps = [...dados.deps];
                        deps[i] = { ...d, rel: v as (typeof RELACOES_DEPENDENTE)[number] };
                        set({ deps });
                      }}
                      opcoes={RELACOES_DEPENDENTE}
                    />
                    <BotaoRemover onClick={() => set({ deps: dados.deps.filter((_, j) => j !== i) })} />
                  </div>
                );
              })}
            </div>
            <BotaoAdicionar onClick={() => set({ deps: [...dados.deps, { nome: "", nasc: "", rel: "Filho(a)" }] })}>
              + adicionar dependente
            </BotaoAdicionar>
          </div>
        )}
      </Cartao>

      <Cartao>
        <LinhaCheckbox marcado={dados.planoEdu} onToggle={() => set({ planoEdu: !dados.planoEdu })}>
          Planejamento educacional
        </LinhaCheckbox>
        {dados.planoEdu && (
          <div>
            <div style={{ background: "var(--sucesso-fundo)", border: "1px solid var(--sucesso-borda)", borderRadius: 9, padding: "11px 13px", margin: "14px 0" }}>
              <div style={{ font: "700 9.5px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".09em", color: "var(--verde-escuro)", marginBottom: 5 }}>
                Valor por filho, não o total
              </div>
              <div style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--texto)" }}>
                Informe quanto custa um filho em cada fase. Se dois estão na mesma fase, o sistema aplica o
                valor a cada um. A conta soma tudo até os 25 anos e devolve a média mensal até a formatura.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {FASES.map((fa) => (
                <div
                  key={fa.k}
                  style={{ display: "grid", gridTemplateColumns: "1fr 200px 170px", gap: 14, alignItems: "center", padding: "10px 0", borderBottom: "1px dashed var(--borda)" }}
                >
                  <div>
                    <div style={{ font: "600 13px var(--font-interface)", color: "var(--texto)" }}>{NOME_FASE[fa.k].nome}</div>
                    <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)" }}>{NOME_FASE[fa.k].faixa}</div>
                  </div>
                  <div />
                  <CampoDinheiro
                    placeholder="R$ por mês, por filho"
                    value={dados.edu[fa.k]}
                    onChange={(n) => set({ edu: { ...dados.edu, [fa.k]: n } })}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--borda)" }}>
              <span style={{ font: "600 12px var(--font-interface)", color: "var(--texto-secundario)" }}>
                Despesa de educação hoje, somando os filhos nas fases atuais
              </span>
              <span style={{ font: "700 16px var(--font-interface)", color: "var(--marinho)" }}>{brl(eduHojeTotal)}</span>
            </div>
          </div>
        )}
      </Cartao>

      <Cartao>
        <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)" }}>
          Outras despesas de estudo{" "}
          <span style={{ font: "600 10px var(--font-interface)", color: "var(--texto-terciario)", background: "var(--fundo)", padding: "3px 7px", borderRadius: 5, marginLeft: 6 }}>
            OPCIONAL
          </span>
        </div>
        <div style={{ font: "400 11.5px/1.5 var(--font-interface)", color: "var(--texto-terciario)", margin: "5px 0 14px" }}>
          Inglês, esporte, música, intercâmbio. Some ao custo educacional pelo prazo escolhido — de 1 a 10
          anos, ou tempo indeterminado (vai até o filho mais novo completar 25).
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dados.extras.map((x, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 150px 180px 34px", gap: 10, alignItems: "center" }}>
              <CampoTexto
                placeholder="Descrição"
                value={x.nome || ""}
                onChange={(v) => {
                  const extras = [...dados.extras];
                  extras[i] = { ...x, nome: v };
                  set({ extras });
                }}
              />
              <CampoDinheiro
                value={x.valor}
                onChange={(n) => {
                  const extras = [...dados.extras];
                  extras[i] = { ...x, valor: n };
                  set({ extras });
                }}
              />
              <select
                value={String(x.prazo)}
                onChange={(e) => {
                  const extras = [...dados.extras];
                  extras[i] = { ...x, prazo: parseInt(e.target.value, 10) };
                  set({ extras });
                }}
                style={{ padding: "10px 11px", border: "1.5px solid var(--azul-claro-borda)", borderRadius: 9, font: "600 12.5px var(--font-interface)", color: "var(--marinho)", background: "var(--azul-claro-fundo)" }}
              >
                {PRAZOS_EXTRA.map((p) => (
                  <option key={p} value={p}>
                    {p} {p === 1 ? "ano" : "anos"}
                  </option>
                ))}
                <option value={0}>tempo indeterminado</option>
              </select>
              <BotaoRemover onClick={() => set({ extras: dados.extras.filter((_, j) => j !== i) })} />
            </div>
          ))}
        </div>
        <BotaoAdicionar onClick={() => set({ extras: [...dados.extras, { nome: "", valor: 0, prazo: 1 }] })}>
          + adicionar despesa de estudo
        </BotaoAdicionar>
      </Cartao>

      <Cartao>
        <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 14 }}>Prazos e teto</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div>
            <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 6 }}>
              Manutenção do padrão de vida
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <input
                type="text"
                value={dados.prazoManutencao}
                onChange={(e) => set({ prazoManutencao: parseInt(e.target.value, 10) || 0 })}
                style={{ width: 80, padding: "10px 12px", border: "1.5px solid var(--borda)", borderRadius: 9, font: "700 14px var(--font-interface)", color: "var(--marinho)", background: "#fbfdff", textAlign: "center" }}
              />
              <span style={{ font: "500 12.5px var(--font-interface)", color: "var(--texto-secundario)" }}>anos</span>
            </div>
          </div>
          <div>
            <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 6 }}>Teto de razoabilidade</div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <input
                type="text"
                value={dados.teto}
                onChange={(e) => set({ teto: parseFloat(e.target.value) || 0 })}
                style={{ width: 80, padding: "10px 12px", border: "1.5px solid var(--borda)", borderRadius: 9, font: "700 14px var(--font-interface)", color: "var(--marinho)", background: "#fbfdff", textAlign: "center" }}
              />
              <span style={{ font: "500 12.5px var(--font-interface)", color: "var(--texto-secundario)" }}>× a renda anual</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 8 }}>Prazo da pensão por morte</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 5, 10, 15, 20].map((p) => (
              <div
                key={p}
                onClick={() => set({ prazoPensao: p })}
                style={{
                  flex: 1,
                  textAlign: "center",
                  cursor: "pointer",
                  font: "600 12.5px var(--font-interface)",
                  padding: 10,
                  borderRadius: 9,
                  color: dados.prazoPensao === p ? "var(--marinho)" : "var(--texto)",
                  background: dados.prazoPensao === p ? "var(--azul-claro-fundo)" : "#fff",
                  border: `1.5px solid ${dados.prazoPensao === p ? "var(--azul-claro-borda)" : "var(--borda)"}`,
                }}
              >
                {p} anos
              </div>
            ))}
          </div>
        </div>
      </Cartao>

      <Cartao>
        <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)" }}>Projetos e objetivos</div>
        <div style={{ font: "400 11.5px/1.5 var(--font-interface)", color: "var(--texto-terciario)", margin: "5px 0 14px" }}>
          Também serve para dívidas informais sem seguro prestamista próprio. Financiamento de imóvel e
          veículo e consórcio normalmente já têm seguro embutido e não entram aqui.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dados.objetivos.map((o, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 160px 150px 34px", gap: 10, alignItems: "center" }}>
              <CampoTexto
                placeholder="Descrição"
                value={o.desc || ""}
                onChange={(v) => {
                  const objetivos = [...dados.objetivos];
                  objetivos[i] = { ...o, desc: v };
                  set({ objetivos });
                }}
              />
              <CampoDinheiro
                placeholder="R$"
                value={o.valor}
                onChange={(n) => {
                  const objetivos = [...dados.objetivos];
                  objetivos[i] = { ...o, valor: n };
                  set({ objetivos });
                }}
              />
              <LinhaCheckbox
                marcado={o.incluir}
                onToggle={() => {
                  const objetivos = [...dados.objetivos];
                  objetivos[i] = { ...o, incluir: !o.incluir };
                  set({ objetivos });
                }}
              >
                {o.incluir ? "Incluído" : "Fora"}
              </LinhaCheckbox>
              <BotaoRemover onClick={() => set({ objetivos: dados.objetivos.filter((_, j) => j !== i) })} />
            </div>
          ))}
        </div>
        <BotaoAdicionar onClick={() => set({ objetivos: [...dados.objetivos, { desc: "", valor: 0, incluir: true }] })}>
          + adicionar objetivo
        </BotaoAdicionar>
      </Cartao>
    </fieldset>
  );
}
