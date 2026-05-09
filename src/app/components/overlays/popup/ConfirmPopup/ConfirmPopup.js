"use client";

import {useState} from "react";
import Button from "@/app/components/util/buttons/MarkerButton/Button";
import {usePopup} from "@/app/components/overlays/popup/PopupProvider/PopupProvider";
import styles from "./ConfirmPopup.module.scss";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";

const ConfirmPopup = ({
                          title,
                          message,
                          confirmText,
                          cancelText,
                          onConfirm,
                          onCancel,
                          errorMessage = 'Something went wrong.',
                          confirmColor = ColorSelector("--g-color13"),
                          shadowColor = ColorSelector("--g-color8"),
                      }) => {
    const {closePopup} = usePopup();
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCancel = () => {
        if (onCancel) onCancel();
        closePopup();
    };

    const handleConfirm = async () => {
        setError('');
        setIsSubmitting(true);

        try {
            if (onConfirm) {
                await onConfirm();
            }

            closePopup();
        } catch (error) {
            setError(error?.message || errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.confirmPopup}>
            {title && <h5 className={`${styles.title} ${styles.t3}`}>{title}</h5>}
            {message && <p className={`${styles.message} ${styles.t3}`}>{message}</p>}

            {error && <span className={`${styles.error} ${styles.t3}`}>{error}</span>}

            <div className={styles.actions}>
                <Button
                    text={cancelText}
                    bgColor={ColorSelector("--g-color1")}
                    textColor={ColorSelector("--g-color2")}
                    width="auto"
                    size='sm'
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    casual={true}
                    shadowColor={shadowColor}
                    padding="10px 22px"
                />
                <Button
                    type="primary"
                    text={confirmText}
                    bgColor={confirmColor}
                    textColor={ColorSelector("--g-color1")}
                    width="auto"
                    size='sm'
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    casual={true}
                    shadowColor={shadowColor}
                    padding="10px 22px"
                />
            </div>
        </div>
    );
};

export default ConfirmPopup;
