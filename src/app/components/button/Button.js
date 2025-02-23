import styles from "./Button.module.scss";

export default function Button({
                                   type = "primary",
                                   text,
                                   icon,
                                   bgColor,
                                   textColor,
                                   width,
                                   onClick
                               }) {
    return (
        <button
            className={`${styles.button} ${styles[type]}`}
            style={{ backgroundColor: bgColor, color: textColor, width }}
            onClick={onClick}
        >
            {icon && <span className={styles.icon}>{icon}</span>}
            {text}
        </button>
    );
}
