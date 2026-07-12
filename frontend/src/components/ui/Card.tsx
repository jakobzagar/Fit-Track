import type {HTMLAttributes, ReactNode} from "react";

interface CardProps extends HTMLAttributes<HTMLElement> {
    children: ReactNode;
    as?: "article" | "section" | "aside" | "div";
}

export function Card({children, as: Component = "div", className = "", ...props}: CardProps) {
    return (
        <Component
            className={`rounded-[14px] border border-line bg-panel p-5 shadow-[0_18px_60px_rgba(0,0,0,0.2)] ${className}`}
            {...props}
        >
            {children}
        </Component>
    );
}
