import {z, flattenError} from "zod";

const envSchema = z.object({
    VITE_API_URL: z.url("VITE_API_URL must be a valid URL"),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
    console.error("Invalid environment variables");
    console.error(flattenError(parsedEnv.error).fieldErrors);
    throw new Error("Invalid frontend environment variables");
}

export const env = {
    apiUrl: parsedEnv.data.VITE_API_URL,
};
