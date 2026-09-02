"use client";

import type { EstudoFormulario } from "@/lib/estudo-formulario";
import { TIPOS_BEM } from "@/lib/estudo-formulario";
import { brl } from "@/lib/formato";
import {
  Cartao,
  CampoTexto,
  CampoDinheiro,
  CampoSelect,
  LinhaCheckbox,
  BotaoRemover,
  BotaoAdicionar,
} from "@/components/ui/Campos";

export function CustosPatrimonio({
  dados,
  set,
  somenteLeitura,
}: {
  dados: EstudoFormulario;
  set: (patch: Partial<EstudoFormulario>) => void;
  somenteLeitura: boolean;
}) {
  const totalPatrimonio = dados.bens.reduce((a, b) => a + b.valor, 0);
  const totalLiquido = dados.bens.filter((b) => b.liquidavel).reduce((a, b) => a + b.valor, 0);
  const totalIliquido = totalPatrimonio - totalLiquido;
  const receitasLiquidaveis = totalLiquido + dados.fgts + dados.inss + dados.prevPrivada + dados.seguroAtual;

  return (
    <fieldset disabled={somenteLeitura} style={{ border: "none", padding: 0, margin: 0 }}>
      <Cartao>
        <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)" }}>Patrimônio, bem por bem</div>
        <div style={{ font: "400 11.5px/1.5 var(--font-interface)", color: "var(--texto-terciario)", margin: "5px 0 14px" }}>
          Todo o patrimônio entra no custo de transmissão sucessória. O que está marcado como liquidável
          também abate a necessidade de capital, porque vira dinheiro rápido.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {dados.bens.map((b, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 160px 150px 200px 34px", gap: 10, alignItems: "center" }}>
              <CampoTexto
                placeholder="Nome do bem"
                value={b.desc || ""}
                onChange={(v) => {
                  const bens = [...dados.bens];
                  bens[i] = { ...b, desc: v };
                  set({ bens });
                }}
              />
              <CampoSelect
                value={b.tipo || "Imóvel"}
                onChange={(v) => {
                  const bens = [...dados.bens];
                  bens[i] = { ...b, tipo: v };
                  set({ bens });
                }}
                opcoes={TIPOS_BEM}
              />
              <CampoDinheiro
                placeholder="R$"
                value={b.valor}
                onChange={(n) => {
                  const bens = [...dados.bens];
                  bens[i] = { ...b, valor: n };
                  set({ bens });
                }}
              />
              <LinhaCheckbox
                marcado={b.liquidavel}
                onToggle={() => {
                  const bens = [...dados.bens];
                  bens[i] = { ...b, liquidavel: !b.liquidavel };
                  set({ bens });
                }}
              >
                {b.liquidavel ? "Liquidável" : "Não liquidável"}
              </LinhaCheckbox>
              <BotaoRemover onClick={() => set({ bens: dados.bens.filter((_, j) => j !== i) })} />
            </div>
          ))}
        </div>
        <BotaoAdicionar onClick={() => set({ bens: [...dados.bens, { desc: "", tipo: "Imóvel", valor: 0, liquidavel: false }] })}>
          + adicionar bem
        </BotaoAdicionar>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--borda)" }}>
          <div>
            <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)" }}>Patrimônio total</div>
            <div style={{ font: "700 15px var(--font-interface)", color: "var(--marinho)" }}>{brl(totalPatrimonio)}</div>
          </div>
          <div>
            <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)" }}>Liquidável</div>
            <div style={{ font: "700 15px var(--font-interface)", color: "var(--verde-escuro)" }}>{brl(totalLiquido)}</div>
          </div>
          <div>
            <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)" }}>Não liquidável</div>
            <div style={{ font: "700 15px var(--font-interface)", color: "var(--alerta-texto)" }}>{brl(totalIliquido)}</div>
          </div>
          <div>
            <div style={{ font: "400 11px var(--font-interface)", color: "var(--texto-terciario)" }}>Custo de transmissão</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 2 }}>
              <input
                type="text"
                value={dados.pctSucessao}
                onChange={(e) => set({ pctSucessao: parseFloat(e.target.value) || 0 })}
                style={{ width: 56, padding: "7px 9px", border: "1.5px solid var(--borda)", borderRadius: 8, font: "700 13px var(--font-interface)", color: "var(--marinho)", background: "#fbfdff", textAlign: "center" }}
              />
              <span style={{ font: "500 12px var(--font-interface)", color: "var(--texto-secundario)" }}>%</span>
            </div>
          </div>
        </div>
      </Cartao>

      <Cartao>
        <div style={{ font: "600 13.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 14 }}>Receitas e reservas já existentes</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {[
            { chave: "fgts" as const, rotulo: "Saldo FGTS", nota: "Liberado aos dependentes no falecimento." },
            { chave: "inss" as const, rotulo: "Acumulado estimado INSS/outros", nota: "Capital equivalente da pensão por morte, quando existir." },
            { chave: "prevPrivada" as const, rotulo: "Previdência privada", nota: "PGBL, VGBL, fundo de pensão." },
            { chave: "seguroAtual" as const, rotulo: "Seguro de vida já existente", nota: "Capital contratado, inclusive o da empresa." },
          ].map((rs) => (
            <div key={rs.chave}>
              <div style={{ font: "600 12.5px var(--font-interface)", color: "var(--marinho)", marginBottom: 6 }}>{rs.rotulo}</div>
              <CampoDinheiro placeholder="R$" value={dados[rs.chave]} onChange={(n) => set({ [rs.chave]: n })} />
              <div style={{ font: "400 11px/1.5 var(--font-interface)", color: "var(--texto-terciario)", marginTop: 5 }}>{rs.nota}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--borda)" }}>
          <span style={{ font: "600 12px var(--font-interface)", color: "var(--texto-secundario)" }}>
            Receitas liquidáveis — abatem a necessidade de capital
          </span>
          <span style={{ font: "700 16px var(--font-interface)", color: "var(--verde-escuro)" }}>{brl(receitasLiquidaveis)}</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <LinhaCheckbox marcado={dados.revisado} onToggle={() => set({ revisado: !dados.revisado })}>
            Confirmo que revisei este bloco com o cliente
          </LinhaCheckbox>
        </div>
      </Cartao>
    </fieldset>
  );
}
