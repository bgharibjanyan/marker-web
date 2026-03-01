'use client';

import { useState } from "react";
import styles from "./Switch.module.scss";

const Switch = ({
                         name,
                         checked = false,
                         onChange,
                         label,
                         shadowColor,
                         width,
                         casual = false,
                         activeColor = "#9E373E",
                         inactiveColor = "#ccc"
                     }) => {

    const [isOn, setIsOn] = useState(checked);

    const handleToggle = () => {
        const newValue = !isOn;
        setIsOn(newValue);
        if (onChange) onChange(name, newValue);
    };

    return (
        <div className={styles.switchField} style={{ width }}>

            {label && <span className={`${styles.t5} ${styles.fieldLabel}`}>{label}</span>}

            <div
                className={`${styles.switchContainer} ${casual ? styles.casual : ''}`}
                style={{
                    "--shadow-color": shadowColor || activeColor,
                }}
            >
                <button
                    type="button"
                    role="switch"
                    aria-checked={isOn}
                    onClick={handleToggle}
                    className={`${styles.switch} ${isOn ? styles.on : styles.off}`}
                    style={{
                        "--active-color": activeColor,
                        "--inactive-color": inactiveColor,
                    }}
                >
                    <span className={styles.thumb}></span>
                </button>
            </div>
        </div>
    );
};

export default Switch;
