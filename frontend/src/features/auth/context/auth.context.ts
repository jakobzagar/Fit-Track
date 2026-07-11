import {createContext, type Dispatch, type SetStateAction} from "react";
import type {User} from "../auth.types";

export interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    setUser: Dispatch<SetStateAction<User | null>>;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
