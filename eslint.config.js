import js from "@eslint/js";
import prettier from "eslint-plugin-prettier";
import babelParser from "@babel/eslint-parser";
import globals from "globals";
import eslintJsonc from "eslint-plugin-jsonc";
import eslintJsoncParser from "jsonc-eslint-parser";

export default [
  {
    // global ignores
    // folders can only be ignored at the global level, per-cfg you must do: '**/dist/**/*'
    ignores: ["**/node_modules/"],
  },
  // general defaults
  js.configs.recommended,
  {
    files: ["**/*.js"],
    rules: {
      "prettier/prettier": [
        "error",
        {},
        {
          usePrettierrc: true,
        },
      ],
      "no-console": "warn",
    },
    plugins: {
      prettier,
    },
    languageOptions: {
      parser: babelParser,
      ecmaVersion: 2018,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.greasemonkey,
      },
      parserOptions: {
        requireConfigFile: false,
        allowImportExportEverywhere: true,

        ecmaFeatures: {
          experimentalObjectRestSpread: true,
        },
      },
    },
  },
  {
    files: ["**/*.json"],
    ignores: ["**/package.json", "**/package-lock.json"],
    plugins: {
      jsonc: eslintJsonc,
      prettier,
    },
    languageOptions: {
      parser: eslintJsoncParser,
      parserOptions: {
        jsonSyntax: "JSON",
      },
    },
    rules: {
      "prettier/prettier": [
        "error",
        {},
        {
          usePrettierrc: true,
        },
      ],
      "no-console": "warn",
    },
  },
];
