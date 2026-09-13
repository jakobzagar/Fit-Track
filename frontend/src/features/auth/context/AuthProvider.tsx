import {useCallback, useEffect, useRef, useState, type ReactNode} from "react";
import {getCurrentUser, logout} from "../api/auth.api";
import type {User} from "@fit-track/shared/auth";
import {AuthContext} from "./auth.context";
import {ApiError} from "../../../common/errors/api.error";
import {StatusMessage} from "../../../components/ui/feedback/StatusMessage";
import {Button} from "../../../components/ui/actions/Button";
import {onSessionExpired} from "../../../lib/auth/session-expiration";

interface AuthProviderProps {
    children: ReactNode;
}

async function restoreCurrentUser(): Promise<User | null> {
    try {
        const response = await getCurrentUser();
        return response.user;
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
    }
}

export function AuthProvider({children}: AuthProviderProps) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isRestoringSession, setIsRestoringSession] = useState(true);
    const [hasSessionRestoreError, setHasSessionRestoreError] = useState(false);
    const requestIdRef = useRef(0);

    useEffect(() => onSessionExpired(() => setCurrentUser(null)), []);

    async function signOut() {
        await logout();
        setCurrentUser(null);
    }

    const runSessionRestore = useCallback(async () => {
        const requestId = ++requestIdRef.current;

        try {
            const restoredUser = await restoreCurrentUser();
            if (requestId === requestIdRef.current) setCurrentUser(restoredUser);
        } catch {
            if (requestId === requestIdRef.current) setHasSessionRestoreError(true);
        } finally {
            if (requestId === requestIdRef.current) setIsRestoringSession(false);
        }
    }, []);

    useEffect(() => {
        let isCurrent = true;
        queueMicrotask(() => {
            if (isCurrent) void runSessionRestore();
        });

        return () => {
            isCurrent = false;
            requestIdRef.current += 1;
        };
    }, [runSessionRestore]);

    function retryCurrentUser() {
        setIsRestoringSession(true);
        setHasSessionRestoreError(false);
        void runSessionRestore();
    }

    if (hasSessionRestoreError) {
        return (
            <main className="grid min-h-screen place-items-center bg-ink p-6">
                <div className="w-full max-w-md space-y-4 text-center">
                    <StatusMessage>Unable to restore your session. Please try again.</StatusMessage>
                    <Button type="button" onClick={retryCurrentUser}>
                        Try again
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <AuthContext
            value={{
                currentUser,
                isRestoringSession,
                setAuthenticatedUser: setCurrentUser,
                signOut,
            }}
        >
            {children}
        </AuthContext>
    );
}
