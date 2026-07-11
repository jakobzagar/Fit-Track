import {BrowserRouter, Navigate, Route, Routes} from "react-router";
import {AppLayout} from "../components/layout/AppLayout";
import {ProtectedRoute} from "../features/auth/components/ProtectedRoute";
import {LoginPage} from "../features/auth/pages/LogInPage";
import {RegisterPage} from "../features/auth/pages/RegisterPage";
import {ExercisesPage} from "../features/exercises/pages/ExercisesPage";
import {WorkoutsPage} from "../features/workouts/pages/WorkoutsPage";
import {WorkoutDetailPage} from "../features/workouts/pages/WorkoutDetailPage";

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/exercises" replace />} />

                <Route path="/login" element={<LoginPage />} />

                <Route path="/register" element={<RegisterPage />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        <Route path="/exercises" element={<ExercisesPage />} />

                        <Route path="/workouts" element={<WorkoutsPage />} />

                        <Route path="/workouts/:workoutId" element={<WorkoutDetailPage />} />
                    </Route>
                </Route>

                <Route path="*" element={<p>Page not found</p>} />
            </Routes>
        </BrowserRouter>
    );
}
