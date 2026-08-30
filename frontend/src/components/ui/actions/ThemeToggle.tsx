import {useState} from "react";
import {Icon} from "../display/Icon";

type Theme = "dark" | "light";

function getCurrentTheme(): Theme {
    return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function ThemeToggle({className = ""}: {className?: string}) {
    const [theme, setTheme] = useState<Theme>(getCurrentTheme);

    function toggleTheme() {
        const nextTheme = theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = nextTheme;
        document
            .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
            ?.setAttribute("content", nextTheme === "light" ? "#f5f3ef" : "#080808");
        localStorage.setItem("fittrack-theme", nextTheme);
        setTheme(nextTheme);
    }

    const nextTheme = theme === "dark" ? "light" : "dark";

    return (
        <button
            className={`theme-toggle ${className}`}
            type="button"
            aria-label={`Switch to ${nextTheme} theme`}
            title={`Switch to ${nextTheme} theme`}
            onClick={toggleTheme}
        >
            <Icon name={theme === "dark" ? "sun" : "moon"} size={17} />
        </button>
    );
}
