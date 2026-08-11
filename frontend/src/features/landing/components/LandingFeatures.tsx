import {Icon} from "../../../components/ui/display/Icon";

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

export function LandingFeatures() {
    return (
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
    );
}
