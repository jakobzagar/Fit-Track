import {useState} from "react";
import {useNavigate} from "react-router";
import {useAuth} from "../../../features/auth/hooks/useAuth";
import {BrandMark} from "../../ui/display/BrandMark";
import {DesktopNavigation, MobileNavigation} from "./NavigationLinks";
import {NavbarAccount} from "./NavbarAccount";

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
            void navigate("/login", {replace: true});
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

                    <DesktopNavigation />
                    <NavbarAccount
                        name={user?.name}
                        isLoggingOut={isLoggingOut}
                        onLogout={() => void handleLogout()}
                    />
                </div>
                {error && (
                    <p className="border-t border-negative/20 bg-negative/10 px-4 py-2 text-center text-xs text-red-200">
                        {error}
                    </p>
                )}
            </header>

            <MobileNavigation isLoggingOut={isLoggingOut} onLogout={() => void handleLogout()} />
        </>
    );
}
