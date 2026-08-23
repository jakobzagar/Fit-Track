import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {AppProviders} from "./app/providers/providers";
import {AppRouter} from "./app/routing/router";

import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AppProviders>
            <AppRouter />
        </AppProviders>
    </StrictMode>,
);
