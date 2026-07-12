import {BrowserRouter, Route, Routes} from "react-router";
import {AppLayout} from "../components/layout/AppLayout";
import {ProtectedRoute} from "../features/auth/components/ProtectedRoute";
import {LoginPage} from "../features/auth/pages/LogInPage";
import {RegisterPage} from "../features/auth/pages/RegisterPage";
import {ExercisesPage} from "../features/exercises/pages/ExercisesPage";
import {WorkoutsPage} from "../features/workouts/pages/WorkoutsPage";
import {WorkoutDetailPage} from "../features/workouts/pages/WorkoutDetailPage";
import {WorkoutSessionPage} from "../features/workouts/pages/WorkoutSessionPage";
import {LandingPage} from "../features/landing/pages/LandingPage";

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />

                <Route path="/login" element={<LoginPage />} />

                <Route path="/register" element={<RegisterPage />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        <Route path="/exercises" element={<ExercisesPage />} />

                        <Route path="/workouts" element={<WorkoutsPage />} />

                        <Route path="/workouts/:workoutId" element={<WorkoutDetailPage />} />

                        <Route
                            path="/workouts/:workoutId/session"
                            element={<WorkoutSessionPage />}
                        />
                    </Route>
                </Route>

                <Route
                    path="*"
                    element={
                        <main className="grid min-h-screen place-items-center bg-ink p-6 text-center">
                            <div>
                                <p className="eyebrow justify-center">404</p>
                                <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] text-cream">
                                    Page not found
                                </h1>
                                <p className="mt-4 text-dim">
                                    This route is off the training plan.
                                </p>
                            </div>
                        </main>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}
