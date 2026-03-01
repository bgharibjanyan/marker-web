'use client';

import {useState} from "react";
import styles from "./TextInput.module.scss";

const TextInput = ({
                       type = "text",
                       name,
                       placeholder,
                       value,
                       onChange,
                       shadowColor,
                       textColor,
                       label,
                       width,
                       casual = false,
                   }) => {

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(prev => !prev);
    };

    return (
        <div className={styles.inputField}>
            {label && <span className={`${styles.t5} ${styles.fieldLabel}`}>{label}</span>}
            <div className={`${styles.inputContainer} ${casual ? styles.casual : ''}`}>
                <input
                    type={type === "password" ? (isPasswordVisible ? "text" : "password") : type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        onChange(name, e.target.value)
                    }}
                    className={styles.input}
                    style={{
                        color: textColor,
                        width,
                        "--shadow-color": shadowColor || "#9E373E",
                    }}
                />
                {type === "password" && (
                    <div className={styles.visibilityAction}>
                        <button type="button" className={styles.iconButton} onClick={togglePasswordVisibility}>
                            <svg className={`${styles.icon} ${isPasswordVisible ? styles.shown : styles.hidden}`}>
                                <use
                                    href={`/images/sprites.svg#${isPasswordVisible ? "hide-password-icon" : "show-password-icon"}`}></use>
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextInput;
