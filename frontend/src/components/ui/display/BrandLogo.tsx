import {Link} from "react-router";

interface BrandLogoProps {
    linked?: boolean;
}

export function BrandLogo({linked = true}: BrandLogoProps) {
    const logo = (
        <span className="inline-flex items-center">
            <img
                className="brand-logo brand-logo-dark h-10 w-auto max-w-[180px] object-contain"
                src="/brand/fittrack-logo-dark.png"
                alt="FitTrack"
            />
            <img
                className="brand-logo brand-logo-light h-10 w-auto max-w-[180px] object-contain"
                src="/brand/fittrack-logo-light.png"
                alt="FitTrack"
            />
        </span>
    );

    return linked ? <Link to="/">{logo}</Link> : logo;
}
