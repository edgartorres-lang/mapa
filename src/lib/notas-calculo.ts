import type { CalcResultado } from "./calc";
import { brl } from "./formato";

/**
 * Texto explicativo da Pensão de Criação, usado em três lugares (Resultado.tsx, apresentacao.ts,
 * memoria-calculo.ts) — centralizado aqui pra garantir que os três sempre digam exatamente a
 * mesma coisa, e principalmente pra corrigir um problema real (2026-09-07, achado pelo Edgar): a
 * versão antiga mostrava os percentuais ARREDONDADOS (ex.: "45%") mas calculava com a fração
 * exata (ex.: 45,4545...%) — quem conferisse a conta na calculadora, exatamente como estava
 * escrita na tela, batia num valor diferente do mostrado. Isso mina a credibilidade que o próprio
 * corretor apontou como o que mais ajuda a vender: "todo valor encontrado tem justificativa".
 *
 * Aqui cada passo mostra o valor em REAIS de verdade (não só o percentual) — o próximo passo é
 * sempre calculado a partir do reais do passo anterior, nunca do percentual arredondado exibido.
 * Assim a corrente de valores sempre bate, mesmo que o percentual ao lado esteja arredondado pra
 * leitura.
 */
export function notaPensaoCriacao(c: CalcResultado): string {
  const partes: string[] = [`${brl(c.custoEducacaoTotal)} de custo de criação`];

  let valor = c.custoEducacaoTotal;
  if (c.fatorPensao < 1) {
    valor *= c.fatorPensao;
    partes.push(`× ${(c.fatorPensao * 100).toFixed(1)}% (parte já coberta por pensão automática do RPPS) = ${brl(valor)}`);
  }

  valor *= c.participacao;
  partes.push(`× ${(c.participacao * 100).toFixed(1)}% de participação na renda = ${brl(valor)}`);

  return `${partes.join(", ")}, diluídos em ${c.prazoPensao} anos (÷ ${c.prazoPensao * 12} meses) = ${brl(c.pensaoMensal)}/mês. Média sem diluição: ${brl(c.mediaAteFormar)}/mês até a formação.`;
}

/** Texto explicativo da proteção temporária — desde a correção de 2026-09-07 (ver calc.ts,
 * comentário em "necessidadeBruta"), não multiplica mais por participação: a renda ajustada do
 * segurado já é o valor a substituir, cheio, mesma lógica da vitalícia. */
export function notaTemporaria(c: CalcResultado, prazoManutencaoAnos: number): string {
  if (!c.temDep) return "Sem dependentes financeiros; entra apenas o valor de projetos e objetivos.";
  const meses = prazoManutencaoAnos * 12;
  const base = `${brl(c.rendaEquiv)} de renda ajustada × ${meses} meses = ${brl(c.necessidadeBruta)}, menos ${brl(c.receitasLiquidaveis)} de receitas liquidáveis`;
  return c.modObjetivos > 0 ? `${base}, mais ${brl(c.modObjetivos)} de projetos e objetivos.` : `${base}.`;
}
