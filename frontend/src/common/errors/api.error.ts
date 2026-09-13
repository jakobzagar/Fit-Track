export class ApiError extends Error {
    readonly status: number;
    readonly fieldErrors?: Record<string, string[]>;
    readonly formErrors?: string[];

    constructor(
        message: string,
        status: number,
        validation?: {
            fieldErrors: Record<string, string[]>;
            formErrors?: string[];
        },
    ) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        if (validation) {
            this.fieldErrors = validation.fieldErrors;
            if (validation.formErrors !== undefined) this.formErrors = validation.formErrors;
        }
    }
}
