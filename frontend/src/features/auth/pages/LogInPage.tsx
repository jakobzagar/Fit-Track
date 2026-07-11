import {useState} from "react";
import {LoginForm} from "../components/LogInForm";
import {login} from "../api/auth.api";
import type {LoginInput} from "../schemas/auth.schemas";
import {Link} from "react-router";
import {useNavigate} from "react-router";
import {useAuth} from "../hooks/useAuth.ts";

export function LoginPage() {
    const navigate = useNavigate();
    const {setUser} = useAuth();

    const [error, setError] = useState("");

    async function handleLogin(data: LoginInput) {
        setError("");

        try {
            const response = await login(data);
            setUser(response.user);
            navigate("/exercises");
        } catch (error) {
            setError(error instanceof Error ? error.message : "Login failed");
            throw error;
        }
    }

    return (
        <main>
            <h1>Login</h1>
            <LoginForm onSubmit={handleLogin} />

            <p>
                Don't have an account? <Link to="/register">Register</Link>
            </p>

            {error && <p>{error}</p>}
        </main>
    );
}
