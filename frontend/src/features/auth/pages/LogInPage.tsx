import {useState} from "react";
import {Link, useNavigate} from "react-router";
import {BrandMark} from "../../../components/ui/BrandMark";
import {Feedback} from "../../../components/ui/Feedback";
import {LoginForm} from "../components/LogInForm";
import {login} from "../api/auth.api";
import type {LoginInput} from "../schemas/auth.schemas";
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
            navigate("/workouts");
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Login failed");
            throw caughtError;
        }
    }

    return (
        <main className="auth-shell">
            <section className="auth-visual">
                <BrandMark linked={false} />
                <div className="relative z-10 max-w-2xl pb-12">
                    <p className="eyebrow">Track the work</p>
                    <h1 className="mt-5 max-w-xl text-[clamp(3rem,8vw,7rem)] font-black tracking-[-0.07em] text-cream uppercase leading-[0.8]">
                        Show up. <span className="text-flame">Log it.</span> Get stronger.
                    </h1>
                </div>
                <p className="relative z-10 text-[10px] font-bold tracking-[0.2em] text-dim uppercase">
                    No feeds. No hype. Just progress.
                </p>
            </section>

            <section className="auth-form-panel">
                <div className="auth-form-wrap">
                    <p className="eyebrow">Welcome back</p>
                    <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-cream">
                        Sign in
                    </h2>
                    <p className="mb-8 mt-3 text-sm text-dim">
                        Pick up exactly where you left off.
                    </p>
                    {error && (
                        <div className="mb-5">
                            <Feedback>{error}</Feedback>
                        </div>
                    )}
                    <LoginForm onSubmit={handleLogin} />
                    <p className="mt-7 text-center text-sm text-dim">
                        New here?{" "}
                        <Link
                            className="font-bold text-flame hover:text-flame-bright"
                            to="/register"
                        >
                            Create an account
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
