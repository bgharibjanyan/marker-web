import styles from "./Button.module.scss";

export default function Button({
                                   type = "primary",
                                   text,
                                   icon,
                                   bgColor,
                                   textColor,
                                   width = null,
                                   size = "L",
                                   onClick,
                                   horizontalAlign = null,
                                   shadowColor,
                                   casual = false,
                                   maxWidth = null,
                                   padding = null,
                               }) {
    return (
        <div className={styles.buttonContainer}>
            <button
                type={"button"}
                className={`${styles.button} ${styles[type]} ${styles["btn"+size]} ${casual ? styles.casual : ""}`}
                style={{
                    backgroundColor: bgColor,
                    color: textColor,
                    "--shadow-color": shadowColor || "#9E373E",
                    ...(horizontalAlign && {justifyContent: horizontalAlign,}),
                    ...(width && {width}),
                    ...(maxWidth && {maxWidth}),
                    ...(padding && {padding}),
                }}
                onClick={onClick}
            >
                {icon &&
                    <svg className={`${styles.icon}`}>
                        <use href={`/images/sprites.svg#${icon}`}></use>
                    </svg>
                }
                {text}
            </button>

            {casual && (<div style={{backgroundColor: shadowColor || "#9E373E"}}
                             className={"shadow"}>
            </div>)}
        </div>
    );
}
