import {createContext} from "react";

export type ConfirmDialogVariant = "default" | "danger";

export interface ConfirmDialogOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmDialogVariant;
}

export type ConfirmDialogFunction = (options: ConfirmDialogOptions) => Promise<boolean>;

export const ConfirmDialogContext = createContext<ConfirmDialogFunction | undefined>(undefined);
