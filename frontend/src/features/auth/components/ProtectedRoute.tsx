import {Navigate, Outlet} from "react-router";
import {useAuth} from "../hooks/useAuth";

export function ProtectedRoute() {
    const {user, isLoading} = useAuth();

    if (isLoading) {
        return <p>Checking authentication...</p>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
