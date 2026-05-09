"use client"
import styles from "./page.module.scss";

import RecEventsSlider from "@/app/components/RecEventsSlider/RecEventsSlider";
import NetworkWidget from "@/app/components/widgets/Network/Network";
import Button from "@/app/components/util/buttons/MarkerButton/Button";
import {usePopup} from "@/app/components/overlays/popup/PopupProvider/PopupProvider";
import {useTranslations} from "next-intl";

import CommonTasksWidget from "@/app/components/widgets/tasks/CommonTasksWidget/CommonTasksWidget";
import CreateEvent from "@/app/components/overlays/popup/CreateEvent/CreateEvent";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";

export default function Dashboard() {
    const {openPopup} = usePopup();
    const t = useTranslations('Dashboard');
    const slides = [
        {
            url: "#",
            imgSrc: '/uploads/slider/1.png'
        }, {
            url: "#",
            imgSrc: '/uploads/slider/2.png'
        }, {
            url: "#",
            imgSrc: '/uploads/slider/3.png'
        }, {
            url: "#",
            imgSrc: '/uploads/slider/4.png'
        }, {
            url: "#",
            imgSrc: '/uploads/slider/5.png'
        }
    ]

    return (
        <div>
            <RecEventsSlider slides={slides}></RecEventsSlider>

            <div className={styles.homePageHeading}>
                <div className={styles.textContent}>
                    <h3 className={styles.headline}>{t('greeting')}</h3>
                    <span className={`${styles.subHeadline} ${styles.t6}`}>{t('welcome')}</span>
                </div>

                <Button
                    type="primary"
                    text={t('createTask')}
                    size="s"
                    bgColor={ColorSelector("--g-color13")}
                    textColor={ColorSelector("--g-color1")}
                    maxWidth="160px"
                    casual={true}
                    onClick={() => {
                        openPopup(
                            <CreateEvent></CreateEvent>,
                        )
                    }}
                    shadowColor={ColorSelector("--g-color8")}
                />
            </div>

            <div className={styles.contentContainer}>
                <div className={styles.leftSidebar}>
                    <NetworkWidget></NetworkWidget>
                </div>
                <div className={styles.mainContent}></div>
                <div className={styles.rightSidebar}>
                    <CommonTasksWidget></CommonTasksWidget>
                </div>
            </div>
        </div>
    );
}
