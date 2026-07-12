import {Link} from "react-router";
import {BrandMark} from "../../../components/ui/BrandMark";
import {Icon} from "../../../components/ui/Icon";
import {useAuth} from "../../auth/hooks/useAuth";

const features = [
    {
        number: "01",
        title: "Build your workouts",
        description: "Create focused training plans and keep every exercise in one clear place.",
        icon: "workout" as const,
    },
    {
        number: "02",
        title: "Track every set",
        description: "Log reps and weight while you train, without interrupting your momentum.",
        icon: "exercise" as const,
    },
    {
        number: "03",
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
        <main className="landing-shell">
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
                    <p className="landing-note">
                        <span /> No noise. Just your next rep.
                    </p>
                </div>

                <div className="landing-preview" aria-label="FitTrack workout preview">
                    <div className="landing-preview-glow" />
                    <div className="landing-dashboard-card">
                        <div className="landing-card-topline">
                            <div>
                                <p>Today&apos;s workout</p>
                                <h2>Upper body</h2>
                            </div>
                            <span className="landing-live-dot">Ready</span>
                        </div>
                        <div className="landing-progress">
                            <span style={{width: "68%"}} />
                        </div>
                        <div className="landing-stat-row">
                            <div>
                                <strong>6</strong>
                                <span>Exercises</span>
                            </div>
                            <div>
                                <strong>24</strong>
                                <span>Sets</span>
                            </div>
                            <div>
                                <strong>
                                    52<span>m</span>
                                </strong>
                                <span>Duration</span>
                            </div>
                        </div>
                        <div className="landing-exercise-list">
                            <div>
                                <span className="landing-exercise-icon">
                                    <Icon name="exercise" />
                                </span>
                                <p>
                                    <strong>Bench press</strong>
                                    <small>4 sets · 8 reps</small>
                                </p>
                                <b>80 kg</b>
                            </div>
                            <div>
                                <span className="landing-exercise-icon">
                                    <Icon name="exercise" />
                                </span>
                                <p>
                                    <strong>Shoulder press</strong>
                                    <small>3 sets · 10 reps</small>
                                </p>
                                <b>24 kg</b>
                            </div>
                            <div>
                                <span className="landing-exercise-icon">
                                    <Icon name="exercise" />
                                </span>
                                <p>
                                    <strong>Lat pulldown</strong>
                                    <small>4 sets · 10 reps</small>
                                </p>
                                <b>65 kg</b>
                            </div>
                        </div>
                        <div className="landing-session-button">
                            <Icon name="play" size={17} /> Start session
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
                        <article key={feature.number} className="landing-feature-card">
                            <div className="landing-feature-meta">
                                <span>
                                    <Icon name={feature.icon} size={21} />
                                </span>
                                <small>{feature.number}</small>
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

            <footer className="landing-footer">
                <BrandMark linked={false} />
                <p>Built for better training.</p>
            </footer>
        </main>
    );
}
