import type {ReactElement, ReactNode} from "react";
import {render, type RenderOptions} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {MemoryRouter} from "react-router";
import {AppProviders} from "../app/providers/providers";

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
    route?: string;
}

export function renderWithProviders(
    ui: ReactElement,
    {route = "/", ...options}: RenderWithProvidersOptions = {},
) {
    function Wrapper({children}: {children: ReactNode}) {
        return (
            <MemoryRouter initialEntries={[route]}>
                <AppProviders>{children}</AppProviders>
            </MemoryRouter>
        );
    }

    return {
        user: userEvent.setup(),
        ...render(ui, {wrapper: Wrapper, ...options}),
    };
}
