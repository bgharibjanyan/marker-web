import styles from "./Button.module.scss";

export default function Button({
                                   type = "primary",
                                   text,
                                   icon,
                                   bgColor,
                                   textColor,
                                   width,
                                   onClick,
                                   shadowColor,
                                   casual = false,
                               }) {
    return (
        <div className={'buttonContainer'}>
            <button
                className={`${styles.button} ${styles[type] } ${casual?'casual':''} `}
                style={{backgroundColor: bgColor, color: textColor, width}}
                onClick={onClick}
            >
                {icon && <span className={styles.icon}>{icon}</span>}
                {text}
            </button>

            { casual &&
                <div
                    style={{backgroundColor: shadowColor ?shadowColor: '#9E373E'}}
                className={'shadow'}></div>
            }
        </div>

    );
}
