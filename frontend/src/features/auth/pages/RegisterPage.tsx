import {useState} from "react";
import {RegisterForm} from "../components/RegisterForm";
import {register} from "../api/auth.api";
import type {RegisterInput} from "../schemas/auth.schemas";
import type {AuthResponse} from "../auth.types";
import {Link} from "react-router";
import {useNavigate} from "react-router";
import {useAuth} from "../hooks/useAuth.ts";

export function RegisterPage() {
    const navigate = useNavigate();
    const {setUser} = useAuth();

    const [error, setError] = useState("");

    async function handleRegister(data: RegisterInput) {
        setError("");

        try {
            const response: AuthResponse = await register(data);
            setUser(response.user);
            navigate("/exercises");
        } catch (error) {
            setError(error instanceof Error ? error.message : "Registration failed");
            throw error;
        }
    }

    return (
        <main>
            <h1>Register</h1>

            <RegisterForm onSubmit={handleRegister} />

            <p>
                Already have an account? <Link to="/login">Log in</Link>
            </p>

            {error && <p>{error}</p>}
        </main>
    );
}
