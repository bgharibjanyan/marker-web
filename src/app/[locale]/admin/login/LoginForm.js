"use client";

import {useEffect, useState} from "react";
import {useLocale} from "next-intl";
import {useRouter} from "next/navigation";
import {ADMIN_AUTH_KEY, ADMIN_AUTH_VALUE} from "../_components/AdminShell";
import styles from "./page.module.scss";

export default function LoginForm() {
    const locale = useLocale();
    const router = useRouter();
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (window.localStorage.getItem(ADMIN_AUTH_KEY) === ADMIN_AUTH_VALUE) {
            router.replace(`/${locale}/admin`);
        }
    }, [locale, router]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/admin/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({login, password})
            });

            if (!response.ok) {
                setError("Invalid login or password.");
                return;
            }

            window.localStorage.setItem(ADMIN_AUTH_KEY, ADMIN_AUTH_VALUE);
            router.replace(`/${locale}/admin`);
        } catch (err) {
            setError("Unable to login right now.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className={styles.loginCard} onSubmit={handleSubmit}>
            <div className={styles.logoRow}>
                <img src="/images/logo/logo.svg" alt="Marker logo"/>
                <span>Marker Admin</span>
            </div>

            <div>
                <h1>Login</h1>
                <p>Static admin authentication</p>
            </div>

            <label className={styles.field}>
                <span>Login</span>
                <input
                    type="text"
                    autoComplete="username"
                    value={login}
                    onChange={(event) => setLogin(event.target.value)}
                    placeholder="super_user"
                />
            </label>

            <label className={styles.field}>
                <span>Password</span>
                <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="barev123"
                />
            </label>

            {error ? <div className={styles.error}>{error}</div> : null}

            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
        </form>
    );
}
