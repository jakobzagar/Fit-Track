import type {ReactNode} from "react";
import {AuthProvider} from "../features/auth/context/AuthProvider";
import {ConfirmDialogProvider} from "../components/ui/ConfirmDialogProvider";

interface AppProvidersProps {
    children: ReactNode;
}

export function AppProviders({children}: AppProvidersProps) {
    return (
        <AuthProvider>
            <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
        </AuthProvider>
    );
}
