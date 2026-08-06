import {defineConfig} from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    resolve: {
        dedupe: ["react", "react-dom", "zod"],
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./src/test/setup.ts"],
        restoreMocks: true,
        env: {
            VITE_API_URL: "/api",
        },
    },
});
