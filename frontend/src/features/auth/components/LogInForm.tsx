import {z} from "zod";
import {useState, type SubmitEvent} from "react";
import {loginSchema, type LoginInput} from "../schemas/auth.schemas.ts";

interface LoginFormProps {
    onSubmit: (data: LoginInput) => Promise<void>;
}

interface LoginErrors {
    email?: string;
    password?: string;
}

export function LoginForm({onSubmit}: LoginFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [errors, setErrors] = useState<LoginErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const result = loginSchema.safeParse({
            email,
            password,
        });

        if (!result.success) {
            const fieldErrors = z.flattenError(result.error).fieldErrors;

            setErrors({
                email: fieldErrors.email?.[0],
                password: fieldErrors.password?.[0],
            });

            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            await onSubmit(result.data);
        } catch {
            return;
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} noValidate>
            <label>
                Email
                <input
                    type="email"
                    value={email}
                    disabled={isSubmitting}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </label>
            {errors.email && <p>{errors.email}</p>}

            <label>
                Password
                <input
                    type="password"
                    value={password}
                    disabled={isSubmitting}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </label>
            {errors.password && <p>{errors.password}</p>}

            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Log In"}
            </button>
        </form>
    );
}
