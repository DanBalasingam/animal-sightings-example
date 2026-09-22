import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["build", ".react-router"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        {
          allowExportNames: [
            "meta",
            "links",
            "headers",
            "loader",
            "clientLoader",
            "action",
            "clientAction",
            "handle",
            "shouldRevalidate",
            "ErrorBoundary",
            "HydrateFallback",
            "Layout",
          ],
        },
      ],
    },
  },
]);
