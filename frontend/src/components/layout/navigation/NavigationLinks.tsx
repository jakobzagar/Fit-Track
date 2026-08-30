import {NavLink} from "react-router";
import {Icon} from "../../ui/display/Icon";

const navigation = [
    {to: "/workouts", label: "Workouts", icon: "workout" as const},
    {to: "/exercises", label: "Exercises", icon: "exercise" as const},
];

function getNavigationClassName({isActive}: {isActive: boolean}) {
    return `relative flex min-h-11 items-center gap-2 px-3 text-xs font-extrabold tracking-[0.1em] uppercase transition ${isActive ? "text-cream" : "text-dim hover:text-cream"}`;
}

export function DesktopNavigation() {
    return (
        <nav className="hidden items-center gap-2 md:flex" aria-label="Main navigation">
            {navigation.map((item) => (
                <NavLink key={item.to} className={getNavigationClassName} to={item.to}>
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
    );
}

export function MobileNavigation({
    isLoggingOut,
    onLogout,
}: {
    isLoggingOut: boolean;
    onLogout: () => void;
}) {
    return (
        <nav
            className="mobile-navigation fixed inset-x-3 z-50 grid grid-cols-3 rounded-[14px] border border-line bg-panel/95 p-1.5 shadow-2xl backdrop-blur-xl md:hidden"
            aria-label="Mobile navigation"
        >
            {navigation.map((item) => (
                <NavLink key={item.to} className={getNavigationClassName} to={item.to}>
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
                onClick={onLogout}
            >
                <Icon name="logout" size={17} />
                Log out
            </button>
        </nav>
    );
}
