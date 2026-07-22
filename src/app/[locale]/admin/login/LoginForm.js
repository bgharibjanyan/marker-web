"use client";

import {useEffect, useState} from "react";
import {useLocale} from "next-intl";
import {useRouter} from "next/navigation";
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
        fetch("/api/auth/check")
            .then((response) => response.ok ? response.json() : null)
            .then((data) => {
                if (data?.user?.role === "admin") router.replace(`/${locale}/admin`);
            })
            .catch(() => {});
    }, [locale, router]);

    const handleSubmit = async (event) => {        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/admin/auth/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({login, password})
            });
            if (!response.ok) {
                setError("Invalid login or password.");
                return;
            }
            router.replace(`/${locale}/admin`);
        } catch {
            setError("Unable to login right now.");
        } finally {
            setIsSubmitting(false);        }
    };

    return (
        <form className={styles.loginCard} onSubmit={handleSubmit}>
            <div className={styles.logoRow}>
                <img src="/images/logo/logo.svg" alt="Marker logo"/>
                <span>Marker Admin</span>
            </div>
            <div>
                <h1>Login</h1>
                <p>Sign in with an administrator account</p>
            </div>
            <AdminTextField
                label="Login or email"
                type="text"
                autoComplete="username"
                value={login}
                onChange={setLogin}
                placeholder="admin@example.com"
            />
            <AdminTextField
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
                placeholder="Your password"
            />
            {error ? <AdminStatusMessage type="error">{error}</AdminStatusMessage> : null}
            <AdminButton type="submit" fullWidth className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
            </AdminButton>        </form>
    );
}
