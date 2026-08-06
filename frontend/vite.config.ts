import {defineConfig, loadEnv} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({mode}) => {
    const environment = loadEnv(mode, process.cwd(), "");

    return {
        plugins: [react(), tailwindcss()],

        resolve: {
            dedupe: ["react", "react-dom", "zod"],
        },

        build: {
            rolldownOptions: {
                output: {
                    codeSplitting: {
                        groups: [
                            {
                                name: "react-vendor",
                                test: /node_modules[\\/](react|react-dom|react-router)/,
                                priority: 20,
                            },
                            {
                                name: "validation-vendor",
                                test: /node_modules[\\/]zod/,
                                priority: 10,
                            },
                        ],
                    },
                },
            },
        },

        server: {
            port: 5173,
            strictPort: true,
            proxy: {
                "/api": {
                    target: environment.API_PROXY_TARGET ?? "http://localhost:3001",
                    changeOrigin: true,
                },
            },
        },
    };
});
