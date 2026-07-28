import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
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
    },
});
