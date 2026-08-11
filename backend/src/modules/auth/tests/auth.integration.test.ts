import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request, {type Response} from "supertest";
import {describe, expect, it} from "vitest";
import {authResponseSchema} from "@fit-track/shared/auth";
import {messageResponseSchema, validationErrorResponseSchema} from "@fit-track/shared/common";
import {app} from "../../../app.js";
import {env} from "../../../config/env.js";
import {prisma} from "../../../db/prisma.js";

const origin = env.clientUrl;
const password = "test-password";
const registration = {
    name: "Test User",
    email: "test@example.com",
    password,
};

const post = (path: string) => request(app).post(path).set("Origin", origin);

const getSetCookie = (response: Response) => {
    const header = response.headers["set-cookie"] as unknown;

    if (!Array.isArray(header) || typeof header[0] !== "string") {
        throw new Error("Expected the response to contain a Set-Cookie header.");
    }

    return header[0];
};

const createUser = async () =>
    prisma.user.create({
        data: {
            name: registration.name,
            email: registration.email,
            passwordHash: await bcrypt.hash(password, 4),
        },
    });

describe("POST /api/auth/register", () => {
    it("normalizes and stores a user, then sets the authentication cookie", async () => {
        const response = await post("/api/auth/register").send({
            ...registration,
            name: `  ${registration.name}  `,
            email: "  TEST@EXAMPLE.COM  ",
        });
        const body = authResponseSchema.parse(response.body);
        const storedUser = await prisma.user.findUniqueOrThrow({
            where: {email: registration.email},
        });
        const cookie = getSetCookie(response);

        expect(response.status).toBe(201);
        expect(body.user).toMatchObject({
            name: registration.name,
            email: registration.email,
        });
        expect(body.user).not.toHaveProperty("passwordHash");
        expect(storedUser.passwordHash).not.toBe(password);
        await expect(bcrypt.compare(password, storedUser.passwordHash)).resolves.toBe(true);
        expect(cookie).toContain("token=");
        expect(cookie).toContain("HttpOnly");
        expect(cookie).toContain("SameSite=Lax");
        expect(cookie).toContain("Path=/");
        expect(cookie).not.toContain("Secure");
    });

    it("rejects an email that is already registered", async () => {
        await createUser();

        const response = await post("/api/auth/register").send(registration);

        expect(response.status).toBe(409);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "User already exists",
        });
        expect(await prisma.user.count()).toBe(1);
    });

    it("rejects invalid registration data without storing a user", async () => {
        const response = await post("/api/auth/register").send({
            name: "",
            email: "invalid-email",
            password: "short",
        });

        expect(response.status).toBe(400);
        expect(validationErrorResponseSchema.parse(response.body)).toEqual({
            message: "Validation failed",
            errors: {
                name: ["Name is required"],
                email: ["Invalid email address"],
                password: ["Password must be at least 8 characters"],
            },
        });
        expect(await prisma.user.count()).toBe(0);
    });
});

describe("POST /api/auth/login", () => {
    it("authenticates normalized credentials without exposing the password hash", async () => {
        await createUser();

        const response = await post("/api/auth/login").send({
            email: "  TEST@EXAMPLE.COM  ",
            password,
        });
        const body = authResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body.user.email).toBe(registration.email);
        expect(body.user).not.toHaveProperty("passwordHash");
        expect(getSetCookie(response)).toContain("HttpOnly");
    });

    it.each([
        ["an incorrect password", registration.email, "incorrect-password"],
        ["an unknown email", "unknown@example.com", password],
    ])("rejects %s with the same response", async (_case, email, attemptedPassword) => {
        await createUser();

        const response = await post("/api/auth/login").send({
            email,
            password: attemptedPassword,
        });

        expect(response.status).toBe(401);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Email or password is incorrect",
        });
        expect(response.headers).not.toHaveProperty("set-cookie");
    });

    it("rejects invalid login data", async () => {
        const response = await post("/api/auth/login").send({
            email: "invalid-email",
            password: "",
        });

        expect(response.status).toBe(400);
        expect(validationErrorResponseSchema.parse(response.body)).toEqual({
            message: "Validation failed",
            errors: {
                email: ["Invalid email address"],
                password: ["Password is required"],
            },
        });
    });
});

describe("GET /api/auth/me", () => {
    it("returns the authenticated user from a valid cookie", async () => {
        const user = await createUser();
        const token = jwt.sign({userId: user.id}, env.jwtSecret, {expiresIn: "7d"});

        const response = await request(app).get("/api/auth/me").set("Cookie", `token=${token}`);
        const body = authResponseSchema.parse(response.body);

        expect(response.status).toBe(200);
        expect(body.user).toMatchObject({id: user.id, email: user.email});
        expect(body.user).not.toHaveProperty("passwordHash");
    });

    it("requires an authentication cookie", async () => {
        const response = await request(app).get("/api/auth/me");

        expect(response.status).toBe(401);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Authentication required",
        });
    });

    it("rejects an invalid token", async () => {
        const response = await request(app)
            .get("/api/auth/me")
            .set("Cookie", "token=invalid-token");

        expect(response.status).toBe(401);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Invalid or expired token",
        });
    });

    it("rejects a session whose user no longer exists", async () => {
        const token = jwt.sign({userId: crypto.randomUUID()}, env.jwtSecret, {expiresIn: "7d"});

        const response = await request(app).get("/api/auth/me").set("Cookie", `token=${token}`);

        expect(response.status).toBe(401);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Authentication required",
        });
    });
});

describe("POST /api/auth/logout", () => {
    it("clears the cookie and ends an authenticated agent session", async () => {
        await createUser();
        const agent = request.agent(app);

        await agent
            .post("/api/auth/login")
            .set("Origin", origin)
            .send({email: registration.email, password})
            .expect(200);

        const response = await agent.post("/api/auth/logout").set("Origin", origin);

        expect(response.status).toBe(200);
        expect(messageResponseSchema.parse(response.body)).toEqual({message: "Logged out"});
        expect(getSetCookie(response)).toContain("token=;");
        await agent.get("/api/auth/me").expect(401);
    });

    it("also succeeds without an existing session", async () => {
        const response = await post("/api/auth/logout");

        expect(response.status).toBe(200);
        expect(messageResponseSchema.parse(response.body)).toEqual({message: "Logged out"});
        expect(getSetCookie(response)).toContain("token=;");
    });
});

describe("authentication CSRF protection", () => {
    it("rejects a state-changing request from an untrusted origin", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .set("Origin", "https://attacker.example")
            .send(registration);

        expect(response.status).toBe(403);
        expect(messageResponseSchema.parse(response.body)).toEqual({
            message: "Invalid request origin",
        });
        expect(await prisma.user.count()).toBe(0);
    });
});
