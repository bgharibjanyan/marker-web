"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {AdminButton, AdminStatusMessage} from "@/app/components/admin";
import TextInput from "@/app/components/util/form/TextInput/TextInput";
import TimeInput from "@/app/components/util/form/TimeInput/TimeInput";
import Switch from "@/app/components/util/form/switch/Switch";
import Radio from "@/app/components/util/form/Radio/Radio";
import WeekdaySelector from "@/app/components/util/form/WeekdaySelector/WeekdaySelector";
import DatePicker from "@/app/components/util/form/DatePicker/DatePicker";
import ColorPicker from "@/app/components/util/form/ColorPicker/ColorPicker";
import TagSelect from "@/app/components/util/form/TagSelect/TagSelect";
import RichTextInput from "@/app/components/util/form/RichTextInput/RichTextInput";
import Button from "@/app/components/util/buttons/MarkerButton/Button";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import {isSupportedMapLink, MAP_LINK_ERROR} from "@/app/lib/mapLinks";
import styles from "./page.module.scss";

const MAX_EVENT_IMAGES = 4;

const repeatTypeOptions = [
    {value: "daily", label: "Daily"},
    {value: "weekly", label: "Weekly"},
    {value: "monthly", label: "Monthly"}
];

const getTodaySelection = () => {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    return {date, monthday: now.getDate()};
};

const getMonthdayFromDate = (date) => {
    const match = String(date || "").match(/^\d{4}-\d{2}-(\d{2})$/);

    return match ? Number(match[1]) : "";
};

const getEventTags = (event) => (
    (event?.tags || [])
        .map((tag) => tag?.name || tag)
        .filter(Boolean)
);

const getInitialFormData = (event = null) => {
    const today = getTodaySelection();

    return {
        title: event?.title || "",
        description: event?.description || "",
        location: event?.location || "",
        start: event?.start || "09:00",
        end: event?.end || "",
        date: event?.date || today.date,
        monthday: event?.monthday || today.monthday,
        repeat: Boolean(event?.repeat),
        repeatType: event?.repeatType || "",
        weekdays: Array.isArray(event?.weekdays) ? event.weekdays : [],
        color: event?.color || "#7c72ff",
        media: Array.isArray(event?.media) ? event.media : [],
        mediaFiles: [],
        tags: getEventTags(event),
        isPrivate: Boolean(event?.isPrivate)
    };
};

const buildPayload = (formData) => {
    const isDateDisabled = formData.repeat && (formData.repeatType === "daily" || formData.repeatType === "weekly");

    return {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start: formData.start,
        end: formData.end,
        date: isDateDisabled ? null : formData.date,
        monthday: isDateDisabled ? null : Number(formData.monthday || getMonthdayFromDate(formData.date) || 0) || null,
        repeat: Boolean(formData.repeat),
        repeatType: formData.repeat ? formData.repeatType : null,
        weekdays: formData.repeat && formData.repeatType === "weekly" ? formData.weekdays : [],
        color: formData.color,
        media: formData.media,
        tags: formData.tags,
        isPrivate: Boolean(formData.isPrivate)
    };
};

