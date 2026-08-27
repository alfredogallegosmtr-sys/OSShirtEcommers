import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Convención: un parámetro/binding de catch prefijado con "_" es intencionalmente
      // no usado — ej. el "next" obligatorio por la arity de un error handler de Express,
      // o un catch que solo necesita el status/mensaje, no el objeto de error en sí.
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
    },
    files: ["tests/**/*.js"],
  },
  {
    ignores: ["node_modules/**", "coverage/**", "public/**"],
  },
];
