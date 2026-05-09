"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale} from "next-intl";
import {usePathname, useRouter} from "next/navigation";
import styles from "./AdminShell.module.scss";

const ADMIN_AUTH_KEY = "marker-admin-auth";
const ADMIN_AUTH_VALUE = "authenticated";

const navigation = [
    {
        label: "Dashboard",
        description: "Overview",
        path: "/admin"
    },
    {
        label: "Users",
        description: "Accounts",
        path: "/admin/users"
    },
    {
        label: "Events",
        description: "Later",
        path: "/admin/events"
    },
    {
        label: "Appearance",
        description: "Homepage slider",
        path: "/admin/appearance"
    }
];

export {ADMIN_AUTH_KEY, ADMIN_AUTH_VALUE};

export default function AdminShell({children}) {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    const loginPath = `/${locale}/admin/login`;
    const isLoginPage = pathname === loginPath;

    useEffect(() => {
        if (isLoginPage) {
            setIsReady(true);
            return;
        }

        const isAuthenticated = window.localStorage.getItem(ADMIN_AUTH_KEY) === ADMIN_AUTH_VALUE;

        if (!isAuthenticated) {
            router.replace(loginPath);
            return;
        }

        setIsReady(true);
    }, [isLoginPage, loginPath, router]);

    const activePath = useMemo(() => {
        const adminPath = `/${locale}/admin`;

        if (pathname === adminPath || pathname === `${adminPath}/`) {
            return "/admin";
        }

        const match = navigation
            .filter((item) => item.path !== "/admin")
            .sort((a, b) => b.path.length - a.path.length)
            .find((item) => pathname === `/${locale}${item.path}` || pathname.startsWith(`/${locale}${item.path}/`));

        return match?.path ?? "/admin";
    }, [locale, pathname]);

    const handleLogout = () => {
        window.localStorage.removeItem(ADMIN_AUTH_KEY);
        router.replace(loginPath);
    };

    if (!isReady) {
        return (
            <div className={styles.loadingScreen}>
                <div className={styles.loadingPanel}>
                    <span>Checking admin session</span>
                </div>
            </div>
        );
    }

    if (isLoginPage) {
        return <div className={styles.loginShell}>{children}</div>;
    }

    return (
        <div className={styles.shell}>
            <main className={styles.content}>
                {children}
            </main>

            <aside className={styles.sidebar} aria-label="Admin navigation">
                <div className={styles.brand}>
                    <img src="/images/logo/logo.svg" alt="Marker logo"/>
                    <div>
                        <span className={styles.brandTitle}>Marker Admin</span>
                        <span className={styles.brandMeta}>super_user</span>
                    </div>
                </div>

                <nav className={styles.navList}>
                    {navigation.map((item) => {
                        const isActive = activePath === item.path;

                        return (
                            <button
                                key={item.path}
                                type="button"
                                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                                onClick={() => router.push(`/${locale}${item.path}`)}
                            >
                                <span className={styles.navLabel}>{item.label}</span>
                                <span className={styles.navDescription}>{item.description}</span>
                            </button>
                        );
                    })}
                </nav>

                <button type="button" className={styles.logoutButton} onClick={handleLogout}>
                    Logout
                </button>
            </aside>
        </div>
    );
}
