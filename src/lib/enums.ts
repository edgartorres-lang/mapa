/**
 * Valores fechados que no protótipo/glossário são "enum", mas no banco viraram `String`.
 *
 * Por quê: o schema roda em SQLite no desenvolvimento e Postgres em produção (mesmo
 * `prisma/schema.prisma`, ver `prisma.config.ts`) — e o conector SQLite do Prisma não suporta
 * `enum`. Em vez de manter dois schemas, o Edgar decidiu (2026-09-01) ajustar o campo: os valores
 * fechados vivem aqui, em TypeScript, e a coluna no banco é uma `String` simples validada pela
 * camada de aplicação. Ver AGENTS.md, seção "SQLite local × Postgres de produção".
 */

export const ESTAGIOS_FUNIL = [
  "lead",
  "estudo",
  "apresentado",
  "cotando",
  "fechado",
  "perdido",
] as const;
export type EstagioFunil = (typeof ESTAGIOS_FUNIL)[number];

export const LGPD_STATUS = ["aceito", "verbal", "pendente"] as const;
export type LgpdStatus = (typeof LGPD_STATUS)[number];

export const STATUS_ESTUDO = ["aberto", "gerado"] as const;
export type StatusEstudo = (typeof STATUS_ESTUDO)[number];

/** Canal do pedido de exclusão LGPD (ExclusaoLgpd.canal) — Ajustes → LGPD e retenção. */
export const CANAIS_LGPD = ["whatsapp", "email", "verbal"] as const;
export type CanalLgpd = (typeof CANAIS_LGPD)[number];

/**
 * Status comercial de um Mapa específico (Mapa.statusComercial), 2026-09-09 — diferente de
 * ESTAGIOS_FUNIL (que é por Cliente): resolve a ambiguidade de "fechado" não dizer qual dos
 * vários Mapas de um cliente foi fechado. Editar o do Mapa mais recente também atualiza
 * Cliente.estagioFunil — ver alterarStatusMapa em painel/clientes/[id]/actions.ts.
 */
export const STATUS_COMERCIAL_MAPA = ["criado", "apresentado", "negociando", "fechado", "descartado"] as const;
export type StatusComercialMapa = (typeof STATUS_COMERCIAL_MAPA)[number];

/**
 * "Se você ficasse um ano sem poder trabalhar, quem sustentaria a casa?" — pergunta de
 * percepção de risco. Vivia só no formulário público (lead-formulario.ts); 2026-09-09 virou
 * campo estruturado do cliente (Cliente.cenarioResposta) e passou a ser perguntada também no
 * wizard do corretor (Perfil.tsx) — texto idêntico nos dois lugares, fonte única aqui.
 */
export const CENARIOS_INVALIDEZ = [
  "Ninguém — a renda é toda minha",
  "Meu cônjuge, em parte",
  "Temos reservas para um tempo",
  "Não sei dizer",
] as const;
export type CenarioInvalidez = (typeof CENARIOS_INVALIDEZ)[number];
