"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {useLocale} from "next-intl";
import {useRouter} from "next/navigation";
import {AdminButton, AdminPageHeader} from "@/app/components/admin";
import EventForm from "./EventForm";
import styles from "./page.module.scss";
import {createEventFormData} from "./eventRequest";

const EVENTS_PAGE_SIZE = 20;

const getEventSummary = (event) => {    if (event.repeat) {
        return event.repeatType ? `Repeats ${event.repeatType}` : "Repeating";
    }

    return event.date || "One-time event";
};

export default function EventsPanel() {
    const locale = useLocale();
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [search, setSearch] = useState("");
    const [nextSkip, setNextSkip] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadEvents = useCallback(async ({reset = false, query = search} = {}) => {
        const skip = reset ? 0 : nextSkip;

        if (!reset && (!hasMore || isLoading || isLoadingMore)) {
            return;
        }

        reset ? setIsLoading(true) : setIsLoadingMore(true);
        setError("");

        try {
            const params = new URLSearchParams({
                limit: String(EVENTS_PAGE_SIZE),
                skip: String(skip)
            });

            if (query.trim()) {
                params.set("search", query.trim());
            }

            const response = await fetch(`/api/admin/events?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {                setError(data.error || "Failed to load events.");
                return;
            }

            const loadedEvents = data.events || [];

            setEvents((currentEvents) => reset ? loadedEvents : [...currentEvents, ...loadedEvents]);
            setNextSkip(data.nextSkip || 0);
            setHasMore(Boolean(data.hasMore));

            if (reset) {
                setSelectedId(loadedEvents[0]?.id || "");
                setSuccess("");
            }
        } catch (err) {
            setError("Failed to load events.");
        } finally {
            reset ? setIsLoading(false) : setIsLoadingMore(false);
        }
    }, [hasMore, isLoading, isLoadingMore, nextSkip, search]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            loadEvents({reset: true, query: search});
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search]);

    const selectedEvent = useMemo(
        () => events.find((event) => event.id === selectedId) || null,
        [events, selectedId]
    );

    const handleEventListScroll = (event) => {
        const {scrollTop, scrollHeight, clientHeight} = event.currentTarget;

        if (scrollTop + clientHeight >= scrollHeight - 24) {
            loadEvents();
        }
    };

    const handleSave = async (payload, mediaFiles = []) => {
        if (!selectedEvent) {
            return;
        }

        setIsSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/admin/events", {
                method: "PATCH",
                headers: {
                },
                body: createEventFormData(payload, mediaFiles, selectedEvent.id)
            });            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to save event.");
                return;
            }

            setEvents((currentEvents) => (
                currentEvents.map((event) => event.id === data.event.id ? data.event : event)
            ));
            setSelectedId(data.event.id);
            setSuccess("Event saved.");
        } catch (err) {
            setError("Failed to save event.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedEvent) {
            return;
        }

        setIsDeleting(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`/api/admin/events?id=${encodeURIComponent(selectedEvent.id)}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.error || "Failed to delete event.");
                return;
            }

            setEvents((currentEvents) => {
                const nextEvents = currentEvents.filter((event) => event.id !== selectedEvent.id);
                setSelectedId(nextEvents[0]?.id || "");
                return nextEvents;
            });
            setSuccess("Event deleted.");
        } catch (err) {
            setError("Failed to delete event.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <section className={styles.eventsPage}>
            <AdminPageHeader eyebrow="Events" title="Event list">
                <AdminButton onClick={() => router.push(`/${locale}/admin/events/create`)}>
                    Create event
                </AdminButton>
            </AdminPageHeader>

            <div className={styles.workspace}>
                <aside className={styles.eventList}>
                    <label className={styles.searchField}>
                        <span>Search events</span>
                        <input
                            type="search"
                            value={search}
                            placeholder="Title, description, location"
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </label>

                    <div className={styles.eventScrollArea} onScroll={handleEventListScroll}>
                        {isLoading ? <div className={styles.emptyState}>Loading events...</div> : null}
                        {!isLoading && !events.length ? <div className={styles.emptyState}>No events found.</div> : null}

                        {events.map((event) => (
                            <button
                                key={event.id}
                                type="button"
                                className={`${styles.eventItem} ${event.id === selectedEvent?.id ? styles.active : ""}`}
                                onClick={() => {
                                    setSelectedId(event.id);
                                    setError("");
                                    setSuccess("");
                                }}
                            >
                                <span>{event.title}</span>
                                <small>{getEventSummary(event)} - {event.subscriberCount || 0} subscribers</small>
                            </button>
                        ))}

                        {isLoadingMore ? <div className={styles.emptyState}>Loading more events...</div> : null}
                        {!isLoading && events.length && !hasMore ? (
                            <div className={styles.listEndState}>End of list</div>
                        ) : null}
                    </div>
                </aside>

                <section className={styles.editor}>
                    {selectedEvent ? (
                        <EventForm
                            event={selectedEvent}
                            mode="edit"
                            onSubmit={handleSave}
                            onDelete={handleDelete}
                            isSaving={isSaving}
                            isDeleting={isDeleting}
                            error={error}
                            success={success}
                        />
                    ) : (
                        <div className={styles.emptyState}>Select an event to edit.</div>
                    )}
                </section>
            </div>
        </section>
    );
}
