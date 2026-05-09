import styles from "./AdminUI.module.scss";

const joinClassNames = (...classNames) => classNames.filter(Boolean).join(" ");

const normalizeOptions = (options = []) => (
    options.map((option) => (
        typeof option === "string"
            ? {value: option, label: option}
            : option
    ))
);

export function AdminPageHeader({eyebrow, title, children, className = ""}) {
    return (
        <div className={joinClassNames(styles.pageHeader, className)}>
            <div>
                {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
                <h1>{title}</h1>
            </div>
            {children}
        </div>
    );
}

export function AdminPanel({title, meta, actions, children, className = "", bodyClassName = "", as: Component = "section"}) {
    return (
        <Component className={joinClassNames(styles.panel, className)}>
            {(title || meta || actions) ? (
                <div className={styles.panelHeader}>
                    <div>
                        {title ? <h2>{title}</h2> : null}
                        {meta ? <span>{meta}</span> : null}
                    </div>
                    {actions ? <div className={styles.actions}>{actions}</div> : null}
                </div>
            ) : null}
            <div className={joinClassNames((title || meta || actions) ? styles.panelBody : "", bodyClassName)}>
                {children}
            </div>
        </Component>
    );
}

export function AdminButton({variant = "primary", fullWidth = false, className = "", children, ...props}) {
    return (
        <button
            type="button"
            className={joinClassNames(styles.button, styles[variant], fullWidth ? styles.fullWidth : "", className)}
            {...props}
        >
            {children}
        </button>
    );
}

export function AdminStatusMessage({type = "success", children, className = ""}) {
    if (!children) {
        return null;
    }

    return (
        <div className={joinClassNames(styles.statusMessage, styles[type], className)}>
            {children}
        </div>
    );
}

export function AdminFormGrid({children, className = ""}) {
    return <div className={joinClassNames(styles.formGrid, className)}>{children}</div>;
}

export function AdminTextField({label, value, onChange, className = "", inputClassName = "", ...props}) {
    return (
        <label className={joinClassNames(styles.field, className)}>
            <span>{label}</span>
            <input
                className={joinClassNames(styles.input, inputClassName)}
                value={value ?? ""}
                onChange={(event) => onChange?.(event.target.value, event)}
                {...props}
            />
        </label>
    );
}

export function AdminSelectField({label, value, onChange, options = [], placeholder = "", className = "", selectClassName = "", ...props}) {
    return (
        <label className={joinClassNames(styles.field, className)}>
            <span>{label}</span>
            <select
                className={joinClassNames(styles.select, selectClassName)}
                value={value ?? ""}
                onChange={(event) => onChange?.(event.target.value, event)}
                {...props}
            >
                {placeholder ? <option value="">{placeholder}</option> : null}
                {normalizeOptions(options).map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

export function AdminCheckboxField({label, checked, onChange, plain = false, className = "", ...props}) {
    return (
        <label className={joinClassNames(styles.checkboxField, plain ? styles.plainCheckbox : "", className)}>
            <input
                type="checkbox"
                checked={Boolean(checked)}
                onChange={(event) => onChange?.(event.target.checked, event)}
                {...props}
            />
            <span>{label}</span>
        </label>
    );
}
