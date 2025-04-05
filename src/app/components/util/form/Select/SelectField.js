'use client';

import styles from "./SelectField.module.scss";

const SelectField = ({
                         name,
                         label,
                         value,
                         onChange,
                         options = [],
                         shadowColor,
                         textColor,
                         width,
                         casual = false,
                     }) => {
    return (
        <div className={styles.selectField}>
            {label && <span className={`${styles.t5} ${styles.fieldLabel}`}>{label}</span>}
            <div className={`${styles.selectContainer} ${casual ? styles.casual : ''}`}>
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={styles.select}
                    style={{
                        color: textColor,
                        width,
                        "--shadow-color": shadowColor || "#9E373E",
                    }}
                >
                    {options.map((option, index) => (
                        <option key={index} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <div className={styles.arrowIcon}>
                    <svg className={styles.icon}>
                        <use href="/images/sprites.svg#dropdown-arrow-icon"></use>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default SelectField;
