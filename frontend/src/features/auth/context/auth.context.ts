import {createContext} from "react";
import type {User} from "@fit-track/shared/auth";

export interface AuthContextValue {
    currentUser: User | null;
    isRestoringSession: boolean;
    setAuthenticatedUser: (user: User) => void;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
