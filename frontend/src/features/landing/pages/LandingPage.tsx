import {Link} from "react-router";
import {BrandMark} from "../../../components/ui/display/BrandMark";
import {Icon} from "../../../components/ui/display/Icon";
import {useAuth} from "../../auth/hooks/useAuth";
import {Footer} from "../../../components/layout/footer/Footer";
import {ThemeToggle} from "../../../components/ui/actions/ThemeToggle";
import {LandingFeatures} from "../components/LandingFeatures";
import {LandingWorkoutPreview} from "../components/LandingWorkoutPreview";

export function LandingPage() {
    const {currentUser} = useAuth();
    const primaryPath = currentUser ? "/workouts" : "/register";
    const primaryLabel = currentUser ? "Open dashboard" : "Start training";

    return (
        <main id="top" className="landing-shell">
            <header className="landing-nav">
                <BrandMark linked={false} />
                <div className="flex items-center gap-2 sm:gap-3">
                    <ThemeToggle />
                    {!currentUser && (
                        <Link className="landing-link-muted" to="/login">
                            Log in
                        </Link>
                    )}
                    <Link className="landing-button landing-button-small" to={primaryPath}>
                        {currentUser ? "Dashboard" : "Get started"}
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
                        {!currentUser && (
                            <Link className="landing-button landing-button-secondary" to="/login">
                                Log in
                            </Link>
                        )}
                    </div>
                </div>

                <LandingWorkoutPreview />
            </section>

            <LandingFeatures />

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
