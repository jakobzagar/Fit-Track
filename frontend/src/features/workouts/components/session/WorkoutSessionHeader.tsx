import {Link} from "react-router";
import type {Workout} from "@fit-track/shared/workouts";

interface WorkoutSessionHeaderProps {
    workout: Workout;
    completedSetCount: number;
    onExit: () => void;
}

export function WorkoutSessionHeader({
    workout,
    completedSetCount,
    onExit,
}: WorkoutSessionHeaderProps) {
    return (
        <header className="session-header flex flex-col justify-between gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:gap-5 sm:pb-7">
            <div>
                <p className="eyebrow">Live session</p>
                <h1 className="mt-2 text-3xl font-black tracking-[-0.055em] text-cream sm:mt-3 sm:text-5xl">
                    {workout.name}
                </h1>
                <p className="mt-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] text-positive uppercase sm:mt-3 sm:text-xs">
                    <span className="size-2 animate-pulse rounded-full bg-positive" />
                    Workout in progress
                </p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:block">
                <p className="text-xs font-bold tracking-[0.08em] text-dim uppercase sm:hidden">
                    {completedSetCount} sets done
                </p>
                <Link
                    className="inline-flex min-h-11 items-center text-xs font-bold tracking-[0.08em] text-dim uppercase hover:text-cream"
                    to={`/workouts/${workout.id}`}
                    onClick={(event) => {
                        event.preventDefault();
                        onExit();
                    }}
                >
                    Exit session →
                </Link>
            </div>
        </header>
    );
}
