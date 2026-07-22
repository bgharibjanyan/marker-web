"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {usePopup} from "@/app/components/overlays/popup/PopupProvider/PopupProvider";
import RichTextContent from "@/app/components/util/RichTextContent/RichTextContent";
import styles from "./PostReviewPopup.module.scss";

const localeMap = {
    arm: "hy-AM",
    en: "en-US",
    ru: "ru-RU",
};

export default function PostReviewPopup({post}) {
    const t = useTranslations("PostArchive");
    const locale = useLocale();
    const {closePopup} = usePopup();
    const media = Array.isArray(post?.media) ? post.media : [];
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);
    const activeMedia = media[activeMediaIndex];
    const formattedDate = useMemo(() => {
        if (!post?.createdAt) {
            return "";
        }

        const date = new Date(post.createdAt);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return new Intl.DateTimeFormat(localeMap[locale] || locale, {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(date);
    }, [locale, post?.createdAt]);

    const showPrevious = () => {
        setActiveMediaIndex((currentIndex) => (
            currentIndex === 0 ? media.length - 1 : currentIndex - 1
        ));
    };

    const showNext = () => {
        setActiveMediaIndex((currentIndex) => (
            currentIndex === media.length - 1 ? 0 : currentIndex + 1
        ));
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                closePopup();
            }

            if (media.length > 1 && event.key === "ArrowLeft") {
                showPrevious();
            }

            if (media.length > 1 && event.key === "ArrowRight") {
                showNext();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [closePopup, media.length]);

    return (
        <article className={styles.review} aria-label={post?.title}>
            <button
                className={styles.closeButton}
                type="button"
                onClick={closePopup}
                aria-label={t("actions.close")}
            >
                &times;
            </button>

            <div className={styles.mediaStage}>
                {activeMedia ? (
                    <img src={activeMedia} alt={post?.title || ""}/>
                ) : (
                    <span className={styles.noImage}>{t("states.noImage")}</span>
                )}

                {media.length > 1 ? (
                    <>
                        <button className={`${styles.navButton} ${styles.previous}`} type="button" onClick={showPrevious} aria-label={t("actions.previousImage")}>&lsaquo;</button>
                        <button className={`${styles.navButton} ${styles.next}`} type="button" onClick={showNext} aria-label={t("actions.nextImage")}>&rsaquo;</button>
                        <span className={styles.counter}>{activeMediaIndex + 1} / {media.length}</span>
                    </>
                ) : null}
            </div>

            <div className={styles.details}>
                <div className={styles.titleRow}>
                    <h2>{post?.title}</h2>
                    {formattedDate ? <time dateTime={post.createdAt}>{t("labels.published")} {formattedDate}</time> : null}
                </div>
                <RichTextContent
                    value={post?.description}
                    className={styles.description}
                    fallback={<p className={styles.emptyDescription}>{t("states.noDescription")}</p>}
                />
            </div>
        </article>
    );
}
