'use client';

import {useState} from "react";
import styles from "./TextInput.module.scss";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";

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
                       disabled = false,
                       onKeyDown,
                       actionIcon = null,
                       actionLabel = "",
                       actionButtonType = "button",
                       actionDisabled = false,
                       onActionClick,
                   }) => {

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(prev => !prev);
    };

    return (
        <div className={styles.inputField}>
            {label && <span className={`${styles.t5} ${styles.fieldLabel}`}>{label}</span>}
            <div
                className={`${styles.inputContainer} ${casual ? styles.casual : ''} ${actionIcon && type !== "password" ? styles.hasAction : ""}`}
            >
                <input
                    type={type === "password" ? (isPasswordVisible ? "text" : "password") : type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        onChange(name, e.target.value)
                    }}
                    onKeyDown={onKeyDown}
                    disabled={disabled}
                    className={styles.input}
                    style={{
                        color: textColor,
                        width,
                        "--shadow-color": shadowColor || ColorSelector("--g-color8"),
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
                {actionIcon && type !== "password" && (
                    <div className={styles.fieldAction}>
                        <button
                            type={actionButtonType}
                            className={styles.iconButton}
                            onClick={onActionClick}
                            aria-label={actionLabel}
                            title={actionLabel}
                            disabled={actionDisabled}
                        >
                            <svg className={styles.icon}>
                                <use href={`/images/sprites.svg#${actionIcon}`}></use>
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextInput;
