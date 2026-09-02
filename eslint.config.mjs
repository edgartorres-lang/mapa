import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Handoff de design: cópia de referência versionada junto do código (README.md, decisão
    // 2026-09-01), não é código da aplicação — .dc.html e support.js não seguem os padrões daqui.
    "design_handoff_mapa_protecao/**",
  ]),
]);

export default eslintConfig;
