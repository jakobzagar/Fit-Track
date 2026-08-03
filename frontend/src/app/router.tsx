import {createBrowserRouter, Link, RouterProvider} from "react-router";
import {AppLayout} from "../components/layout/AppLayout";
import {ProtectedRoute} from "../features/auth/components/ProtectedRoute";
import {LoginPage} from "../features/auth/pages/LogInPage";
import {RegisterPage} from "../features/auth/pages/RegisterPage";
import {ExercisesPage} from "../features/exercises/pages/ExercisesPage";
import {WorkoutsPage} from "../features/workouts/pages/WorkoutsPage";
import {WorkoutDetailPage} from "../features/workouts/pages/WorkoutDetailPage";
import {WorkoutSessionPage} from "../features/workouts/pages/WorkoutSessionPage";
import {LandingPage} from "../features/landing/pages/LandingPage";
import {GuestRoute} from "../features/auth/components/GuestRoute";
import {RouteExperience} from "./RouteExperience";

function NotFoundPage() {
    return (
        <main className="grid min-h-screen place-items-center bg-ink p-6 text-center">
            <div>
                <p className="eyebrow justify-center">404</p>
                <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] text-cream">
                    Page not found
                </h1>
                <p className="mt-4 text-dim">This route is off the training plan.</p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link className="landing-button" to="/">
                        Go home
                    </Link>
                    <Link className="landing-button landing-button-secondary" to="/workouts">
                        Go to workouts
                    </Link>
                </div>
            </div>
        </main>
    );
}

function createAppRouter() {
    return createBrowserRouter([
        {
            element: <RouteExperience />,
            children: [
                {path: "/", element: <LandingPage />},
                {
                    element: <GuestRoute />,
                    children: [
                        {path: "/login", element: <LoginPage />},
                        {path: "/register", element: <RegisterPage />},
                    ],
                },
                {
                    element: <ProtectedRoute />,
                    children: [
                        {
                            element: <AppLayout />,
                            children: [
                                {path: "/exercises", element: <ExercisesPage />},
                                {path: "/workouts", element: <WorkoutsPage />},
                                {path: "/workouts/:workoutId", element: <WorkoutDetailPage />},
                                {
                                    path: "/workouts/:workoutId/session",
                                    element: <WorkoutSessionPage />,
                                },
                            ],
                        },
                    ],
                },
                {path: "*", element: <NotFoundPage />},
            ],
        },
    ]);
}

export function AppRouter() {
    return <RouterProvider router={createAppRouter()} />;
}
