import eslint from "@eslint/js";
import { globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";
import tseslint, { configs as tseslintConfigs } from "typescript-eslint";

export default tseslint.config(
  globalIgnores(["dist"]),
  eslint.configs.recommended,
  tseslintConfigs.recommended,
  {
    files: ["**/*.ts"],
    extends: [
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],
    settings: {
      "import/resolver": {
        typescript: true,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "import/order": [
        "error",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
  {
    files: ["client/**/*.ts"],
    settings: {
      "import/resolver": {
        typescript: { project: "./client/tsconfig.json" },
      },
    },
  },
  eslintConfigPrettier,
);
