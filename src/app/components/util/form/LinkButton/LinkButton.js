"use client";

import styles from "./LinkButton.module.scss";
import { ColorSelector } from "@/app/scripts/HelperFunctions/colorSelector";
import { useState } from "react";

const LinkButton = ({
                        text,
                        url,
                        onClick,
                        underline = false,
                        color = "inherit",
                        hoverColor = ColorSelector("--g-color6")
                    }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            className={`${styles.t5} ${styles.linkButton} ${underline ? styles.underline : ""}`}
            onClick={onClick ? onClick : () => (url ? (window.location.href = url) : null)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                color: isHovered ? hoverColor : color,
                cursor: "pointer",
                background: "none",
                border: "none"
            }}
        >
            {text}
        </button>
    );
};

export default LinkButton;
