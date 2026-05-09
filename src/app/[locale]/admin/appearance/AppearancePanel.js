"use client";

import {useEffect, useMemo, useState} from "react";
import styles from "./page.module.scss";
import {
    AdminButton,
    AdminCheckboxField,
    AdminFormGrid,
    AdminPageHeader,
    AdminPanel,
    AdminStatusMessage,
    AdminTextField
} from "@/app/components/admin";

const SLIDER_STORAGE_KEY = "marker-admin-homepage-slider";

const defaultSlides = [
    {id: "SLD-001", imgSrc: "/uploads/slider/1.png", url: "#", alt: "Slider image 1", active: true},
    {id: "SLD-002", imgSrc: "/uploads/slider/2.png", url: "#", alt: "Slider image 2", active: true},
    {id: "SLD-003", imgSrc: "/uploads/slider/3.png", url: "#", alt: "Slider image 3", active: true},
    {id: "SLD-004", imgSrc: "/uploads/slider/4.png", url: "#", alt: "Slider image 4", active: true},
    {id: "SLD-005", imgSrc: "/uploads/slider/5.png", url: "#", alt: "Slider image 5", active: true}
];

export default function AppearancePanel() {
    const [slides, setSlides] = useState(defaultSlides);
    const [selectedId, setSelectedId] = useState(defaultSlides[0].id);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const storedSlides = window.localStorage.getItem(SLIDER_STORAGE_KEY);

        if (!storedSlides) {
            return;
        }

        try {
            const parsedSlides = JSON.parse(storedSlides);
            if (Array.isArray(parsedSlides) && parsedSlides.length) {
                setSlides(parsedSlides);
                setSelectedId(parsedSlides[0].id);
            }
        } catch (err) {
            window.localStorage.removeItem(SLIDER_STORAGE_KEY);
        }
    }, []);

    const selectedSlide = useMemo(
        () => slides.find((slide) => slide.id === selectedId) ?? slides[0],
        [selectedId, slides]
    );

    const activeSlides = slides.filter((slide) => slide.active);

    const updateSlide = (field, value) => {
        setIsSaved(false);
        setSlides((currentSlides) => (
            currentSlides.map((slide) => (
                slide.id === selectedSlide.id ? {...slide, [field]: value} : slide
            ))
        ));
    };

    const addSlide = () => {
        const nextIndex = slides.reduce((maxIndex, slide) => {
            const numericId = Number(slide.id.replace("SLD-", ""));
            return Number.isFinite(numericId) ? Math.max(maxIndex, numericId) : maxIndex;
        }, 0) + 1;

        const nextSlide = {
            id: `SLD-${String(nextIndex).padStart(3, "0")}`,
            imgSrc: "/uploads/slider/1.png",
            url: "#",
            alt: `Slider image ${nextIndex}`,
            active: true
        };

        setSlides((currentSlides) => [...currentSlides, nextSlide]);
        setSelectedId(nextSlide.id);
        setIsSaved(false);
    };

    const deleteSlide = () => {
        if (slides.length === 1) {
            return;
        }

        const nextSlides = slides.filter((slide) => slide.id !== selectedSlide.id);
        setSlides(nextSlides);
        setSelectedId(nextSlides[0].id);
        setIsSaved(false);
    };

    const saveSlides = () => {
        window.localStorage.setItem(SLIDER_STORAGE_KEY, JSON.stringify(slides));
        setIsSaved(true);
    };

    if (!selectedSlide) {
        return null;
    }

    return (
        <section className={styles.appearancePage}>
            <AdminPageHeader eyebrow="Appearance" title="Homepage slider">
                <AdminButton onClick={addSlide}>
                    Add image
                </AdminButton>
            </AdminPageHeader>

            <div className={styles.workspace}>
                <AdminPanel title="Images" meta={`${activeSlides.length} active`}>
                    <div className={styles.slideGrid}>
                        {slides.map((slide) => (
                            <button
                                type="button"
                                key={slide.id}
                                className={`${styles.slideThumb} ${slide.id === selectedSlide.id ? styles.active : ""}`}
                                onClick={() => setSelectedId(slide.id)}
                            >
                                <img src={slide.imgSrc} alt={slide.alt} onError={(event) => event.currentTarget.classList.add(styles.hiddenImage)}/>
                                <span>{slide.id}</span>
                            </button>
                        ))}
                    </div>
                </AdminPanel>

                <AdminPanel
                    title={selectedSlide.id}
                    actions={(
                        <>
                            <AdminButton variant="secondary" onClick={deleteSlide}>
                                Delete
                            </AdminButton>
                            <AdminButton onClick={saveSlides}>
                                Save
                            </AdminButton>
                        </>
                    )}
                >
                    {isSaved ? <AdminStatusMessage>Slider images saved.</AdminStatusMessage> : null}

                    <AdminFormGrid>
                        <AdminTextField
                            label="Image path"
                            value={selectedSlide.imgSrc}
                            onChange={(value) => updateSlide("imgSrc", value)}
                        />
                        <AdminTextField
                            label="Link URL"
                            value={selectedSlide.url}
                            onChange={(value) => updateSlide("url", value)}
                        />
                        <AdminTextField
                            label="Alt text"
                            value={selectedSlide.alt}
                            onChange={(value) => updateSlide("alt", value)}
                        />
                        <AdminCheckboxField
                            plain
                            label="Active slide"
                            checked={selectedSlide.active}
                            onChange={(checked) => updateSlide("active", checked)}
                        />
                    </AdminFormGrid>

                    <div className={styles.largePreview}>
                        <img src={selectedSlide.imgSrc} alt={selectedSlide.alt}/>
                    </div>
                </AdminPanel>
            </div>
        </section>
    );
}
