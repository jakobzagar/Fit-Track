import type {SVGProps} from "react";

type IconName =
    | "workout"
    | "exercise"
    | "logout"
    | "plus"
    | "edit"
    | "trash"
    | "play"
    | "check"
    | "arrow"
    | "sun"
    | "moon";

interface IconProps extends SVGProps<SVGSVGElement> {
    name: IconName;
    size?: number;
}

const paths: Record<IconName, React.ReactNode> = {
    workout: (
        <>
            <path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />
        </>
    ),
    exercise: (
        <>
            <path d="M6.5 6.5 9 4l2 2-2.5 2.5M15.5 15.5 13 18l2 2 2.5-2.5M8.5 8.5l7 7M14 6l4 4M6 14l4 4" />
        </>
    ),
    logout: (
        <>
            <path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
        </>
    ),
    plus: (
        <>
            <path d="M12 5v14M5 12h14" />
        </>
    ),
    edit: (
        <>
            <path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20ZM14 7l3 3" />
        </>
    ),
    trash: (
        <>
            <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
        </>
    ),
    play: (
        <>
            <path d="m9 6 9 6-9 6V6Z" />
        </>
    ),
    check: (
        <>
            <path d="m5 12 4 4L19 6" />
        </>
    ),
    arrow: (
        <>
            <path d="M5 12h14M14 7l5 5-5 5" />
        </>
    ),
    sun: (
        <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
        </>
    ),
    moon: <path d="M20.5 14.5A8 8 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" />,
};

export function Icon({name, size = 18, ...props}: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {paths[name]}
        </svg>
    );
}
