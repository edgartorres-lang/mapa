"use client";

import type { EstudoFormulario } from "@/lib/estudo-formulario";
import { ESTADOS_CIVIS } from "@/lib/estudo-formulario";
import type { VinculoKey } from "@/lib/calc";
import { brl, idadeDe, mascaraData } from "@/lib/formato";
import {
  Cartao,
  Campo,
  CampoTexto,
  CampoDinheiro,
  CampoSelect,
  LinhaCheckbox,
  GrupoPill,
  BotaoRemover,
  BotaoAdicionar,
} from "@/components/ui/Campos";

const VINC_INFO: { k: VinculoKey; rotulo: string; nota: string }[] = [
  { k: "clt", rotulo: "CLT", nota: "Sem majoração de risco" },
  { k: "servidor", rotulo: "Servidor público", nota: "RPPS paga pensão aos dependentes" },
  { k: "autonomo", rotulo: "Autônomo, liberal ou empresário", nota: "Sem rede formal de proteção" },
];

export function Perfil({
  dados,
  set,
  somenteLeitura,
}: {
  dados: EstudoFormulario;
  set: (patch: Partial<EstudoFormulario>) => void;
  somenteLeitura: boolean;
}) {
  const idade = idadeDe(dados.nasc, new Date());
  const casado = dados.estadoCivil === "Casado(a)" || dados.estadoCivil === "União estável";

  const rendaMensal = Object.values(dados.vinculos).reduce((a, v) => a + (v.on ? v.renda : 0), 0);
  const rendaConjugeIncl = casado && dados.incluirConjuge ? dados.rendaConjuge : 0;
  const terceirosIncl = dados.terceiros.filter((t) => t.incluir).reduce((a, t) => a + t.valor, 0);
  const rendaFamiliar = rendaMensal + rendaConjugeIncl + terceirosIncl;
  const participacao = rendaFamiliar > 0 ? rendaMensal / rendaFamiliar : 1;

  return (
    <fieldset disabled={somenteLeitura} style={{ border: "none", padding: 0, margin: 0 }}>
      <Cartao>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 96px", gap: 14, alignItems: "end", marginBottom: 16 }}>
          <Campo rotulo="Nome">
            <CampoTexto placeholder="Nome completo" value={dados.nome} onChange={(v) => set({ nome: v })} />
          </Campo>
          <Campo rotulo="Nascimento">
            <CampoTexto placeholder="dd/mm/aaaa" value={dados.nasc} onChange={(v) => set({ nasc: mascaraData(v) })} />
          </Campo>
          <div
            style={{
              font: "600 13px var(--font-interface)",
              padding: "11px 10px",
              borderRadius: 9,
              textAlign: "center",
              background: "var(--sucesso-fundo)",
              color: "var(--verde-escuro)",
            }}
          >
            {idade === null ? "—" : `${Math.floor(idade)} anos`}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 130px", gap: 14, alignItems: "end" }}>
          <Campo rotulo="Sexo" nota="só para a flexão dos textos">
            <GrupoPill
              opcoes={[
                { valor: "F", rotulo: "Feminino" },
                { valor: "M", rotulo: "Masculino" },
              ]}
              valor={dados.sexo}
              onEscolher={(v) => set({ sexo: v })}
            />
          </Campo>
          <Campo rotulo="Estado civil">
            <CampoSelect value={dados.estadoCivil} onChange={(v) => set({ estadoCivil: v })} opcoes={ESTADOS_CIVIS} />
          </Campo>
          <Campo rotulo="Profissão">
            <CampoTexto placeholder="Profissão" value={dados.profissao} onChange={(v) => set({ profissao: v })} />
          </Campo>
          <Campo rotulo="Aposenta aos">
            <CampoTexto placeholder="65" value={String(dados.idadeApos || "")} onChange={(v) => set({ idadeApos: parseInt(v, 10) || 0 })} />
          </Campo>
        </div>
      </Cartao>

      <Cartao>
        <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)" }}>
          Vínculo profissional e renda bruta{" "}
          <span style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)" }}>· pode marcar mais de um</span>
        </div>
        <div style={{ font: "400 11.5px/1.5 var(--font-interface)", color: "var(--texto-terciario)", margin: "5px 0 14px" }}>
          O fator de risco incide sobre a renda daquele vínculo. Autônomo, liberal e empresário majoram a
          renda equivalente; CLT e servidor entram sem majoração.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {VINC_INFO.map((v) => {
            const estado = dados.vinculos[v.k];
            return (
              <div
                key={v.k}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 190px 150px",
                  gap: 12,
                  alignItems: "center",
                  padding: "12px 14px",
                  border: `1.5px solid ${estado.on ? "var(--azul)" : "var(--borda)"}`,
                  borderRadius: 10,
                  background: estado.on ? "var(--azul-claro-fundo)" : "#fff",
                }}
              >
                <div
                  onClick={() => set({ vinculos: { ...dados.vinculos, [v.k]: { ...estado, on: !estado.on } } })}
                  style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", font: "600 13px var(--font-interface)", color: estado.on ? "var(--marinho)" : "var(--texto)" }}
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
                      background: estado.on ? "var(--azul)" : "transparent",
                      color: "#fff",
                      border: `1.5px solid ${estado.on ? "var(--azul)" : "var(--cinza-inativo)"}`,
                    }}
                  >
                    {estado.on ? "✓" : ""}
                  </span>
                  {v.rotulo}
                </div>
                <CampoDinheiro
                  value={estado.renda}
                  onChange={(n) => set({ vinculos: { ...dados.vinculos, [v.k]: { ...estado, renda: n } } })}
                  disabled={!estado.on}
                />
                <div style={{ font: "500 11.5px/1.4 var(--font-interface)", color: "var(--texto-terciario)" }}>{v.nota}</div>
              </div>
            );
          })}
        </div>
      </Cartao>

      {casado && (
        <Cartao>
          <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 12 }}>
            Renda familiar — cônjuge
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 14, alignItems: "center" }}>
            <CampoDinheiro value={dados.rendaConjuge} onChange={(n) => set({ rendaConjuge: n })} />
            <LinhaCheckbox marcado={dados.incluirConjuge} onToggle={() => set({ incluirConjuge: !dados.incluirConjuge })}>
              Incluir no cálculo de padrão de vida
            </LinhaCheckbox>
          </div>
        </Cartao>
      )}

      <Cartao>
        <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)" }}>Rendas permanentes de terceiros</div>
        <div style={{ font: "400 11.5px/1.5 var(--font-interface)", color: "var(--texto-terciario)", margin: "5px 0 14px" }}>
          Aluguéis, dividendos, sociedades. Continuam entrando na conta da família depois do falecimento —
          reduzem a necessidade pela participação do segurado na renda, não como abatimento de capital.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dados.terceiros.map((t, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 160px 150px 34px", gap: 10, alignItems: "center" }}>
              <CampoTexto
                placeholder="Descrição"
                value={t.desc || ""}
                onChange={(v) => {
                  const terceiros = [...dados.terceiros];
                  terceiros[i] = { ...t, desc: v };
                  set({ terceiros });
                }}
              />
              <CampoDinheiro
                value={t.valor}
                onChange={(n) => {
                  const terceiros = [...dados.terceiros];
                  terceiros[i] = { ...t, valor: n };
                  set({ terceiros });
                }}
              />
              <LinhaCheckbox
                marcado={t.incluir}
                onToggle={() => {
                  const terceiros = [...dados.terceiros];
                  terceiros[i] = { ...t, incluir: !t.incluir };
                  set({ terceiros });
                }}
              >
                {t.incluir ? "Entra na renda" : "Fora da renda"}
              </LinhaCheckbox>
              <BotaoRemover onClick={() => set({ terceiros: dados.terceiros.filter((_, j) => j !== i) })} />
            </div>
          ))}
        </div>
        <BotaoAdicionar onClick={() => set({ terceiros: [...dados.terceiros, { desc: "", valor: 0, incluir: true }] })}>
          + adicionar renda permanente
        </BotaoAdicionar>
      </Cartao>

      <div style={{ background: "var(--azul-claro-fundo)", border: "1px solid var(--azul-claro-borda)", borderRadius: 12, padding: "18px 22px" }}>
        <div style={{ font: "700 10px var(--font-interface)", textTransform: "uppercase", letterSpacing: ".09em", color: "var(--azul)", marginBottom: 12 }}>
          Renda familiar total e participação do segurado
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {[
            { rotulo: "Renda do segurado", valor: brl(rendaMensal), cor: "var(--marinho)" },
            { rotulo: "Renda do cônjuge", valor: brl(rendaConjugeIncl), cor: "var(--marinho)" },
            { rotulo: "Renda familiar total", valor: brl(rendaFamiliar), cor: "var(--marinho)" },
            { rotulo: "Participação do segurado", valor: `${Math.round(participacao * 100)}%`, cor: "var(--azul)" },
          ].map((cr) => (
            <div key={cr.rotulo}>
              <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-secundario)" }}>{cr.rotulo}</div>
              <div style={{ font: "600 19px var(--font-titulo)", color: cr.cor, marginTop: 3 }}>{cr.valor}</div>
            </div>
          ))}
        </div>
        <div style={{ font: "400 11.5px/1.6 var(--font-interface)", color: "var(--marinho)", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--azul-claro-borda)" }}>
          A participação multiplica a manutenção do padrão de vida e a pensão de educação: o seguro do
          segurado cobre a fatia proporcional à contribuição dele na renda da casa.
        </div>
      </div>
    </fieldset>
  );
}
