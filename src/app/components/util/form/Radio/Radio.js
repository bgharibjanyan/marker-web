"use client";

import styles from "./Radio.module.scss";

const Radio = ({ name, label, value, checked, onChange, disabled = false }) => {
    return (
        <label className={`${styles.radioContainer} ${disabled ? styles.disabled : ''}`}>
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={(e) => {
                    if (!disabled) {
                        onChange(name, e.target.value);
                    }
                }}
                disabled={disabled}
                className={styles.radio}
            />
            <span className={styles.customRadio}></span>
            {label && <span className={`${styles.t5} ${styles.label}`}>{label}</span>}
        </label>
    );
};

export default Radio;
