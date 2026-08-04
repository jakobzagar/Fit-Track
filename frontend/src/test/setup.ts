import "@testing-library/jest-dom/vitest";
import {cleanup} from "@testing-library/react";
import {afterAll, afterEach, beforeAll, vi} from "vitest";
import {server} from "./mocks/server";

const storage = new Map<string, string>();
const localStorageMock: Storage = {
    get length() {
        return storage.size;
    },
    clear: () => storage.clear(),
    getItem: (key) => storage.get(key) ?? null,
    key: (index) => [...storage.keys()][index] ?? null,
    removeItem: (key) => storage.delete(key),
    setItem: (key, value) => storage.set(key, String(value)),
};

Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: localStorageMock,
});

beforeAll(() => server.listen({onUnhandledRequest: "error"}));

afterEach(() => {
    cleanup();
    server.resetHandlers();
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    document.querySelector('meta[name="theme-color"]')?.remove();
    vi.useRealTimers();
});

afterAll(() => server.close());
