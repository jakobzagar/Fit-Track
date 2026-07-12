export function SkeletonGrid({count = 4}: {count?: number}) {
    return (
        <div className="card-grid" aria-label="Loading content" aria-busy="true">
            {Array.from({length: count}, (_, index) => (
                <div
                    key={index}
                    className="h-52 animate-pulse rounded-[14px] border border-line bg-panel p-5"
                >
                    <div className="h-3 w-20 rounded bg-white/8" />
                    <div className="mt-5 h-7 w-2/3 rounded bg-white/8" />
                    <div className="mt-4 h-3 w-1/2 rounded bg-white/5" />
                    <div className="mt-12 h-px bg-line" />
                    <div className="mt-4 h-9 w-28 rounded bg-white/8" />
                </div>
            ))}
        </div>
    );
}
