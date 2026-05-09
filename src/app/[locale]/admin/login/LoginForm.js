"use client";

import {useEffect, useState} from "react";
import {useLocale} from "next-intl";
import {useRouter} from "next/navigation";
import {ADMIN_AUTH_KEY, ADMIN_AUTH_VALUE} from "../_components/AdminShell";
import styles from "./page.module.scss";
import {AdminButton, AdminStatusMessage, AdminTextField} from "@/app/components/admin";

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

            <AdminTextField
                label="Login"
                type="text"
                autoComplete="username"
                value={login}
                onChange={setLogin}
                placeholder="super_user"
            />

            <AdminTextField
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
                placeholder="barev123"
            />

            {error ? <AdminStatusMessage type="error">{error}</AdminStatusMessage> : null}

            <AdminButton type="submit" fullWidth className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
            </AdminButton>
        </form>
    );
}
