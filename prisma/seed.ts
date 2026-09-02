import "dotenv/config";
import { prisma } from "../src/lib/prisma";

/**
 * Semeia o corretor único da V1 (Edgar) com os fatores de cálculo padrão e os horários
 * sugeridos padrão. Idempotente: roda de novo sem duplicar (upsert pelo e-mail).
 *
 * V1 ainda não tem login (Etapa "Acesso e Identidade" não construída) — este é o único
 * corretor que existe, e o resto do app assume que ele é "o" corretor até haver autenticação.
 */
async function main() {
  const email = "edgartorres@setornorteseguros.com.br";

  const corretor = await prisma.corretor.upsert({
    where: { email },
    update: {},
    create: {
      nome: "Edgar Torres",
      email,
      senhaHash: "sem-senha-ainda", // Acesso e Identidade (login) não existe nesta etapa
      cargo: "Consultor de proteção familiar",
      corretora: "Setor Norte Seguros",
      susep: "SUSEP 202087923",
      whatsapp: "(96) 98133-9955",
      emailContato: "contato@setornorteseguros.com.br",
      razaoSocial: "Torres Norte Corretora de Seguros Ltda · CNPJ 11.903.619/0001-22",
    },
  });

  await prisma.fatoresCalculo.upsert({
    where: { corretorId: corretor.id },
    update: {},
    create: { corretorId: corretor.id }, // todos os campos têm @default no schema
  });

  const horarios: { ordem: number; diaRelativo: string; hora: string; duracaoMin: number }[] = [
    { ordem: 1, diaRelativo: "amanha", hora: "15:00", duracaoMin: 45 },
    { ordem: 2, diaRelativo: "depois_de_amanha", hora: "09:00", duracaoMin: 45 },
    { ordem: 3, diaRelativo: "depois_de_amanha", hora: "16:00", duracaoMin: 45 },
  ];
  for (const h of horarios) {
    await prisma.horarioSugerido.upsert({
      where: { corretorId_ordem: { corretorId: corretor.id, ordem: h.ordem } },
      update: h,
      create: { corretorId: corretor.id, ...h },
    });
  }

  console.log(`Corretor pronto: ${corretor.nome} <${corretor.email}> (id ${corretor.id})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
