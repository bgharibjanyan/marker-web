import "@/app/global.scss";
import { NextIntlClientProvider } from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import AuthRedirect from "@/app/components/AuthRedirect/AuthRedirect";
import LanguageSwitcher from "@/app/components/util/LanguageSwitcher/LanguageSwitcher";
import styles from "./layout.module.scss";

export default async function AuthLayout({ children, params }) {
    const { locale } = await params;

    if (!routing.locales.includes(locale)) {
        notFound();
    }
    setRequestLocale(locale);
    const messages = await getMessages();

    return (
        <NextIntlClientProvider messages={messages}>
            <div className={styles.header}>
                <LanguageSwitcher currentLocale={locale} />
            </div>
            <AuthRedirect locale={locale} />
            {children}
        </NextIntlClientProvider>
    );
}
