import {Button} from "../../ui/actions/Button";
import {ThemeToggle} from "../../ui/actions/ThemeToggle";

export function NavbarAccount({
    name,
    isLoggingOut,
    onLogout,
}: {
    name?: string;
    isLoggingOut: boolean;
    onLogout: () => void;
}) {
    return (
        <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
                <p className="text-xs font-bold text-cream">{name}</p>
                <p className="text-[10px] tracking-[0.1em] text-dim uppercase">Athlete</p>
            </div>
            <span className="grid size-9 place-items-center rounded-full border border-flame/30 bg-flame/10 text-xs font-black text-flame">
                {name?.charAt(0).toUpperCase() ?? "A"}
            </span>
            <Button
                className="hidden sm:inline-flex"
                variant="ghost"
                size="sm"
                type="button"
                disabled={isLoggingOut}
                onClick={onLogout}
            >
                {isLoggingOut ? "Leaving..." : "Log out"}
            </Button>
        </div>
    );
}
