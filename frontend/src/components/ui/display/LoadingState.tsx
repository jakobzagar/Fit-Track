interface LoadingStateProps {
    label?: string;
}

export function LoadingState({label = "Loading"}: LoadingStateProps) {
    return (
        <div className="grid min-h-[320px] place-items-center">
            <div className="text-center">
                <span className="mx-auto block size-8 animate-spin rounded-full border-2 border-line border-t-flame" />
                <p className="mt-4 text-xs font-bold tracking-[0.14em] text-dim uppercase">
                    {label}
                </p>
            </div>
        </div>
    );
}
