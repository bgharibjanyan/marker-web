"use client";

import styles from "./LinkButton.module.scss";

const LinkButton = ({ text, url, onClick, underline = false, color = "inherit" }) => {
    return (
        <button
            className={`${styles.t5} ${styles.linkButton} ${underline ? styles.underline : ""}`}
            onClick={onClick ? onClick : () => (url ? (window.location.href = url) : null)}
            style={{ color: color }}
        >
            {text}
        </button>
    );
};

export default LinkButton;