export default function EventForm({
    event = null,
    mode = "edit",
    onSubmit,
    onDelete,
    isSaving = false,
    isDeleting = false,
    error = "",
    success = "",
    resetKey = 0
}) {
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState(() => getInitialFormData(event));
    const [mediaPreviews, setMediaPreviews] = useState([]);
    const [popularTags, setPopularTags] = useState([]);
    const [localError, setLocalError] = useState("");
    const isEditing = mode === "edit";
    const isDateDisabled = formData.repeat && (formData.repeatType === "daily" || formData.repeatType === "weekly");

    useEffect(() => {
        setFormData(getInitialFormData(event));
        setLocalError("");
    }, [event?.id, event?.updatedAt, resetKey]);

    useEffect(() => {
        const previews = formData.mediaFiles.map((file) => ({
            name: file.name,
            url: URL.createObjectURL(file)
        }));

        setMediaPreviews(previews);

        return () => {
            previews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [formData.mediaFiles]);

    const loadPopularTags = useCallback(async () => {
        try {
            const response = await fetch("/api/tags?limit=24");
            const data = await response.json();

            if (response.ok) {
                setPopularTags(data.tags || []);
            }
        } catch (error) {
            setPopularTags([]);
        }
    }, []);

    useEffect(() => {
        loadPopularTags();
    }, [loadPopularTags]);

    const subscriberText = useMemo(() => {
        if (!isEditing) {
            return "New event";
        }

        return `${event?.subscriberCount || 0} subscriber${event?.subscriberCount === 1 ? "" : "s"}`;
    }, [event?.subscriberCount, isEditing]);

    const visibleMedia = useMemo(() => ([
        ...formData.media.map((url) => ({
            name: url.split("/").pop() || "Event image",
            url,
            existing: true
        })),
        ...mediaPreviews.map((preview, index) => ({
            ...preview,
            fileIndex: index
        }))
    ]), [formData.media, mediaPreviews]);

    const updateField = (field, value) => {
        if (localError) {
            setLocalError("");
        }

        setFormData((currentData) => {
            if (field === "repeat") {
                const nextCalendar = !value && (!currentData.date || !currentData.monthday) ? getTodaySelection() : {};

                return {
                    ...currentData,
                    repeat: value,
                    repeatType: value ? currentData.repeatType || "weekly" : "",
                    weekdays: value ? currentData.weekdays : [],
                    ...nextCalendar
                };
            }

            if (field === "repeatType") {
                const isCalendarDisabledRepeat = value === "daily" || value === "weekly";
                const nextCalendar = !isCalendarDisabledRepeat && (!currentData.date || !currentData.monthday)
                    ? getTodaySelection()
                    : {};

                return {
                    ...currentData,
                    repeatType: value,
                    weekdays: value === "weekly" ? currentData.weekdays : [],
                    ...(isCalendarDisabledRepeat ? {date: null, monthday: null} : nextCalendar)
                };
            }

            if (field === "date") {
                return {
                    ...currentData,
                    date: value,
                    monthday: getMonthdayFromDate(value) || currentData.monthday
                };
            }

            return {...currentData, [field]: value};
        });
    };

    const handleMediaChange = (eventObject) => {
        const files = Array.from(eventObject.target.files || []);

        if (!files.length) {
            return;
        }

        if (files.some((file) => !file.type.startsWith("image/"))) {
            setLocalError("Only image files can be uploaded.");
            eventObject.target.value = "";
            return;
        }

        setFormData((currentData) => {
            const maxFiles = Math.max(MAX_EVENT_IMAGES - currentData.media.length, 0);
            const nextFiles = [...currentData.mediaFiles, ...files].slice(0, maxFiles);

            if (currentData.mediaFiles.length + files.length > maxFiles) {
                setLocalError(`Events can include up to ${MAX_EVENT_IMAGES} images.`);
            } else {
                setLocalError("");
            }

            return {...currentData, mediaFiles: nextFiles};
        });

        eventObject.target.value = "";
    };

    const removeExistingMedia = (mediaPath) => {
        setFormData((currentData) => ({
            ...currentData,
            media: currentData.media.filter((item) => item !== mediaPath)
        }));
        setLocalError("");
    };

    const removeSelectedMediaFile = (fileIndex) => {
        setFormData((currentData) => ({
            ...currentData,
            mediaFiles: currentData.mediaFiles.filter((file, index) => index !== fileIndex)
        }));
        setLocalError("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const submitForm = () => {
        if (!isSupportedMapLink(formData.location)) {
            setLocalError(MAP_LINK_ERROR);
            return;
        }

        if (formData.media.length + formData.mediaFiles.length > MAX_EVENT_IMAGES) {
            setLocalError(`Events can include up to ${MAX_EVENT_IMAGES} images.`);
            return;
        }

        onSubmit?.(buildPayload(formData), formData.mediaFiles);
    };

    const handleSubmit = (eventObject) => {
        eventObject.preventDefault();
        submitForm();
    };

    return (
        <form className={styles.eventForm} onSubmit={handleSubmit}>
            <div className={styles.formMeta}>
                <span>{subscriberText}</span>
                {isEditing && event?.id ? <strong>{event.id}</strong> : null}
            </div>

            {error || localError ? <AdminStatusMessage type="error">{error || localError}</AdminStatusMessage> : null}
            {success ? <AdminStatusMessage>{success}</AdminStatusMessage> : null}

            <div className={styles.websiteFormGrid}>
                <div className={styles.eventTitleInput}>
                    <TextInput
                        name="title"
                        casual
                        shadowColor={ColorSelector("--g-color8")}
                        label="Title"
                        placeholder="Yoga lesson"
                        value={formData.title}
                        onChange={updateField}
                    />
                </div>
                <div className={styles.eventSwitchInput}>
                    <Switch
                        name="isPrivate"
                        label="Private event"
                        checked={formData.isPrivate}
                        onChange={updateField}
                        casual
                        shadowColor={ColorSelector("--g-color8")}
                        activeColor={ColorSelector("--g-color8")}
                        inactiveColor={ColorSelector("--g-color18")}
                    />
                </div>
                <TextInput
                    name="location"
                    casual
                    shadowColor={ColorSelector("--g-color8")}
                    label="Location map link"
                    placeholder="https://www.google.com/maps/..."
                    value={formData.location}
                    onChange={updateField}
                />
                <div className={styles.eventDescriptionInput}>
                    <RichTextInput
                        name="description"
                        casual
                        shadowColor={ColorSelector("--g-color8")}
                        label="Description"
                        placeholder="Event details"
                        value={formData.description}
                        onChange={updateField}
                        minHeight={260}
                    />
                </div>
            </div>

            <div className={styles.tagsCard}>
                <TagSelect
                    label="Tags"
                    selectedTags={formData.tags || []}
                    popularTags={popularTags}
                    onChange={(tags) => updateField("tags", tags)}
                    placeholder="Create tag"
                />
            </div>

            <div className={styles.colorCard}>
                <ColorPicker
                    name="color"
                    casual
                    shadowColor={ColorSelector("--g-color8")}
                    label="Color"
                    value={formData.color}
                    onChange={updateField}
                />
            </div>

            <div className={styles.repeatCard}>
                <div className={styles.repeatHeader}>
                    <Switch
                        name="repeat"
                        label="Repeating event"
                        checked={formData.repeat}
                        onChange={updateField}
                        casual
                        shadowColor={ColorSelector("--g-color8")}
                        activeColor={ColorSelector("--g-color8")}
                        inactiveColor={ColorSelector("--g-color18")}
                    />
                </div>
                <div className={styles.repeatOptions}>
                    {repeatTypeOptions.map((option) => (
                        <Radio
                            key={option.value}
                            name="repeatType"
                            label={option.label}
                            value={option.value}
                            checked={formData.repeatType === option.value}
                            onChange={updateField}
                            disabled={!formData.repeat}
                        />
                    ))}
                </div>
                {formData.repeat && formData.repeatType === "weekly" ? (
                    <div className={styles.weekdayPickerContainer}>
                        <WeekdaySelector value={formData.weekdays} onChange={updateField}/>
                    </div>
                ) : null}
            </div>

            <div className={styles.scheduleCard}>
                <div className={styles.scheduleTime}>
                    <TimeInput
                        name="start"
                        casual
                        shadowColor={ColorSelector("--g-color8")}
                        label="Start time"
                        placeholder="09:00"
                        value={formData.start || ""}
                        onChange={updateField}
                    />
                    <TimeInput
                        name="end"
                        casual
                        shadowColor={ColorSelector("--g-color8")}
                        label="End time"
                        placeholder="10:00"
                        value={formData.end || ""}
                        onChange={updateField}
                    />
                </div>
                <div className={styles.calendarContainer}>
                    <DatePicker
                        value={formData.monthday}
                        onChange={updateField}
                        disabled={isDateDisabled}
                    />
                </div>
            </div>

            <div className={styles.mediaUploader}>
                <div className={styles.mediaUploaderHeader}>
                    <span>Media images</span>
                    <button
                        type="button"
                        className={styles.mediaUploadButton}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving || isDeleting || visibleMedia.length >= MAX_EVENT_IMAGES}
                    >
                        Upload images
                    </button>
                    <input
                        ref={fileInputRef}
                        className={styles.mediaFileInput}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        multiple
                        onChange={handleMediaChange}
                        disabled={isSaving || isDeleting || visibleMedia.length >= MAX_EVENT_IMAGES}
                    />
                </div>

                {visibleMedia.length ? (
                    <div className={styles.mediaGrid}>
                        {visibleMedia.map((preview) => (
                            <div key={`${preview.url}-${preview.fileIndex ?? preview.name}`} className={styles.mediaPreview}>
                                <img src={preview.url} alt={preview.name}/>
                                <button
                                    type="button"
                                    onClick={() => preview.existing
                                        ? removeExistingMedia(preview.url)
                                        : removeSelectedMediaFile(preview.fileIndex)
                                    }
                                    aria-label={`Remove ${preview.name}`}
                                    title={`Remove ${preview.name}`}
                                >
                                    x
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No image files selected.</p>
                )}
            </div>

            <div className={styles.formActions}>
                {isEditing && onDelete ? (
                    <AdminButton variant="danger" onClick={onDelete} disabled={isDeleting || isSaving}>
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AdminButton>
                ) : null}
                <Button
                    text={isSaving ? "Saving..." : (isEditing ? "Save changes" : "Create event")}
                    bgColor={ColorSelector("--g-color13")}
                    textColor={ColorSelector("--g-color1")}
                    width="auto"
                    onClick={submitForm}
                    disabled={isSaving || isDeleting}
                    casual
                    shadowColor={ColorSelector("--g-color8")}
                    padding="10px 24px"
                />
            </div>
        </form>
    );
}
