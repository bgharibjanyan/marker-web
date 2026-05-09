'use client';

import styles from "./SelectField.module.scss";
import {useEffect} from 'react';
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";

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
    useEffect(() => {
        if (!value && options.length > 0) {
            onChange(name, options[0].value);
        }
    }, [value, options, name, onChange]);

    return (
        <div className={styles.selectField}>
            {label && <span className={`${styles.t5} ${styles.fieldLabel}`}>{label}</span>}
            <div className={`${styles.selectContainer} ${casual ? styles.casual : ''}`}>
                <select
                    name={name}
                    value={value ?? options[0]?.value}
                    onChange={(e) => onChange(name, e.target.value)}
                    className={styles.select}
                    style={{
                        color: textColor,
                        width,
                        "--shadow-color": shadowColor || ColorSelector("--g-color8"),
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
