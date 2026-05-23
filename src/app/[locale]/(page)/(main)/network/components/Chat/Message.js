"use client";

import {useState} from "react";
import styles from "./Chat.module.scss";

const getMessageText = (message) => {
    if (message?.content?.type !== "text") {
        return "";
    }

    return message.content.value || "";
};

const formatMessageTime = (time) => {
    const date = new Date(time);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};

export default function Message({message, isOwn, onEdit, labels}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const text = getMessageText(message);

    const handleEdit = () => {
        setIsMenuOpen(false);
        onEdit(message);
    };

    return (
        <div className={`${styles.messageRow} ${isOwn ? styles.own : styles.their}`}>
            <div className={styles.messageBubble}>
                <p className={`${styles.t5} ${styles.messageText}`}>{text}</p>
                <time className={styles.messageTime} dateTime={message.time}>
                    {formatMessageTime(message.time)}
                </time>

                {isOwn && (
                    <div className={styles.messageMenu}>
                        <button
                            type="button"
                            className={styles.contextButton}
                            aria-label={labels.menu}
                            aria-expanded={isMenuOpen}
                            onClick={() => setIsMenuOpen((value) => !value)}
                        >
                            <span>...</span>
                        </button>

                        {isMenuOpen && (
                            <div className={styles.contextMenu} role="menu">
                                <button type="button" role="menuitem" onClick={handleEdit}>
                                    {labels.edit}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
