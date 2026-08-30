import {z, flattenError} from "zod";

const envSchema = z.object({
    VITE_API_BASE_PATH: z.literal("/api", {
        error: "VITE_API_BASE_PATH must be /api",
    }),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
    console.error("Invalid environment variables");
    console.error(flattenError(parsedEnv.error).fieldErrors);
    throw new Error("Invalid frontend environment variables");
}

export const env = {
    apiBasePath: parsedEnv.data.VITE_API_BASE_PATH,
};
