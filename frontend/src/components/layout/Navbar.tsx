import {useState} from "react";
import {Link, useNavigate} from "react-router";
import {useAuth} from "../../features/auth/hooks/useAuth";

export function Navbar() {
    const navigate = useNavigate();
    const {user, signOut} = useAuth();
    const [error, setError] = useState("");
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleLogout() {
        setError("");
        setIsLoggingOut(true);

        try {
            await signOut();

            navigate("/login", {replace: true});
        } catch (error) {
            setError(error instanceof Error ? error.message : "Logout failed");
        } finally {
            setIsLoggingOut(false);
        }
    }

    return (
        <header>
            <Link to="/exercises">Fit Track</Link>

            <nav>
                <Link to="/exercises">Exercises</Link>

                <Link to="/workouts">Workouts</Link>
            </nav>

            <span>{user?.name}</span>

            <button type="button" disabled={isLoggingOut} onClick={handleLogout}>
                {isLoggingOut ? "Logging out..." : "Log out"}
            </button>

            {error && <p>{error}</p>}
        </header>
    );
}
