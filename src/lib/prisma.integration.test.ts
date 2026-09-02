import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { calc, FATORES_PADRAO, type EstudoDados } from "./calc";

/**
 * Teste de integração de verdade contra o banco configurado em DATABASE_URL (SQLite local por
 * padrão de desenvolvimento — ver .env.example e AGENTS.md).
 *
 * IMPORTANTE: isto prova que a lógica da aplicação (schema + Prisma Client + calc.ts) funciona.
 * Não prova o banco de produção. Antes de considerar a Etapa 2 fechada, os mesmos cenários
 * precisam passar de novo com DATABASE_URL apontando pro Postgres da VPS — ver AGENTS.md,
 * "SQLite local × Postgres de produção".
 */

const SUFIXO = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const EMAIL_TESTE = `teste-integracao-${SUFIXO}@setornorteseguros.com.br`;

let corretorId: string;

beforeAll(async () => {
  const corretor = await prisma.corretor.create({
    data: { nome: "Corretor de Teste", email: EMAIL_TESTE, senhaHash: "hash-fake-de-teste" },
  });
  corretorId = corretor.id;
});

afterAll(async () => {
  // Limpa tudo que este teste criou (cascade cuida de cliente/estudo/mapa dependurados).
  await prisma.corretor.deleteMany({ where: { email: EMAIL_TESTE } });
});

describe("Prisma + calc() — ciclo estudo em aberto → Mapa travado", () => {
  it("cria estudo em aberto guardando só dados crus", async () => {
    const dadosMarina: EstudoDados = {
      nasc: "12/07/1983",
      estadoCivil: "Casado(a)",
      vinculos: {
        clt: { on: true, renda: 6000 },
        servidor: { on: false, renda: 0 },
        autonomo: { on: true, renda: 9000 },
      },
      rendaConjuge: 4000,
      incluirConjuge: true,
      terceiros: [],
      temDep: true,
      deps: [{ nome: "Theo", nasc: "30/10/2011", rel: "Filho(a)" }],
      planoEdu: true,
      edu: { pre: 0, fund: 2000, medio: 2500, sup: 3200, pos: 0 },
      extras: [],
      prazoManutencao: 5,
      prazoPensao: 15,
      teto: 8,
      objetivos: [],
      bens: [{ desc: "Casa", tipo: "Imóvel", valor: 750000, liquidavel: false }],
      pctSucessao: 15,
      fgts: 25000,
      inss: 80000,
      prevPrivada: 45000,
      seguroAtual: 150000,
    };

    const cliente = await prisma.cliente.create({
      data: { corretorId, nome: "Marina Albuquerque (teste)", estagioFunil: "estudo" },
    });

    const estudo = await prisma.estudo.create({
      data: { clienteId: cliente.id, corretorId, dados: dadosMarina as object, status: "aberto" },
    });

    expect(estudo.status).toBe("aberto");
    expect(estudo.geradoEm).toBeNull();

    const lido = await prisma.estudo.findUniqueOrThrow({ where: { id: estudo.id } });
    expect((lido.dados as unknown as EstudoDados).vinculos.autonomo.renda).toBe(9000);
  });

  it("gera o Mapa travado com o snapshot de calc() e os fatores usados", async () => {
    const dados: EstudoDados = {
      nasc: "01/01/1980",
      estadoCivil: "Solteiro(a)",
      vinculos: { clt: { on: true, renda: 8000 }, servidor: { on: false, renda: 0 }, autonomo: { on: false, renda: 0 } },
      rendaConjuge: 0,
      incluirConjuge: false,
      terceiros: [],
      temDep: false,
      deps: [],
      planoEdu: false,
      edu: { pre: 0, fund: 0, medio: 0, sup: 0, pos: 0 },
      extras: [],
      prazoManutencao: 5,
      prazoPensao: 15,
      teto: 8,
      objetivos: [],
      bens: [],
      pctSucessao: 15,
      fgts: 0,
      inss: 0,
      prevPrivada: 0,
      seguroAtual: 0,
    };

    const cliente = await prisma.cliente.create({
      data: { corretorId, nome: "Cliente Solo (teste)", estagioFunil: "estudo" },
    });
    const estudo = await prisma.estudo.create({
      data: { clienteId: cliente.id, corretorId, dados: dados as object, status: "aberto" },
    });

    const resultado = calc(dados, FATORES_PADRAO, new Date(2026, 7, 31));

    const mapa = await prisma.$transaction(async (tx) => {
      const m = await tx.mapa.create({
        data: {
          estudoId: estudo.id,
          clienteId: cliente.id,
          corretorId,
          numeroVersao: 1,
          capitalAProteger: resultado.capitalAProteger,
          vitalicia: resultado.vitalicia,
          temporaria: resultado.temporaria,
          custoEducacionalTotal: resultado.custoEducacaoTotal,
          pensaoMensal: resultado.pensaoMensal,
          derivados: resultado as object,
          fatoresUsados: FATORES_PADRAO as object,
        },
      });
      await tx.estudo.update({
        where: { id: estudo.id },
        data: { status: "gerado", geradoEm: new Date() },
      });
      return m;
    });

    // vitalícia: patrimônio 0 × 15% + 12 meses de 8.000 = 96.000. Sem dependentes, temporária = 0.
    expect(mapa.vitalicia).toBe(96000);
    expect(mapa.temporaria).toBe(0);
    expect(mapa.capitalAProteger).toBeCloseTo(96000, 6);

    const estudoTravado = await prisma.estudo.findUniqueOrThrow({ where: { id: estudo.id } });
    expect(estudoTravado.status).toBe("gerado");

    // O snapshot em `derivados` preservou o cálculo completo, não só as 5 colunas de topo.
    const derivados = mapa.derivados as unknown as ReturnType<typeof calc>;
    expect(derivados.rendaMensal).toBe(8000);
  });

  it("um Estudo só gera um Mapa (1:1) — a segunda tentativa falha", async () => {
    const cliente = await prisma.cliente.create({ data: { corretorId, nome: "Cliente Único (teste)" } });
    const estudo = await prisma.estudo.create({
      data: {
        clienteId: cliente.id,
        corretorId,
        status: "gerado",
        dados: {} as object,
      },
    });
    const criarMapa = () =>
      prisma.mapa.create({
        data: {
          estudoId: estudo.id,
          clienteId: cliente.id,
          corretorId,
          numeroVersao: 1,
          capitalAProteger: 0,
          vitalicia: 0,
          temporaria: 0,
          custoEducacionalTotal: 0,
          pensaoMensal: 0,
          derivados: {} as object,
          fatoresUsados: {} as object,
        },
      });

    await criarMapa();
    await expect(criarMapa()).rejects.toThrow();
  });
});
