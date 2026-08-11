import {Navigate, Outlet} from "react-router";
import {LoadingState} from "../../../components/ui/display/LoadingState";
import {useAuth} from "../hooks/useAuth";

export function GuestRoute() {
    const {user, isLoading} = useAuth();

    if (isLoading) return <LoadingState label="Checking session" />;
    if (user) return <Navigate to="/workouts" replace />;
    return <Outlet />;
}
