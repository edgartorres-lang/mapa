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
