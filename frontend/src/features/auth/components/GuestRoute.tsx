import {Navigate, Outlet} from "react-router";
import {LoadingState} from "../../../components/ui/display/LoadingState";
import {useAuth} from "../hooks/useAuth";

export function GuestRoute() {
    const {currentUser, isRestoringSession} = useAuth();

    if (isRestoringSession) return <LoadingState label="Checking session" />;
    if (currentUser) return <Navigate to="/workouts" replace />;
    return <Outlet />;
}
