import type {ReactNode} from "react";

interface PageHeaderProps {
    eyebrow: string;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function PageHeader({eyebrow, title, description, action}: PageHeaderProps) {
    return (
        <header className="flex flex-col justify-between gap-6 border-b border-line pb-7 sm:flex-row sm:items-end">
            <div>
                <p className="eyebrow">{eyebrow}</p>
                <h1 className="display-title">{title}</h1>
                {description && <p className="page-description">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </header>
    );
}
