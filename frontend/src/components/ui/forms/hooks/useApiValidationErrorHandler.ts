import {useCallback, type RefObject} from "react";
import {apiValidationErrors} from "../utils/apiValidationErrors";
import {focusFirstInvalidField} from "../utils/formAccessibility";

type SetErrors = (errors: Record<string, string>) => void;

export function useApiValidationErrorHandler(
    formRef: RefObject<HTMLFormElement | null>,
    setErrors: SetErrors,
) {
    return useCallback(
        (error: unknown) => {
            const errors = apiValidationErrors(error);
            if (!errors) return;

            setErrors(errors);
            focusFirstInvalidField(formRef);
        },
        [formRef, setErrors],
    );
}
