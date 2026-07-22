"use client";

import {Swiper, SwiperSlide} from "swiper/react";
import {Pagination} from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import RichTextContent from "@/app/components/util/RichTextContent/RichTextContent";
import styles from "../page.module.scss";

const getInitials = (name = "") => {
    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    return (parts[0]?.[0] || "U") + (parts[1]?.[0] || "");
};

const getScheduleLabel = (event) => {
    const times = [event.start, event.end].filter(Boolean).join(" - ");

    if (event.repeat) {
        const repeatLabel = event.repeatType ? `Repeats ${event.repeatType}` : "Repeating event";
        const weekdayLabel = event.repeatType === "weekly" && event.weekdays?.length
            ? ` on ${event.weekdays.join(", ")}`
            : "";
        const monthdayLabel = event.repeatType === "monthly" && event.monthday
            ? ` on day ${event.monthday}`
            : "";

        return [repeatLabel + weekdayLabel + monthdayLabel, times].filter(Boolean).join(" | ");
    }

    return [event.date, times].filter(Boolean).join(" | ");
};

const SubscribeButton = ({event, isSaving, onSubscribe, variant = "primary"}) => {
    const isSubscribed = Boolean(event.isSubscribed);

    return (
        <button
            type="button"
            className={`${styles.subscribeButton} ${variant === "secondary" ? styles.secondarySubscribeButton : ""}`}
            onClick={() => onSubscribe(event.id)}
            disabled={isSaving || isSubscribed}
        >
            {isSaving ? "Subscribing..." : isSubscribed ? "Subscribed" : "Subscribe"}
        </button>
    );
};

export default function EventItem({event, isSaving = false, onSubscribe}) {
    const media = Array.isArray(event.media) ? event.media.filter(Boolean) : [];
    const subscribers = Array.isArray(event.subscriberUsers) ? event.subscriberUsers : [];
    const scheduleLabel = getScheduleLabel(event);
    const ownerName = event.owner?.name || "Marker event";

    return (
        <article className={styles.eventItem}>
            <header className={styles.eventItemHeader}>
                <div className={styles.eventTitleBlock}>
                    <span>{ownerName}</span>
                    <h2>{event.title}</h2>
                    {scheduleLabel ? <small>{scheduleLabel}</small> : null}
                </div>
                <SubscribeButton event={event} isSaving={isSaving} onSubscribe={onSubscribe}/>
            </header>

            <RichTextContent
                value={event.description}
                fallback={<p className={styles.mutedText}>No description provided.</p>}
                className={styles.eventDescription}
            />

            <div className={styles.eventMetaRow}>
                <div className={styles.eventTags}>
                    {(event.tags || []).map((tag) => (
                        <span key={tag.id || tag.name || tag}>#{tag.name || tag}</span>
                    ))}
                    {!event.tags?.length ? <span>No tags</span> : null}
                </div>

                {event.location ? (
                    <a
                        className={styles.locationButton}
                        href={event.location}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open location
                    </a>
                ) : null}
            </div>

            {media.length ? (
                <div className={styles.mediaArea}>
                    {media.length === 1 ? (
                        <img src={media[0]} alt={`${event.title} media`}/>
                    ) : (
                        <Swiper
                            modules={[Pagination]}
                            pagination={{clickable: true}}
                            spaceBetween={0}
                            slidesPerView={1}
                            className={styles.mediaSlider}
                        >
                            {media.map((mediaUrl, index) => (
                                <SwiperSlide key={`${mediaUrl}-${index}`}>
                                    <img src={mediaUrl} alt={`${event.title} media ${index + 1}`}/>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    )}
                </div>
            ) : null}

            <footer className={styles.eventFooter}>
                <div className={styles.subscribersBlock}>
                    <span>{event.subscriberCount || 0} subscriber{event.subscriberCount === 1 ? "" : "s"}</span>
                    <div className={styles.subscribersList}>
                        {subscribers.map((subscriber) => (
                            <div key={subscriber.id} className={styles.subscriberItem} title={subscriber.name}>
                                {subscriber.profilePicture ? (                                    <img src={subscriber.profilePicture} alt={subscriber.name}/>
                                ) : (
                                    <span>{getInitials(subscriber.name)}</span>
                                )}
                                <strong>{subscriber.name}</strong>
                            </div>
                        ))}
                    </div>
                </div>
                <SubscribeButton event={event} isSaving={isSaving} onSubscribe={onSubscribe} variant="secondary"/>
            </footer>
        </article>
    );
}
