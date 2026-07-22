"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {useLocale} from "next-intl";
import {useRouter} from "next/navigation";
import EventItem from "./EventItem";
import styles from "../page.module.scss";

const normalizeTagName = (tag) => String(tag?.name || tag || "").trim().toLowerCase();

export default function EventsPageClient() {
    const locale = useLocale();
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState("");
    const [activeTag, setActiveTag] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState("");
    const [savingEventId, setSavingEventId] = useState("");

    const loadEvents = useCallback(async ({append = false} = {}) => {
        append ? setIsLoadingMore(true) : setIsLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({feed: "1", limit: "20"});
            if (append && nextCursor) params.set("cursor", nextCursor);
            const response = await fetch(`/api/event/get-user-events?${params.toString()}`);
            const data = await response.json();

            if (response.status === 401) {                router.replace(`/${locale}/auth/login`);
                return;
            }
            if (!response.ok) {
                setError(data.error || "Failed to load events.");
                return;
            }

            const loadedEvents = Array.isArray(data.events) ? data.events : [];
            setEvents((current) => append ? [...current, ...loadedEvents] : loadedEvents);
            setNextCursor(data.nextCursor || null);
            setHasMore(Boolean(data.hasMore));
        } catch {
            setError("Failed to load events.");
        } finally {
            append ? setIsLoadingMore(false) : setIsLoading(false);
        }
    }, [locale, nextCursor, router]);

    useEffect(() => {
        loadEvents();    }, [loadEvents]);

    const tags = useMemo(() => (
        [...new Set(events.flatMap((event) => (
            (event.tags || []).map(normalizeTagName).filter(Boolean)
        )))]
            .sort((firstTag, secondTag) => firstTag.localeCompare(secondTag))
    ), [events]);

    const filteredEvents = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return events.filter((event) => {
            const matchesTitle = !normalizedSearch || String(event.title || "").toLowerCase().includes(normalizedSearch);
            const matchesTag = !activeTag || (event.tags || []).some((tag) => normalizeTagName(tag) === activeTag);

            return matchesTitle && matchesTag;
        });
    }, [activeTag, events, search]);

    const handleSubscribe = async (eventId) => {
        setSavingEventId(eventId);
        setError("");

        try {
            const response = await fetch("/api/event/subscribe-event", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({eventId}),
            });
            const data = await response.json();

            if (response.status === 401) {
                router.replace(`/${locale}/auth/login`);
                return;
            }
            if (!response.ok) {
                setError(data.error || "Failed to subscribe to event.");
                return;
            }

            setEvents((currentEvents) => (
                currentEvents.map((event) => event.id === data.event.id ? data.event : event)
            ));
            window.dispatchEvent(new CustomEvent("marker:tasks-updated"));
        } catch (err) {
            setError("Failed to subscribe to event.");
        } finally {
            setSavingEventId("");
        }
    };

    return (
        <main className={styles.eventsPage}>
            <section className={styles.eventsHeader}>
                <div>
                    <span>Events</span>
                    <h1>Event feed</h1>
                </div>
                <strong>{filteredEvents.length} shown</strong>
            </section>

            <section className={styles.filterBar} aria-label="Event filters">
                <label className={styles.searchField}>
                    <span>Search by title</span>
                    <input
                        type="search"
                        value={search}
                        placeholder="Search events"
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </label>

                <div className={styles.tagFilters} aria-label="Filter by tag">
                    <button
                        type="button"
                        className={!activeTag ? styles.activeTag : ""}
                        onClick={() => setActiveTag("")}
                    >
                        All
                    </button>
                    {tags.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            className={activeTag === tag ? styles.activeTag : ""}
                            onClick={() => setActiveTag(tag)}
                        >
                            #{tag}
                        </button>
                    ))}
                </div>
            </section>

            {error ? <div className={styles.errorState}>{error}</div> : null}
            {isLoading ? <div className={styles.emptyState}>Loading events...</div> : null}
            {!isLoading && !filteredEvents.length ? <div className={styles.emptyState}>No events found.</div> : null}

            <section className={styles.eventsFeed} aria-label="Events feed">
                {filteredEvents.map((event) => (
                    <EventItem
                        key={event.id}
                        event={event}
                        isSaving={savingEventId === event.id}
                        onSubscribe={handleSubscribe}
                    />
                ))}
            </section>

            {hasMore ? (
                <button
                    type="button"
                    className={styles.loadMore}
                    disabled={isLoadingMore}
                    onClick={() => loadEvents({append: true})}
                >
                    {isLoadingMore ? "Loading events..." : "Load more events"}
                </button>
            ) : null}
        </main>
    );
}