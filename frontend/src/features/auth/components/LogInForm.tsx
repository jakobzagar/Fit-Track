import {z} from "zod";
import {useId, useRef, useState, type SubmitEvent} from "react";
import {loginSchema, type LoginInput} from "../schemas/auth.schemas.ts";
import {Button} from "../../../components/ui/actions/Button";
import {FieldError} from "../../../components/ui/forms/FieldError";
import {
    focusFirstInvalidField,
    invalidFieldProps,
} from "../../../components/ui/forms/utils/formAccessibility";
import {apiValidationErrors} from "../../../components/ui/forms/utils/apiValidationErrors";

interface LoginFormProps {
    onSubmit: (data: LoginInput) => Promise<void>;
}

interface LoginErrors {
    email?: string;
    password?: string;
}

export function LoginForm({onSubmit}: LoginFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const id = useId();
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
            focusFirstInvalidField(formRef);

            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            await onSubmit(result.data);
        } catch (error) {
            const serverErrors = apiValidationErrors(error);
            if (serverErrors) {
                setErrors(serverErrors);
                focusFirstInvalidField(formRef);
            }
            return;
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form ref={formRef} className="form-stack" onSubmit={handleSubmit} noValidate>
            <label>
                Email
                <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    disabled={isSubmitting}
                    {...invalidFieldProps(errors.email, `${id}-email-error`)}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </label>
            <FieldError id={`${id}-email-error`}>{errors.email}</FieldError>

            <label>
                Password
                <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    disabled={isSubmitting}
                    {...invalidFieldProps(errors.password, `${id}-password-error`)}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </label>
            <FieldError id={`${id}-password-error`}>{errors.password}</FieldError>

            <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Log In"}
            </Button>
        </form>
    );
}
