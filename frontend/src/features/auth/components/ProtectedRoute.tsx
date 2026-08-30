import {Navigate, Outlet} from "react-router";
import {useAuth} from "../hooks/useAuth";
import {LoadingState} from "../../../components/ui/display/LoadingState";

export function ProtectedRoute() {
    const {currentUser, isRestoringSession} = useAuth();

    if (isRestoringSession) {
        return <LoadingState label="Checking session" />;
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
