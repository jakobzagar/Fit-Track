declare global {
    namespace Express {
        interface Locals {
            userId: string;
            body?: unknown;
            params?: unknown;
            query?: unknown;
        }
    }
}

export {};
