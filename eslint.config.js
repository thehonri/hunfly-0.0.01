import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "dist",
      "build",
      ".next",
      "node_modules",
      "extension/**",
      "src/**",
      "server.bak.ts",
      "vite.config.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"] ,
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Regra do repo: sem ruído agora enquanto estabiliza
      "@typescript-eslint/no-unused-vars": "off",
      "no-undef": "off",
      "no-unused-vars": "off",
      "no-case-declarations": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
];
