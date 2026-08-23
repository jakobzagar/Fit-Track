import type {RefObject} from "react";

export function invalidFieldProps(error: string | undefined, errorId: string) {
    return {
        "aria-invalid": error ? (true as const) : undefined,
        "aria-describedby": error ? errorId : undefined,
    };
}

export function focusFirstInvalidField(formRef: RefObject<HTMLFormElement | null>) {
    window.setTimeout(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }, 0);
}
