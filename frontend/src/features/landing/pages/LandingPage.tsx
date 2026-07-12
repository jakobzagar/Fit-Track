import {Link} from "react-router";
import {BrandMark} from "../../../components/ui/BrandMark";
import {Icon} from "../../../components/ui/Icon";
import {useAuth} from "../../auth/hooks/useAuth";
import {Footer} from "../../../components/layout/Footer";

const features = [
    {
        title: "Build your workouts",
        description: "Create focused training plans and keep every exercise in one clear place.",
        icon: "workout" as const,
    },
    {
        title: "Track every set",
        description: "Log reps and weight while you train, without interrupting your momentum.",
        icon: "exercise" as const,
    },
    {
        title: "Keep progressing",
        description: "Return to your workout history and make every next session count.",
        icon: "arrow" as const,
    },
];

export function LandingPage() {
    const {user} = useAuth();
    const primaryPath = user ? "/workouts" : "/register";
    const primaryLabel = user ? "Open dashboard" : "Start training";

    return (
        <main id="top" className="landing-shell">
            <header className="landing-nav">
                <BrandMark linked={false} />
                <div className="flex items-center gap-2 sm:gap-3">
                    {!user && (
                        <Link className="landing-link-muted" to="/login">
                            Log in
                        </Link>
                    )}
                    <Link className="landing-button landing-button-small" to={primaryPath}>
                        {user ? "Dashboard" : "Get started"}
                    </Link>
                </div>
            </header>

            <section className="landing-hero">
                <div className="landing-hero-copy">
                    <p className="eyebrow">Your training. Organized.</p>
                    <h1>
                        Train with
                        <br />
                        <span>purpose.</span>
                    </h1>
                    <p className="landing-lead">
                        Plan workouts, track every set and build consistency—all in one focused
                        training space.
                    </p>
                    <div className="landing-actions">
                        <Link className="landing-button" to={primaryPath}>
                            {primaryLabel}
                            <Icon name="arrow" size={18} />
                        </Link>
                        {!user && (
                            <Link className="landing-button landing-button-secondary" to="/login">
                                Log in
                            </Link>
                        )}
                    </div>
                </div>

                <div className="landing-preview" aria-label="FitTrack workout preview">
                    <div className="landing-preview-glow" />
                    <div className="landing-dashboard-card">
                        <span className="absolute inset-y-0 left-0 w-1 bg-flame" />
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="inline-flex rounded-full border border-flame/40 bg-flame/10 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] text-flame uppercase">
                                    Active
                                </span>
                                <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-cream">
                                    Upper body
                                </h2>
                            </div>
                            <div className="text-right">
                                <p className="metric-number text-2xl font-black text-flame">6</p>
                                <p className="text-[10px] tracking-[0.1em] text-dim uppercase">
                                    Exercises
                                </p>
                            </div>
                        </div>
                        <p className="mt-3 text-xs font-semibold tracking-[0.05em] text-dim uppercase">
                            12 Jul 2026
                        </p>
                        <p className="mt-4 text-sm leading-6 text-dim">
                            Chest, shoulders and back with controlled working sets.
                        </p>
                        <div className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-4">
                            <span className="inline-flex min-h-10 items-center justify-center gap-1 rounded-[9px] border border-flame bg-flame px-2 text-center text-xs font-extrabold tracking-[0.04em] text-ink uppercase">
                                <Icon name="arrow" size={15} /> Continue workout
                            </span>
                            <span className="inline-flex min-h-10 items-center justify-center gap-1 rounded-[9px] px-2 text-xs font-extrabold tracking-[0.04em] text-dim uppercase">
                                <Icon name="edit" size={14} /> Edit
                            </span>
                            <span className="inline-flex min-h-10 items-center justify-center gap-1 rounded-[9px] border border-negative/20 bg-negative/8 px-2 text-xs font-extrabold tracking-[0.04em] text-negative uppercase">
                                <Icon name="trash" size={16} /> Delete
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="landing-features" aria-labelledby="features-heading">
                <div className="landing-section-heading">
                    <p className="eyebrow">Built for consistency</p>
                    <h2 id="features-heading">Everything your workout needs.</h2>
                </div>
                <div className="landing-feature-grid">
                    {features.map((feature) => (
                        <article key={feature.title} className="landing-feature-card">
                            <div className="landing-feature-meta">
                                <span>
                                    <Icon name={feature.icon} size={21} />
                                </span>
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="landing-cta">
                <p className="eyebrow">Your next session starts here</p>
                <h2>Ready to put in the work?</h2>
                <Link className="landing-button" to={primaryPath}>
                    {primaryLabel}
                    <Icon name="arrow" size={18} />
                </Link>
            </section>

            <Footer variant="landing" />
        </main>
    );
}
