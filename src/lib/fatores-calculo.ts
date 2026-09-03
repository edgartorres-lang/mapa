import type { FatoresCalculo as FatoresCalculoDb } from "@prisma/client";
import type { FatoresCalculo } from "./calc";

/**
 * Traduz a linha `FatoresCalculo` do banco (por corretor, editável em Ajustes) pros únicos
 * cinco valores que `calc()` de fato lê via o parâmetro `fatores` — ver src/lib/calc.ts.
 *
 * Nota pro Edgar, pra quando eu construir Ajustes (Etapa 6): no protótipo original, os campos
 * `pctInvalidezDoenca` e `pctRendaInvalidez` aparecem na tela de Fatores de cálculo como
 * editáveis, mas o método `calc()` nunca os lê — ele soma 50% fixo nos dois casos
 * (`capitalInvalidezDoenca = capitalInvalidezAcidente * 0.5`). Portei o `calc()` fiel ao que ele
 * de fato faz (fonte da verdade é o código, não a tela), então esses dois campos existem no
 * schema e na UI de Ajustes, mas hoje não mudam nenhum número. Avisar antes de a tela deixar
 * alguém achar que editá-los muda o resultado.
 */
export function paraFatoresCalc(
  f: Pick<FatoresCalculoDb, "fatorAutonomo" | "fatorPensaoServidor" | "anosInvalidez" | "fatorDoencasGraves" | "pctDit">,
): FatoresCalculo {
  return {
    fatorAutonomo: f.fatorAutonomo,
    fatorPensaoServidor: f.fatorPensaoServidor,
    anosInvalidez: f.anosInvalidez,
    fatorDoencasGraves: f.fatorDoencasGraves,
    fatorDIT: f.pctDit / 100,
  };
}

/** Os quatro números que ficam gravados em `Estudo.dados` (editáveis por estudo, a partir do
 * padrão do corretor) — não fazem parte de `FatoresCalculo` do jeito que `calc()` usa. */
export function padroesPorEstudo(f: FatoresCalculoDb) {
  return {
    pctSucessao: f.pctCustoTransmissao,
    prazoManutencao: f.prazoManutencaoAnos,
    teto: f.tetoMultiplicador,
    prazoPensao: f.prazoPensaoAnosPadrao,
  };
}
