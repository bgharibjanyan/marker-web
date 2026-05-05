import styles from "./styles.module.scss";
import LinkButton from "@/app/components/util/form/LinkButton/LinkButton";
import {getTranslations} from "next-intl/server";

export default async () => {
    const t = await getTranslations('Admin.sidebar');

    const navigationList = [
        {
            label: t('personalization'),
            url: "personalization"
        }, {
            label: t('accounts'),
            url: "accounts"
        }, {
            label: t('ads'),
            url: "adds"
        }, {
            label: t('personalization'),
            url: "personalization"
        }, {
            label: t('accounts'),
            url: "accounts"
        }, {
            label: t('ads'),
            url: "adds"
        }, {
            label: t('personalization'),
            url: "personalization"
        }, {
            label: t('accounts'),
            url: "accounts"
        }, {
            label: t('ads'),
            url: "adds"
        },
    ]

    return (
        <div className={styles.sidebar}>
            <div className={styles.headline}>
                <span className={styles.t3}>{t('title')}</span>
            </div>

            {/*<button className={styles.toggleButton}>*/}
            {/*    <svg className={`${styles.icon} ${styles.next}`}>*/}
            {/*        <use href={`/images/sprites.svg#icon-arrow-right`}></use>*/}
            {/*    </svg>*/}
            {/*</button>*/}

            <div className={styles.navList}>
                {navigationList.map((item, index) => (
                        <div key={index} className={styles.navItem}>
                            <LinkButton
                                text={item.label}
                                url={item.url}
                            />
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
