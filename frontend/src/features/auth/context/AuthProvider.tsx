import {useEffect, useState, type ReactNode} from "react";
import {getMe, logout} from "../api/auth.api";
import type {User} from "../auth.types";
import {AuthContext} from "./auth.context";

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({children}: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    async function signOut() {
        await logout();
        setUser(null);
    }

    useEffect(() => {
        async function loadCurrentUser() {
            try {
                const response = await getMe();
                setUser(response.user);
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        }

        void loadCurrentUser();
    }, []);

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
