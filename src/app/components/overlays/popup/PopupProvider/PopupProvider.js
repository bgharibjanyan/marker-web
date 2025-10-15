// components/PopupProvider.js
"use client";
import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./PopupProvider.module.scss";


const PopupContext = createContext();

export function PopupProvider({ children }) {
    const [popup, setPopup] = useState({ isOpen: false, content: null });

    const openPopup = (content) => setPopup({ isOpen: true, content });
    const closePopup = () => setPopup({ isOpen: false, content: null });

    return (
        <PopupContext.Provider value={{ openPopup, closePopup }}>
            {children}

            {popup.isOpen &&
                createPortal(
                    <div className={styles.overlay} onClick={closePopup}>
                        <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
                            {popup.content}
                            <button onClick={closePopup}>Close</button>
                        </div>,
                    </div>,
                    document.body
                )
            }
        </PopupContext.Provider>
    );
}

export function usePopup() {
    return useContext(PopupContext);
}
