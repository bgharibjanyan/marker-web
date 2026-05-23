'use client';

import {useEffect, useRef, useState} from "react";
import {useTranslations} from "next-intl";
import Button from "@/app/components/util/buttons/MarkerButton/Button";
import {usePopup} from "@/app/components/overlays/popup/PopupProvider/PopupProvider";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import styles from "./CreatePost.module.scss";

const MAX_POST_IMAGES = 4;

const getEntityId = (entity) => String(entity?._id || entity?.id || "");

export default function CreatePost({task = null, post = null, onSaved, onCancel} = {}) {
    const t = useTranslations("CreatePost");
    const {closePopup} = usePopup();
    const fileInputRef = useRef(null);
    const taskId = getEntityId(task) || String(post?.task || "");
    const postId = getEntityId(post);
    const isEditing = Boolean(postId);
    const [title, setTitle] = useState(post?.title || "");
    const [description, setDescription] = useState(post?.description || "");
    const [mediaFiles, setMediaFiles] = useState([]);
    const [mediaPreviews, setMediaPreviews] = useState([]);
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const existingMedia = Array.isArray(post?.media) ? post.media : [];

    useEffect(() => {
        const previews = mediaFiles.map((file) => ({
            name: file.name,
            url: URL.createObjectURL(file),
        }));

        setMediaPreviews(previews);

        return () => {
            previews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [mediaFiles]);

    const visibleMedia = mediaPreviews.length
        ? mediaPreviews
        : existingMedia.map((url) => ({
            name: url.split("/").pop() || t("form.existingImage"),
            url,
            existing: true,
        }));

    const validateForm = () => {
        if (!taskId) {
            return t("validation.taskRequired");
        }

        if (!title.trim()) {
            return t("validation.titleRequired");
        }

        if (mediaFiles.length > MAX_POST_IMAGES) {
            return t("validation.mediaLimit");
        }

        return "";
    };

    const handleMediaChange = (event) => {
        const files = Array.from(event.target.files || []);

        if (formError) {
            setFormError("");
        }

        if (!files.length) {
            return;
        }

        if (files.some((file) => !file.type.startsWith("image/"))) {
            setFormError(t("validation.mediaType"));
            event.target.value = "";
            return;
        }

        setMediaFiles((currentFiles) => {
            const nextFiles = [...currentFiles, ...files];

            if (nextFiles.length > MAX_POST_IMAGES) {
                setFormError(t("validation.mediaLimit"));
            }

            return nextFiles.slice(0, MAX_POST_IMAGES);
        });

        event.target.value = "";
    };

    const removeSelectedImage = (index) => {
        setMediaFiles((currentFiles) => currentFiles.filter((file, fileIndex) => fileIndex !== index));

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async () => {
        const error = validateForm();

        if (error) {
            setFormError(error);
            return;
        }

        setFormError("");
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            const token = localStorage.getItem("marker_im_token");

            formData.append("task", taskId);
            formData.append("title", title.trim());
            formData.append("description", description.trim());

            if (isEditing) {
                formData.append("postId", postId);
            }

            mediaFiles.forEach((file) => {
                formData.append("media", file);
            });

            const response = await fetch(isEditing ? "/api/post/edit-post" : "/api/post/create-post", {
                method: "POST",
                headers: {
                    ...(token ? {Authorization: token} : {}),
                },
                body: formData,
            });
            const data = await response.json();

            if (!response.ok) {
                setFormError(data?.error || t(isEditing ? "validation.updateFailed" : "validation.createFailed"));
                return;
            }

            if (onSaved) {
                await onSaved(data.post);
            } else {
                window.dispatchEvent(new CustomEvent("marker:posts-updated"));
            }

            closePopup();
        } catch (error) {
            setFormError(t(isEditing ? "validation.updateFailed" : "validation.createFailed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        if (typeof onCancel === "function") {
            onCancel();
        }

        closePopup();
    };

    return (
        <div className={styles.contentContainer}>
            <h5 className={`${styles.title} ${styles.t3}`}>{t(isEditing ? "editTitle" : "title")}</h5>
            <span className={`${styles.description} ${styles.t6}`}>
                {t(isEditing ? "editDescription" : "description")}
            </span>

            <div className={styles.formContainer}>
                <label className={styles.field}>
                    <span className={`${styles.fieldLabel} ${styles.t5}`}>{t("form.titleLabel")}</span>
                    <input
                        className={styles.input}
                        type="text"
                        value={title}
                        placeholder={t("form.titlePlaceholder")}
                        onChange={(event) => {
                            setTitle(event.target.value);
                            setFormError("");
                        }}
                    />
                </label>

                <label className={styles.field}>
                    <span className={`${styles.fieldLabel} ${styles.t5}`}>{t("form.descriptionLabel")}</span>
                    <textarea
                        className={styles.textarea}
                        value={description}
                        placeholder={t("form.descriptionPlaceholder")}
                        onChange={(event) => {
                            setDescription(event.target.value);
                            setFormError("");
                        }}
                    />
                </label>

                <div className={styles.mediaPicker}>
                    <span className={`${styles.fieldLabel} ${styles.t5}`}>{t("form.mediaLabel")}</span>
                    <input
                        ref={fileInputRef}
                        className={styles.fileInput}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        onChange={handleMediaChange}
                    />
                    <button
                        type="button"
                        className={styles.uploadButton}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting}
                    >
                        {t("form.mediaButton")}
                    </button>

                    {visibleMedia.length > 0 && (
                        <div className={styles.mediaGrid}>
                            {visibleMedia.map((preview, index) => (
                                <div className={styles.mediaPreview} key={`${preview.url}-${index}`}>
                                    <img src={preview.url} alt={preview.name}/>
                                    {!preview.existing && (
                                        <button
                                            type="button"
                                            className={styles.removeMedia}
                                            onClick={() => removeSelectedImage(index)}
                                            aria-label={t("form.removeImage")}
                                            title={t("form.removeImage")}
                                        >
                                            x
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.actionBar}>
                    <div className={styles.actions}>
                        <Button
                            text={t("actions.cancel")}
                            bgColor={ColorSelector("--g-color1")}
                            textColor={ColorSelector("--g-color2")}
                            width="auto"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            casual={true}
                            shadowColor={ColorSelector("--g-color8")}
                            padding="10px 24px"
                        />
                        <Button
                            type="primary"
                            text={isSubmitting
                                ? t(isEditing ? "actions.updating" : "actions.saving")
                                : t(isEditing ? "actions.update" : "actions.submit")}
                            bgColor={ColorSelector("--g-color13")}
                            textColor={ColorSelector("--g-color1")}
                            width="auto"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            casual={true}
                            shadowColor={ColorSelector("--g-color8")}
                            padding="10px 24px"
                        />
                    </div>

                    {formError && (
                        <span className={`${styles.formError} ${styles.t6}`}>{formError}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
