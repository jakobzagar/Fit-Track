import {render, screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, test} from "vitest";
import {ThemeToggle} from "../actions/ThemeToggle";

function addThemeMeta(content: string) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = content;
    document.head.append(meta);
    return meta;
}

describe("ThemeToggle", () => {
    test("uses the document theme as its accessible initial state", () => {
        document.documentElement.dataset.theme = "light";
        render(<ThemeToggle />);

        expect(screen.getByRole("button", {name: "Switch to dark theme"})).toHaveAttribute(
            "title",
            "Switch to dark theme",
        );
    });

    test("updates the document, browser color and persisted preference", async () => {
        document.documentElement.dataset.theme = "dark";
        const meta = addThemeMeta("#080808");
        const user = userEvent.setup();
        render(<ThemeToggle />);

        await user.click(screen.getByRole("button", {name: "Switch to light theme"}));

        expect(document.documentElement.dataset.theme).toBe("light");
        expect(meta).toHaveAttribute("content", "#f5f3ef");
        expect(localStorage.getItem("fittrack-theme")).toBe("light");
        expect(screen.getByRole("button", {name: "Switch to dark theme"})).toBeInTheDocument();
    });
});
