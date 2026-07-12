import {Link} from "react-router";
import {useAuth} from "../../features/auth/hooks/useAuth";
import {BrandMark} from "../ui/BrandMark";
import {Icon} from "../ui/Icon";

interface FooterProps {
    variant?: "app" | "landing";
}

export function Footer({variant = "app"}: FooterProps) {
    const currentYear = new Date().getFullYear();
    const {user} = useAuth();

    if (variant === "landing") {
        return (
            <footer className="site-footer">
                <div className="site-footer-main">
                    <div className="site-footer-brand">
                        <BrandMark />
                        <p>Plan your workouts. Track every set. Keep progressing.</p>
                    </div>

                    <div className="site-footer-links">
                        <div>
                            <p>Product</p>
                            <a href="#top">Home</a>
                            <Link to="/workouts">Workouts</Link>
                            <Link to="/exercises">Exercises</Link>
                        </div>
                        <div>
                            <p>Account</p>
                            {user ? (
                                <Link to="/workouts">Dashboard</Link>
                            ) : (
                                <>
                                    <Link to="/login">Log in</Link>
                                    <Link to="/register">Create account</Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="site-footer-bottom">
                    <p>© {currentYear} FitTrack</p>
                    <p className="site-footer-status">
                        <span /> Ready to train
                    </p>
                </div>
            </footer>
        );
    }

    return (
        <footer className="app-footer">
            <div>
                <BrandMark />
                <p>© {currentYear} · Built for the work</p>
            </div>
            <nav aria-label="Footer navigation">
                <Link to="/workouts">Workouts</Link>
                <Link to="/exercises">Exercises</Link>
                <Link className="app-footer-home" to="/#top">
                    Home <Icon name="arrow" size={14} />
                </Link>
            </nav>
        </footer>
    );
}
