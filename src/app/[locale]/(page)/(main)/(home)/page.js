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
import {useEffect, useState} from "react";

const SLIDER_STORAGE_KEY = "marker-admin-homepage-slider";

const defaultSlides = [
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

export default function Dashboard() {
    const {openPopup} = usePopup();
    const t = useTranslations('Dashboard');
    const [slides, setSlides] = useState(defaultSlides);

    useEffect(() => {
        const storedSlides = window.localStorage.getItem(SLIDER_STORAGE_KEY);

        if (!storedSlides) {
            return;
        }

        try {
            const parsedSlides = JSON.parse(storedSlides);
            if (!Array.isArray(parsedSlides)) {
                return;
            }

            const homepageSlides = parsedSlides
                .filter((slide) => slide.active)
                .map((slide) => ({
                    url: slide.url || "#",
                    imgSrc: slide.imgSrc
                }))
                .filter((slide) => slide.imgSrc);

            setSlides(homepageSlides);
        } catch (err) {
            window.localStorage.removeItem(SLIDER_STORAGE_KEY);
        }
    }, []);

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
