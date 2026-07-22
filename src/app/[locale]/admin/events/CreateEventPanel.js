"use client";

import {useState} from "react";
import {AdminButton, AdminPageHeader} from "@/app/components/admin";
import {useLocale} from "next-intl";
import {useRouter} from "next/navigation";
import EventForm from "./EventForm";
import styles from "./page.module.scss";
import {createEventFormData} from "./eventRequest";


export default function CreateEventPanel() {
    const locale = useLocale();    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [resetKey, setResetKey] = useState(0);

    const handleCreate = async (payload, mediaFiles = []) => {
        setIsSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/admin/events", {
                method: "POST",
                headers: {
                },
                body: createEventFormData(payload, mediaFiles)
            });            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to create event.");
                return;
            }

            setSuccess("Event created.");
            setResetKey((key) => key + 1);
        } catch (err) {
            setError("Failed to create event.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className={styles.eventsPage}>
            <AdminPageHeader eyebrow="Events" title="Create event">
                <AdminButton variant="secondary" onClick={() => router.push(`/${locale}/admin/events`)}>
                    Back to list
                </AdminButton>
            </AdminPageHeader>

            <section className={styles.createPanel}>
                <EventForm
                    mode="create"
                    onSubmit={handleCreate}
                    isSaving={isSaving}
                    error={error}
                    success={success}
                    resetKey={resetKey}
                />
            </section>
        </section>
    );
}
