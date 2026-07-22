"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale} from "next-intl";
import {usePathname, useRouter} from "next/navigation";
import styles from "./AdminShell.module.scss";

const navigation = [
    {        label: "Dashboard",
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
        description: "Public tasks",
        path: "/admin/events",
        children: [
            {
                label: "List",
                path: "/admin/events"
            },
            {
                label: "Create",
                path: "/admin/events/create"
            }
        ]
    },
    {
        label: "Appearance",
        description: "Homepage slider",
        path: "/admin/appearance"
    }
];

export default function AdminShell({children}) {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);
    const [adminUser, setAdminUser] = useState(null);
    const [openNavItems, setOpenNavItems] = useState({"/admin/events": true});

    const loginPath = `/${locale}/admin/login`;    const isLoginPage = pathname === loginPath;

    useEffect(() => {
        if (isLoginPage) {
            setIsReady(true);
            return undefined;
        }

        let cancelled = false;
        fetch("/api/auth/check")
            .then(async (response) => ({ok: response.ok, data: await response.json()}))
            .then(({ok, data}) => {
                if (cancelled) return;
                if (!ok || data.user?.role !== "admin") {
                    router.replace(loginPath);
                    return;
                }
                setAdminUser(data.user);
                setIsReady(true);
            })
            .catch(() => {
                if (!cancelled) router.replace(loginPath);
            });

        return () => {
            cancelled = true;
        };
    }, [isLoginPage, loginPath, router]);

    const activePath = useMemo(() => {        const adminPath = `/${locale}/admin`;

        if (pathname === adminPath || pathname === `${adminPath}/`) {
            return "/admin";
        }

        const navigationItems = navigation.flatMap((item) => [item, ...(item.children || [])]);
        const match = navigationItems
            .filter((item) => item.path !== "/admin")
            .sort((a, b) => b.path.length - a.path.length)
            .find((item) => pathname === `/${locale}${item.path}` || pathname.startsWith(`/${locale}${item.path}/`));

        return match?.path ?? "/admin";
    }, [locale, pathname]);

    const isNavItemActive = (item) => (
        activePath === item.path || Boolean(item.children?.some((child) => activePath === child.path))
    );

    const toggleNavItem = (path) => {
        setOpenNavItems((currentItems) => ({
            ...currentItems,
            [path]: !currentItems[path],
        }));
    };

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", {method: "POST"});
        } finally {
            setAdminUser(null);
            router.replace(loginPath);
        }
    };

    if (!isReady) {        return (
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
                        <span className={styles.brandMeta}>{adminUser?.login || adminUser?.email || "Administrator"}</span>
                    </div>
                </div>
                <nav className={styles.navList}>
                    {navigation.map((item) => {
                        const hasChildren = Boolean(item.children?.length);
                        const isActive = isNavItemActive(item);
                        const isOpen = hasChildren && (openNavItems[item.path] || isActive);

                        return (
                            <div key={item.path} className={styles.navGroup}>
                                <button
                                    type="button"
                                    className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                                    onClick={() => {
                                        if (hasChildren) {
                                            toggleNavItem(item.path);
                                            router.push(`/${locale}${item.path}`);
                                            return;
                                        }

                                        router.push(`/${locale}${item.path}`);
                                    }}
                                    aria-expanded={hasChildren ? isOpen : undefined}
                                >
                                    <span>
                                        <span className={styles.navLabel}>{item.label}</span>
                                        <span className={styles.navDescription}>{item.description}</span>
                                    </span>
                                    {hasChildren ? <span className={styles.navChevron}>{isOpen ? "-" : "+"}</span> : null}
                                </button>

                                {hasChildren && isOpen ? (
                                    <div className={styles.subNavList}>
                                        {item.children.map((child) => (
                                            <button
                                                key={child.path}
                                                type="button"
                                                className={`${styles.subNavItem} ${activePath === child.path ? styles.active : ""}`}
                                                onClick={() => router.push(`/${locale}${child.path}`)}
                                            >
                                                {child.label}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
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
