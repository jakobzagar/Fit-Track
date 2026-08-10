import {useEffect, useState, type ReactNode} from "react";
import {getMe, logout} from "../api/auth.api";
import type {User} from "../auth.types";
import {AuthContext} from "./auth.context";
import {ApiError} from "../../../common/errors/api.error";
import {Feedback} from "../../../components/ui/Feedback";
import {Button} from "../../../components/ui/Button";

interface AuthProviderProps {
    children: ReactNode;
}

async function restoreCurrentUser(): Promise<User | null> {
    try {
        const response = await getMe();
        return response.user;
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
    }
}

export function AuthProvider({children}: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionError, setSessionError] = useState(false);

    async function signOut() {
        await logout();
        setUser(null);
    }

    useEffect(() => {
        void restoreCurrentUser()
            .then(setUser)
            .catch(() => setSessionError(true))
            .finally(() => setIsLoading(false));
    }, []);

    function retryCurrentUser() {
        setIsLoading(true);
        setSessionError(false);
        void restoreCurrentUser()
            .then(setUser)
            .catch(() => setSessionError(true))
            .finally(() => setIsLoading(false));
    }

    if (sessionError) {
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
                user,
                isLoading,
                setUser,
                signOut,
            }}
        >
            {children}
        </AuthContext>
    );
}
