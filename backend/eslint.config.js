import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import {defineConfig, globalIgnores} from "eslint/config";

export default defineConfig([
    globalIgnores(["dist", "generated", "coverage"]),
    {
        files: ["src/**/*.ts"],
        extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            globals: globals.node,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ],
        },
    },
    {
        files: ["prisma.config.ts"],
        extends: [js.configs.recommended, tseslint.configs.recommended],
        languageOptions: {
            globals: globals.node,
        },
    },
]);
