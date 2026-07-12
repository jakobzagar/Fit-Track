import {Link} from "react-router";

interface BrandMarkProps {
    linked?: boolean;
}

export function BrandMark({linked = true}: BrandMarkProps) {
    const mark = (
        <span className="inline-flex items-center gap-3">
            <span className="grid size-9 rotate-3 place-items-center bg-flame text-sm font-black text-ink">
                FT
            </span>
            <span className="text-sm font-black tracking-[0.12em] text-cream uppercase">
                Fit<span className="text-flame">Track</span>
            </span>
        </span>
    );

    return linked ? <Link to="/workouts">{mark}</Link> : mark;
}
