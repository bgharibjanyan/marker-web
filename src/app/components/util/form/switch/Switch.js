'use client';

import {useEffect, useState} from "react";
import styles from "./Switch.module.scss";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";

const Switch = ({
                         name,
                         checked = false,
                         onChange,
                         label,
                         shadowColor,
                         width,
                         casual = false,
                         activeColor = ColorSelector("--g-color8"),
                         inactiveColor = ColorSelector("--g-color19")
                     }) => {

    const [isOn, setIsOn] = useState(checked);

    useEffect(() => {
        setIsOn(Boolean(checked));
    }, [checked]);

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
