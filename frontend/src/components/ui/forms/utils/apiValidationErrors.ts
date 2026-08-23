import {ApiError} from "../../../../common/errors/api.error";

export function apiValidationErrors(error: unknown): Record<string, string> | null {
    if (!(error instanceof ApiError)) return null;

    const errors: Record<string, string> = {};

    for (const [field, messages] of Object.entries(error.fieldErrors ?? {})) {
        const message = messages[0];
        if (message) errors[field] = message;
    }

    const formMessage = error.formErrors?.[0];
    if (formMessage) errors.form = formMessage;

    return Object.keys(errors).length > 0 ? errors : null;
}
