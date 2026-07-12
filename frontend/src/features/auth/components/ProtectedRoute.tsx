import {Navigate, Outlet} from "react-router";
import {useAuth} from "../hooks/useAuth";
import {LoadingState} from "../../../components/ui/LoadingState";

export function ProtectedRoute() {
    const {user, isLoading} = useAuth();

    if (isLoading) {
        return <LoadingState label="Checking session" />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
