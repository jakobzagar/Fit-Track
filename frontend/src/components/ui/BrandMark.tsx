import {Link} from "react-router";

interface BrandMarkProps {
    linked?: boolean;
}

export function BrandMark({linked = true}: BrandMarkProps) {
    const mark = (
        <span className="inline-flex items-center">
            <img
                className="brand-logo brand-logo-dark h-10 w-auto max-w-[180px] object-contain"
                src="/brand/fittrack-logo.png"
                alt="FitTrack"
            />
            <img
                className="brand-logo brand-logo-light h-10 w-auto max-w-[180px] object-contain"
                src="/brand/fittrack-logo-light.png"
                alt="FitTrack"
            />
        </span>
    );

    return linked ? <Link to="/">{mark}</Link> : mark;
}
