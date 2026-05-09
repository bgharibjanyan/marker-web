import styles from "./page.module.scss";

export default function AdminEventsPage() {
    return (
        <section className={styles.eventsPage}>
            <div>
                <span className={styles.eyebrow}>Events</span>
                <h1>Events</h1>
            </div>

            <div className={styles.panel}>
                <h2>Navigation tab ready</h2>
                <p>The events admin section is intentionally empty for now.</p>
            </div>
        </section>
    );
}
