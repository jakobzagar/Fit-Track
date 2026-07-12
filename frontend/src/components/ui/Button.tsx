import {forwardRef, type ButtonHTMLAttributes, type ReactNode} from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "border-flame bg-flame text-ink hover:border-flame-bright hover:bg-flame-bright shadow-[0_8px_30px_rgba(255,100,26,0.18)]",
    secondary: "border-line bg-panel-raised text-cream hover:border-flame/70 hover:text-white",
    ghost: "border-transparent bg-transparent text-dim hover:bg-white/5 hover:text-cream",
    danger: "border-negative/20 bg-negative/8 text-negative hover:bg-negative/15",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "min-h-9 px-3 text-xs",
    md: "min-h-11 px-4 text-sm",
    lg: "min-h-13 px-5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    {children, variant = "primary", size = "md", fullWidth = false, className = "", ...props},
    ref,
) {
    return (
        <button
            ref={ref}
            className={`inline-flex items-center justify-center gap-2 rounded-[10px] border font-extrabold tracking-[0.05em] uppercase transition disabled:opacity-40 ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
});
