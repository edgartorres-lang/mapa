import type { CalcResultado, FatoresCalculo, VinculoKey } from "./calc";
import type { EstudoFormulario } from "./estudo-formulario";
import { brl } from "./formato";

/**
 * Memória de cálculo: a conta aberta, na ordem do racional — porta de `const memoria` em
 * Ciclo do Estudo.dc.html (~linha 498-527). O protótipo tem os números fixos da Marina
 * (hardcoded "CLT R$ 6.000 + conta própria R$ 9.000"); aqui a lista de vínculos, filhos e
 * objetivos é montada a partir do estudo de verdade, não é mais um exemplo fixo.
 */
export interface GrupoMemoria {
  grupo: string;
  cor: string;
  total: string;
  linhas: { rotulo: string; formula: string; valor: string }[];
}

const ROTULO_VINCULO: Record<VinculoKey, string> = { clt: "CLT", servidor: "Servidor", autonomo: "Autônomo" };

export function construirMemoriaCalculo(dados: EstudoFormulario, c: CalcResultado, fatores: FatoresCalculo): GrupoMemoria[] {
  const ativos = (["clt", "servidor", "autonomo"] as VinculoKey[])
    .filter((k) => dados.vinculos[k].on && dados.vinculos[k].renda > 0)
    .map((k) => ({
      k,
      renda: dados.vinculos[k].renda,
      fator: k === "autonomo" ? fatores.fatorAutonomo : 1,
    }));

  const rendaTexto = ativos.map((v) => `${ROTULO_VINCULO[v.k]} ${brl(v.renda)}`).join(" + ") || "sem vínculo com renda";
  const rendaEquivTexto = ativos.map((v) => `${brl(v.renda)} × ${v.fator.toFixed(2).replace(".", ",")}`).join(" + ") || "—";

  const filhos = dados.temDep ? dados.deps.filter((d) => d.rel === "Filho(a)" && (d.nome || "").trim()) : [];
  const eduHojeTexto =
    filhos.length && dados.planoEdu
      ? filhos.map((f) => f.nome.split(" ")[0]).join(" + ") + " + extras"
      : "sem plano educacional";

  const objetivosIncluidos = dados.objetivos.filter((o) => o.incluir);
  const objetivosTexto = objetivosIncluidos.length ? objetivosIncluidos.map((o) => o.desc || "objetivo").join(", ") : "nenhum objetivo incluído";

  return [
    {
      grupo: "Renda e participação",
      cor: "#1B72BE",
      total: `${Math.round(c.participacao * 100)}%`,
      linhas: [
        { rotulo: "Renda do segurado", formula: rendaTexto, valor: brl(c.rendaMensal) },
        { rotulo: "Renda equivalente", formula: rendaEquivTexto, valor: brl(c.rendaEquiv) },
        { rotulo: "Renda familiar", formula: `segurado + cônjuge ${brl(c.rendaConjugeIncl)} + terceiros ${brl(c.terceirosIncl)}`, valor: brl(c.rendaFamiliar) },
        { rotulo: "Participação do segurado", formula: `${brl(c.rendaMensal)} ÷ ${brl(c.rendaFamiliar)}`, valor: `${Math.round(c.participacao * 100)}%` },
      ],
    },
    {
      grupo: "Cobertura vitalícia",
      cor: "#0F3D63",
      total: brl(c.vitalicia),
      linhas: [
        { rotulo: "Custo de transmissão", formula: `${brl(c.patrimonioTotal)} × ${dados.pctSucessao}%`, valor: brl(c.modSucessao) },
        { rotulo: "Um ano de renda", formula: `${brl(c.rendaMensal)} × 12`, valor: brl(c.modUmAnoRenda) },
      ],
    },
    {
      grupo: "Cobertura temporária",
      cor: "#1B72BE",
      total: brl(c.temporaria),
      linhas: [
        { rotulo: "Manutenção bruta", formula: `${brl(c.rendaEquiv)} × ${Math.round(c.participacao * 100)}% × ${dados.prazoManutencao * 12} meses`, valor: brl(c.necessidadeBruta) },
        { rotulo: "Menos receitas liquidáveis", formula: "liquidável + FGTS + INSS + previdência + seguro atual", valor: `− ${brl(c.receitasLiquidaveis)}` },
        { rotulo: "Teto de razoabilidade", formula: `${dados.teto} × ${brl(c.rendaAnual)}${c.tetoAtingido ? " — atingido" : " — não atingido"}`, valor: brl(c.teto) },
        { rotulo: "Mais objetivos incluídos", formula: objetivosTexto, valor: `+ ${brl(c.modObjetivos)}` },
      ],
    },
    {
      grupo: "Educação",
      cor: "#39CC00",
      total: `${brl(c.pensaoMensal)}/mês`,
      linhas: [
        { rotulo: "Despesa de hoje", formula: eduHojeTexto, valor: brl(c.eduHoje) },
        { rotulo: "Custo educacional total", formula: "por filho, por fase, até os 25 anos", valor: brl(c.custoEducacaoTotal) },
        { rotulo: "Pensão mensal", formula: `${brl(c.custoEducacaoTotal)} × ${Math.round(c.fatorPensao * 100)}% × ${Math.round(c.participacao * 100)}% ÷ ${dados.prazoPensao * 12} meses`, valor: brl(c.pensaoMensal) },
      ],
    },
    {
      grupo: "Invalidez e complementares",
      cor: "#D9A400",
      total: brl(c.invalidezAcidente),
      linhas: [
        { rotulo: "Invalidez por acidente", formula: `${brl(c.rendaMensal)} × 12 × 5 anos`, valor: brl(c.invalidezAcidente) },
        { rotulo: "Invalidez por doença", formula: "50% da invalidez por acidente", valor: brl(c.invalidezDoenca) },
        { rotulo: "Renda vitalícia por invalidez", formula: "50% da renda mensal", valor: c.rendaInvalidezVitalicia > 0 ? `${brl(c.rendaInvalidezVitalicia)}/mês` : "não se aplica" },
        { rotulo: "DIT", formula: "70% da renda mensal", valor: `${brl(c.dit)}/mês` },
        { rotulo: "Doenças graves", formula: "1,5 × a renda anual", valor: brl(c.doencasGraves) },
      ],
    },
  ];
}
