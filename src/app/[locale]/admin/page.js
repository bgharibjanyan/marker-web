import styles from "./page.module.scss";
import {AdminPageHeader, AdminPanel} from "@/app/components/admin";

const stats = [
    {
        label: "Users",
        value: "Live",
        meta: "Role-protected account management"
    },
    {
        label: "Events",        value: "Live",
        meta: "List, create, and edit ready"
    },
    {
        label: "Slider images",
        value: "5",
        meta: "Homepage appearance config"
    }
];

export default function AdminDashboard() {
    return (
        <section className={styles.dashboard}>
            <AdminPageHeader eyebrow="Admin panel" title="Dashboard">
                <span className={styles.sessionBadge}>Administrator</span>
            </AdminPageHeader>

            <div className={styles.statsGrid}>                {stats.map((item) => (
                    <article key={item.label} className={styles.statCard}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        <p>{item.meta}</p>
                    </article>
                ))}
            </div>

            <div className={styles.contentGrid}>
                <AdminPanel>
                    <h2>Page content</h2>
                    <p>
                        The admin area is ready for account editing, event navigation, and homepage slider appearance settings.
                    </p>
                </AdminPanel>

                <AdminPanel>
                    <h2>Current access</h2>
                    <div className={styles.accessRow}>
                        <span>Authentication</span>
                        <strong>Secure administrator session</strong>
                    </div>
                </AdminPanel>
            </div>        </section>
    );
}
