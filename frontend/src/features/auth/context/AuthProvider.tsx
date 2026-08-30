import {useEffect, useRef, useState, type ReactNode} from "react";
import {getCurrentUser, logout} from "../api/auth.api";
import type {User} from "@fit-track/shared/auth";
import {AuthContext} from "./auth.context";
import {ApiError} from "../../../common/errors/api.error";
import {Feedback} from "../../../components/ui/feedback/Feedback";
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

    useEffect(() => {
        const requestId = ++requestIdRef.current;
        void restoreCurrentUser()
            .then((restoredUser) => {
                if (requestId === requestIdRef.current) setCurrentUser(restoredUser);
            })
            .catch(() => {
                if (requestId === requestIdRef.current) setHasSessionRestoreError(true);
            })
            .finally(() => {
                if (requestId === requestIdRef.current) setIsRestoringSession(false);
            });

        return () => {
            requestIdRef.current += 1;
        };
    }, []);

    function retryCurrentUser() {
        const requestId = ++requestIdRef.current;
        setIsRestoringSession(true);
        setHasSessionRestoreError(false);
        void restoreCurrentUser()
            .then((restoredUser) => {
                if (requestId === requestIdRef.current) setCurrentUser(restoredUser);
            })
            .catch(() => {
                if (requestId === requestIdRef.current) setHasSessionRestoreError(true);
            })
            .finally(() => {
                if (requestId === requestIdRef.current) setIsRestoringSession(false);
            });
    }

    if (hasSessionRestoreError) {
        return (
            <main className="grid min-h-screen place-items-center bg-ink p-6">
                <div className="w-full max-w-md space-y-4 text-center">
                    <Feedback>Unable to restore your session. Please try again.</Feedback>
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
