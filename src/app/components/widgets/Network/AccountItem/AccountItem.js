"use client";

import styles from "./AccountItem.module.scss";
import {useTranslations} from "next-intl";

const defaultProfilePicture = "/uploads/profiles/default/image.png";
const getProfilePicture = (user) => user?.profilePicture || defaultProfilePicture;

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
                    src={getProfilePicture(user)}
                    alt={t('alt.userAvatar')}
                    onError={(e) => {
                        e.currentTarget.src = defaultProfilePicture;
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
