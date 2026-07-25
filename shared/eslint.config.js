import js from "@eslint/js";
import tseslint from "typescript-eslint";
import {defineConfig, globalIgnores} from "eslint/config";

export default defineConfig([
    globalIgnores(["dist", "coverage"]),
    {
        files: ["src/**/*.ts"],
        extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
]);
