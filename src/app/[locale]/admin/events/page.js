import styles from "./page.module.scss";
import {AdminPageHeader, AdminPanel} from "@/app/components/admin";

export default function AdminEventsPage() {
    return (
        <section className={styles.eventsPage}>
            <AdminPageHeader eyebrow="Events" title="Events"/>

            <AdminPanel>
                <h2>Navigation tab ready</h2>
                <p>The events admin section is intentionally empty for now.</p>
            </AdminPanel>
        </section>
    );
}
