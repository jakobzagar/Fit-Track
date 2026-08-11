import {Button} from "../../../../components/ui/actions/Button";

interface WorkoutSessionActionBarProps {
    completedSetCount: number;
    isFinishing: boolean;
    isCancelling: boolean;
    onFinish: () => void;
    onCancel: () => void;
}

export function WorkoutSessionActionBar({
    completedSetCount,
    isFinishing,
    isCancelling,
    onFinish,
    onCancel,
}: WorkoutSessionActionBarProps) {
    return (
        <footer className="session-action-bar sticky z-30 flex flex-col items-stretch justify-between gap-3 rounded-[14px] border border-line bg-panel/95 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center">
            <div>
                <span className="metric-number text-xl font-black text-cream">
                    {completedSetCount}
                </span>
                <span className="ml-2 text-xs font-bold tracking-[0.08em] text-dim uppercase">
                    completed sets
                </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                    className="w-full sm:w-auto"
                    size="lg"
                    variant="danger"
                    type="button"
                    disabled={isFinishing || isCancelling}
                    onClick={onCancel}
                >
                    {isCancelling ? "Cancelling..." : "Cancel session"}
                </Button>
                <Button
                    className="w-full sm:w-auto"
                    size="lg"
                    type="button"
                    disabled={isFinishing || isCancelling || completedSetCount === 0}
                    onClick={onFinish}
                >
                    {isFinishing ? "Finishing..." : "Finish workout"}
                </Button>
            </div>
        </footer>
    );
}
