import {z} from "zod";
import {useId, useRef, useState, type SubmitEvent} from "react";
import {registerSchema, type RegisterInput} from "@fit-track/shared/auth";
import {Button} from "../../../components/ui/actions/Button";
import {FieldError} from "../../../components/ui/forms/FieldError";
import {
    focusFirstInvalidField,
    invalidFieldProps,
} from "../../../components/ui/forms/utils/formAccessibility";
import {apiValidationErrors} from "../../../components/ui/forms/utils/apiValidationErrors";

interface RegisterFormProps {
    onSubmit: (data: RegisterInput) => Promise<void>;
}

interface RegisterErrors {
    name?: string;
    email?: string;
    password?: string;
}

export function RegisterForm({onSubmit}: RegisterFormProps) {
    const formRef = useRef<HTMLFormElement>(null);
    const id = useId();
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
                Name
                <input
                    autoComplete="name"
                    value={name}
                    disabled={isSubmitting}
                    {...invalidFieldProps(errors.name, `${id}-name-error`)}
                    onChange={(event) => setName(event.target.value)}
                />
            </label>
            <FieldError id={`${id}-name-error`}>{errors.name}</FieldError>

            <label>
                Email
                <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    disabled={isSubmitting}
                    {...invalidFieldProps(errors.email, `${id}-email-error`)}
                    onChange={(event) => setEmail(event.target.value)}
                />
            </label>
            <FieldError id={`${id}-email-error`}>{errors.email}</FieldError>

            <label>
                Password
                <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    disabled={isSubmitting}
                    {...invalidFieldProps(errors.password, `${id}-password-error`)}
                    onChange={(event) => setPassword(event.target.value)}
                />
            </label>
            <FieldError id={`${id}-password-error`}>{errors.password}</FieldError>

            <Button type="submit" size="lg" fullWidth disabled={isSubmitting}>
                {isSubmitting ? "Registering..." : "Register"}
            </Button>
        </form>
    );
}
