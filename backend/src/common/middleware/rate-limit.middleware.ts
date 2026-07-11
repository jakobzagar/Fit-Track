import {rateLimit} from "express-rate-limit";

const rateLimitHeaders = {
    standardHeaders: "draft-8" as const,
    legacyHeaders: false,
};

export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    identifier: "api",
    ...rateLimitHeaders,
    skip: (req) => req.method === "OPTIONS",
    message: {
        message: "Too many requests. Please try again later",
    },
});

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    identifier: "login",
    ...rateLimitHeaders,
    skipSuccessfulRequests: true,
    message: {
        message: "Too many failed login attempts. Please try again later",
    },
});

export const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    identifier: "register",
    ...rateLimitHeaders,
    message: {
        message: "Too many registration attempts. Please try again later",
    },
});
