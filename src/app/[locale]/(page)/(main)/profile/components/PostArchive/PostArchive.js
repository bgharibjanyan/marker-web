"use client";

import {useCallback, useEffect, useState} from "react";
import {useTranslations} from "next-intl";
import Button from "@/app/components/util/buttons/MarkerButton/Button";
import {usePopup} from "@/app/components/overlays/popup/PopupProvider/PopupProvider";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import {useRouter} from "@/i18n/navigation";
import PostReviewPopup from "../PostReviewPopup/PostReviewPopup";
import styles from "./PostArchive.module.scss";

export default function PostArchive() {
    const t = useTranslations("PostArchive");
    const router = useRouter();
    const {openPopup} = usePopup();
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadPosts = useCallback(async () => {
        setIsLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("marker_im_token");
            const response = await fetch("/api/post/get-user-posts", {
                headers: {
                    ...(token ? {Authorization: token} : {}),
                },
            });
            const data = await response.json();

            if (!response.ok) {
                setPosts([]);
                setError(data?.error || t("states.error"));
                return;
            }

            setPosts(data?.posts || []);
        } catch (requestError) {
            setPosts([]);
            setError(t("states.error"));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        loadPosts();

        window.addEventListener("marker:posts-updated", loadPosts);
        return () => window.removeEventListener("marker:posts-updated", loadPosts);
    }, [loadPosts]);

    const openPost = (post) => {
        openPopup(<PostReviewPopup post={post}/>);
    };

    return (
        <main className={styles.archivePage}>
            <header className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>{t("eyebrow")}</span>
                    <h1>{t("title")}</h1>
                    <p>{t("subtitle")}</p>
                </div>
                <Button
                    text={t("actions.backToProfile")}
                    size="M"
                    padding="9px 16px"
                    bgColor={ColorSelector("--g-color2")}
                    textColor={ColorSelector("--g-color1")}
                    onClick={() => router.push("/profile")}
                />
            </header>

            {isLoading ? (
                <div className={styles.stateCard}>{t("states.loading")}</div>
            ) : error ? (
                <div className={`${styles.stateCard} ${styles.error}`}>{error}</div>
            ) : posts.length === 0 ? (
                <div className={styles.stateCard}>{t("states.empty")}</div>
            ) : (
                <section className={styles.grid} aria-label={t("title")}>
                    {posts.map((post) => {
                        const media = Array.isArray(post.media) ? post.media : [];
                        const cover = media[0];

                        return (
                            <button
                                className={styles.postItem}
                                type="button"
                                key={post._id}
                                onClick={() => openPost(post)}
                                aria-label={t("actions.open", {title: post.title})}
                            >
                                {cover ? (
                                    <img src={cover} alt=""/>
                                ) : (
                                    <span className={styles.noImage}>{t("states.noImage")}</span>
                                )}
                                {media.length > 1 ? (
                                    <span className={styles.mediaCount}>+{media.length - 1}</span>
                                ) : null}
                                <span className={styles.postTitle}>{post.title}</span>
                            </button>
                        );
                    })}
                </section>
            )}
        </main>
    );
}
