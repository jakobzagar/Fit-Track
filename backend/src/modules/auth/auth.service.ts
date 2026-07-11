import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {prisma} from "../../db/prisma.js";
import {env} from "../../config/env.js";
import type {RegisterInput, LoginInput} from "./auth.schema.js";
import {AppError} from "../../common/errors/app.error.js";

function createToken(userId: string) {
    return jwt.sign({userId}, env.jwtSecret, {
        expiresIn: "7d",
    });
}

export async function registerService(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
        where: {email: data.email},
    });

    if (existingUser) {
        throw new AppError("User already exists", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const newUser = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            passwordHash,
        },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    const token = createToken(newUser.id);

    return {
        user: newUser,
        token,
    };
}

export async function loginService(data: LoginInput) {
    const user = await prisma.user.findUnique({
        where: {email: data.email},
    });

    if (!user) {
        throw new AppError("Email or password is incorrect", 401);
    }

    const validPassword = await bcrypt.compare(data.password, user.passwordHash);

    if (!validPassword) {
        throw new AppError("Email or password is incorrect", 401);
    }

    const token = createToken(user.id);
    const {passwordHash, ...safeUser} = user;

    return {
        user: safeUser,
        token,
    };
}

export async function getMeService(userId: string) {
    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new AppError("User does not exist", 404);
    }

    return user;
}
