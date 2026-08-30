import path from "node:path";
import {defineConfig, devices} from "@playwright/test";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const backendPort = process.env.E2E_BACKEND_PORT ?? "13002";
const frontendPort = process.env.E2E_FRONTEND_PORT ?? "15173";
const backendUrl = `http://127.0.0.1:${backendPort}`;
const frontendUrl = `http://127.0.0.1:${frontendPort}`;

export default defineConfig({
    testDir: "./e2e",
    outputDir: "./test-results",
    fullyParallel: false,
    workers: process.env.CI ? 1 : undefined,
    retries: process.env.CI ? 1 : 0,
    reporter: [["line"], ["html", {open: "never", outputFolder: "playwright-report"}]],
    use: {
        baseURL: frontendUrl,
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
    webServer: [
        {
            name: "backend",
            command: "npm exec --workspace @fit-track/backend -- tsx src/server.ts",
            cwd: repositoryRoot,
            url: `${backendUrl}/api/health/ready`,
            reuseExistingServer: false,
            timeout: 120_000,
            stdout: "ignore",
            stderr: "pipe",
        },
        {
            name: "frontend",
            command: `npm exec --workspace @fit-track/frontend -- vite --host 127.0.0.1 --port ${frontendPort}`,
            cwd: repositoryRoot,
            url: frontendUrl,
            reuseExistingServer: false,
            timeout: 120_000,
            stdout: "ignore",
            stderr: "pipe",
        },
    ],
    projects: [
        {
            name: "chromium",
            use: {...devices["Desktop Chrome"]},
        },
    ],
});
