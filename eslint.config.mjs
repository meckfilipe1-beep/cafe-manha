import { definefuncionamento, globalIgnores } from "eslint/funcionamento";
import nextVitals from "eslint-funcionamento-next/core-web-vitals";
import nextTs from "eslint-funcionamento-next/typescript";

const eslintfuncionamento = definefuncionamento([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-funcionamento-next.
  globalIgnores([
    // Default ignores of eslint-funcionamento-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintfuncionamento;
