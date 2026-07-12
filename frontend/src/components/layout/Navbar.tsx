import {useEffect, useState} from "react";
import {NavLink, useNavigate} from "react-router";
import {useAuth} from "../../features/auth/hooks/useAuth";
import {BrandMark} from "../ui/BrandMark";
import {Button} from "../ui/Button";
import {Icon} from "../ui/Icon";

const navigation = [
    {to: "/workouts", label: "Workouts", icon: "workout" as const},
    {to: "/exercises", label: "Exercises", icon: "exercise" as const},
];

function navigationClass({isActive}: {isActive: boolean}) {
    return `relative flex min-h-10 items-center gap-2 px-3 text-xs font-extrabold tracking-[0.1em] uppercase transition ${
        isActive ? "text-cream" : "text-dim hover:text-cream"
    }`;
}

export function Navbar() {
    const navigate = useNavigate();
    const {user, signOut} = useAuth();
    const [error, setError] = useState("");
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [theme, setTheme] = useState<"dark" | "light">(() =>
        document.documentElement.dataset.theme === "light" ? "light" : "dark",
    );

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("fittrack-theme", theme);
    }, [theme]);

    async function handleLogout() {
        setError("");
        setIsLoggingOut(true);

        try {
            await signOut();
            navigate("/login", {replace: true});
        } catch (caughtError) {
            setError(caughtError instanceof Error ? caughtError.message : "Logout failed");
        } finally {
            setIsLoggingOut(false);
        }
    }

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-xl">
                <div className="mx-auto flex h-18 max-w-[1180px] items-center justify-between px-4 sm:px-6">
                    <BrandMark />

                    <nav className="hidden items-center gap-2 md:flex" aria-label="Main navigation">
                        {navigation.map((item) => (
                            <NavLink key={item.to} className={navigationClass} to={item.to}>
                                {({isActive}) => (
                                    <>
                                        {item.label}
                                        {isActive && (
                                            <span className="absolute inset-x-3 -bottom-[15px] h-0.5 bg-flame" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            className="theme-toggle"
                            type="button"
                            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                            onClick={() =>
                                setTheme((current) => (current === "dark" ? "light" : "dark"))
                            }
                        >
                            <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
                        </button>
                        <div className="hidden text-right sm:block">
                            <p className="text-xs font-bold text-cream">{user?.name}</p>
                            <p className="text-[10px] tracking-[0.1em] text-dim uppercase">
                                Athlete
                            </p>
                        </div>
                        <span className="grid size-9 place-items-center rounded-full border border-flame/30 bg-flame/10 text-xs font-black text-flame">
                            {user?.name?.charAt(0).toUpperCase() ?? "A"}
                        </span>
                        <Button
                            className="hidden sm:inline-flex"
                            variant="ghost"
                            size="sm"
                            type="button"
                            disabled={isLoggingOut}
                            onClick={() => void handleLogout()}
                        >
                            {isLoggingOut ? "Leaving..." : "Log out"}
                        </Button>
                    </div>
                </div>
                {error && (
                    <p className="border-t border-negative/20 bg-negative/10 px-4 py-2 text-center text-xs text-red-200">
                        {error}
                    </p>
                )}
            </header>

            <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-3 rounded-[14px] border border-line bg-panel/95 p-1.5 shadow-2xl backdrop-blur-xl md:hidden">
                {navigation.map((item) => (
                    <NavLink key={item.to} className={navigationClass} to={item.to}>
                        {({isActive}) => (
                            <span
                                className={`flex w-full flex-col items-center gap-1 rounded-[9px] py-2 ${isActive ? "bg-flame text-ink" : ""}`}
                            >
                                <Icon name={item.icon} size={17} />
                                {item.label}
                            </span>
                        )}
                    </NavLink>
                ))}
                <button
                    className="flex flex-col items-center justify-center gap-1 rounded-[9px] text-[10px] font-extrabold tracking-[0.1em] text-dim uppercase"
                    type="button"
                    disabled={isLoggingOut}
                    onClick={() => void handleLogout()}
                >
                    <Icon name="logout" size={17} />
                    Log out
                </button>
            </nav>
        </>
    );
}
