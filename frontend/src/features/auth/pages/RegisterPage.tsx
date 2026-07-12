import {useState} from "react";
import {Link, useNavigate} from "react-router";
import {BrandMark} from "../../../components/ui/BrandMark";
import {Feedback} from "../../../components/ui/Feedback";
import {RegisterForm} from "../components/RegisterForm";
import {register} from "../api/auth.api";
import type {RegisterInput} from "../schemas/auth.schemas";
import {useAuth} from "../hooks/useAuth.ts";

export function RegisterPage() {
    const navigate = useNavigate();
    const {setUser} = useAuth();
    const [error, setError] = useState("");

    async function handleRegister(data: RegisterInput) {
        setError("");
        try {
            const response = await register(data);
            setUser(response.user);
            navigate("/workouts");
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Registration failed");
            throw caughtError;
        }
    }

    return (
        <main className="auth-shell">
            <section className="auth-visual">
                <BrandMark linked={false} />
                <div className="relative z-10 max-w-2xl pb-12">
                    <p className="eyebrow">Build your record</p>
                    <h1 className="mt-5 max-w-xl text-[clamp(3rem,8vw,7rem)] font-black tracking-[-0.07em] text-cream uppercase leading-[0.8]">
                        Every set <span className="text-flame">counts.</span>
                    </h1>
                    <p className="mt-7 max-w-md text-sm leading-7 text-dim">
                        Your strongest training block starts with a clean record of the work you
                        actually do.
                    </p>
                </div>
                <p className="relative z-10 text-[10px] font-bold tracking-[0.2em] text-dim uppercase">
                    Simple by design. Serious in practice.
                </p>
            </section>

            <section className="auth-form-panel">
                <div className="auth-form-wrap">
                    <p className="eyebrow">Start training</p>
                    <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-cream">
                        Create account
                    </h2>
                    <p className="mb-8 mt-3 text-sm text-dim">Set up your private training log.</p>
                    {error && (
                        <div className="mb-5">
                            <Feedback>{error}</Feedback>
                        </div>
                    )}
                    <RegisterForm onSubmit={handleRegister} />
                    <p className="mt-7 text-center text-sm text-dim">
                        Already training with us?{" "}
                        <Link className="font-bold text-flame hover:text-flame-bright" to="/login">
                            Sign in
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
