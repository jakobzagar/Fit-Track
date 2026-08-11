import {Icon} from "../../../components/ui/Icon";

export function LandingWorkoutPreview() {
    return (
        <div className="landing-preview" aria-label="FitTrack workout preview">
            <div className="landing-preview-glow" />
            <div className="landing-dashboard-card">
                <span className="absolute inset-y-0 left-0 w-1 bg-flame" />
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <span className="inline-flex rounded-full border border-flame/40 bg-flame/10 px-2.5 py-1 text-[10px] font-extrabold tracking-[0.12em] text-flame uppercase">
                            Active
                        </span>
                        <h2 className="mt-4 text-2xl font-black tracking-[-0.04em] text-cream">
                            Upper body
                        </h2>
                    </div>
                    <div className="text-right">
                        <p className="metric-number text-2xl font-black text-flame">6</p>
                        <p className="text-[10px] tracking-[0.1em] text-dim uppercase">Exercises</p>
                    </div>
                </div>
                <p className="mt-3 text-xs font-semibold tracking-[0.05em] text-dim uppercase">
                    12 Jul 2026
                </p>
                <p className="mt-4 text-sm leading-6 text-dim">
                    Chest, shoulders and back with controlled working sets.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-2 border-t border-line pt-4 sm:grid-cols-3">
                    <span className="col-span-2 inline-flex min-h-11 items-center justify-center gap-1 rounded-[9px] border border-flame bg-flame px-2 text-center text-xs font-extrabold tracking-[0.04em] text-ink uppercase sm:col-span-1">
                        <Icon name="arrow" size={15} /> Continue workout
                    </span>
                    <span className="inline-flex min-h-10 items-center justify-center gap-1 rounded-[9px] px-2 text-xs font-extrabold tracking-[0.04em] text-dim uppercase">
                        <Icon name="edit" size={14} /> Edit
                    </span>
                    <span className="inline-flex min-h-10 items-center justify-center gap-1 rounded-[9px] border border-negative/20 bg-negative/8 px-2 text-xs font-extrabold tracking-[0.04em] text-negative uppercase">
                        <Icon name="trash" size={16} /> Delete
                    </span>
                </div>
            </div>
        </div>
    );
}
