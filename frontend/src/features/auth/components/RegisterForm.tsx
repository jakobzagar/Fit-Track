import {z} from "zod";
import {useState, type SubmitEvent} from "react";
import {registerSchema, type RegisterInput} from "../schemas/auth.schemas";
import {Button} from "../../../components/ui/Button";

interface RegisterFormProps {
    onSubmit: (data: RegisterInput) => Promise<void>;
}

interface RegisterErrors {
    name?: string;
    email?: string;
    password?: string;
}

export function RegisterForm({onSubmit}: RegisterFormProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [errors, setErrors] = useState<RegisterErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const result = registerSchema.safeParse({
            name,
            email,
            password,
        });

        if (!result.success) {
            const fieldErrors = z.flattenError(result.error).fieldErrors;

            setErrors({
                name: fieldErrors.name?.[0],
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
        <form className="form-stack" onSubmit={handleSubmit} noValidate>
            <label>
                Name
                <input
                    autoComplete="name"
                    value={name}
                    disabled={isSubmitting}
                    onChange={(event) => setName(event.target.value)}
                />
            </label>
            {errors.name && <p>{errors.name}</p>}

            <label>
                Email
                <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    disabled={isSubmitting}
                    onChange={(event) => setEmail(event.target.value)}
                />
            </label>
            {errors.email && <p>{errors.email}</p>}

            <label>
                Password
                <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    disabled={isSubmitting}
                    onChange={(event) => setPassword(event.target.value)}
                />
            </label>
            {errors.password && <p>{errors.password}</p>}

            <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register"}
            </Button>
        </form>
    );
}
