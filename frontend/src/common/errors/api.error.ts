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
        this.fieldErrors = validation?.fieldErrors;
        this.formErrors = validation?.formErrors;
    }
}
