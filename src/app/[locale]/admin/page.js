import styles from "./page.module.scss";

const stats = [
    {
        label: "Users",
        value: "3",
        meta: "Static admin records"
    },
    {
        label: "Events",
        value: "Later",
        meta: "Navigation tab ready"
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
            <div className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>Admin panel</span>
                    <h1>Dashboard</h1>
                </div>
                <span className={styles.sessionBadge}>super_user</span>
            </div>

            <div className={styles.statsGrid}>
                {stats.map((item) => (
                    <article key={item.label} className={styles.statCard}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        <p>{item.meta}</p>
                    </article>
                ))}
            </div>

            <div className={styles.contentGrid}>
                <section className={styles.panel}>
                    <h2>Page content</h2>
                    <p>
                        The admin area is ready for account editing, event navigation, and homepage slider appearance settings.
                    </p>
                </section>

                <section className={styles.panel}>
                    <h2>Current access</h2>
                    <div className={styles.accessRow}>
                        <span>Login</span>
                        <strong>super_user</strong>
                    </div>
                    <div className={styles.accessRow}>
                        <span>Password</span>
                        <strong>barev123</strong>
                    </div>
                </section>
            </div>
        </section>
    );
}
