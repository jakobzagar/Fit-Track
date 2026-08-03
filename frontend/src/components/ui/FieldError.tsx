export function FieldError({id, children}: {id: string; children?: string}) {
    if (!children) return null;
    return (
        <p id={id} className="field-error">
            {children}
        </p>
    );
}
