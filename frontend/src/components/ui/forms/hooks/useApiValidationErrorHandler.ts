import {useCallback, type RefObject} from "react";
import {extractApiValidationErrors} from "../utils/extractApiValidationErrors";
import {focusFirstInvalidField} from "../utils/formAccessibility";

type SetErrors = (errors: Record<string, string>) => void;

export function useApiValidationErrorHandler(
    formRef: RefObject<HTMLFormElement | null>,
    setErrors: SetErrors,
) {
    return useCallback(
        (error: unknown) => {
            const errors = extractApiValidationErrors(error);
            if (!errors) return;

            setErrors(errors);
            focusFirstInvalidField(formRef);
        },
        [formRef, setErrors],
    );
}
