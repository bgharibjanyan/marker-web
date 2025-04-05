"use client";

import styles from "./Checkbox.module.scss";

const Checkbox = ({ name, label, checked, onChange }) => {
    return (
        <label className={styles.checkboxContainer}>
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                className={styles.checkbox}
            />
            <span className={styles.customCheckbox}></span>
            {label && <span className={`${styles.t5} ${styles.label}`}>{label}</span>}
        </label>
    );
};

export default Checkbox;
