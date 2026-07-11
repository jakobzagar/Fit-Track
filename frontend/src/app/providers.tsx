import type {ReactNode} from "react";
import {AuthProvider} from "../features/auth/context/AuthProvider";

interface AppProvidersProps {
    children: ReactNode;
}

export function AppProviders({children}: AppProvidersProps) {
    return <AuthProvider>{children}</AuthProvider>;
}
