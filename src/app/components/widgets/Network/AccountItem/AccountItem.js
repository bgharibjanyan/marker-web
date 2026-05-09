"use client";

import styles from "./AccountItem.module.scss";
import {useTranslations} from "next-intl";

const NetworkWidget = ({user = null, isFriend = false, isSelected = false, friendLabel = null, onClick}) => {
    const t = useTranslations('Global');

    return (
        <div
            className={`${styles.userItemContainer} ${isFriend ? styles.friend : ""} ${isSelected ? styles.selected : ""}`}
            onClick={onClick}
        >
            <div className={styles.userInfo}>
                <img
                    className={styles.userAvatar}
                    src={`/uploads/profiles/${user.id || user._id}.png`}
                    alt={t('alt.userAvatar')}
                    onError={(e) => {
                        e.target.src = "/uploads/profiles/default/image.png";
                    }}
                />
                <div className={styles.textInfo}>
                    <span className={`${styles.t5} ${styles.userName}`}>{user.firstname} {user.lastname}</span>
                    <br/>
                    <span className={`${styles.t7} ${styles.userMail}`}>{user.email}</span>
                </div>
            </div>

            {isFriend && friendLabel && (
                <span className={`${styles.t7} ${styles.friendBadge}`}>{friendLabel}</span>
            )}
        </div>
    );
};

export default NetworkWidget;
