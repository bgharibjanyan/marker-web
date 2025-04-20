import "../global.scss";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import AuthRedirect from "@/app/components/AuthRedirect/AuthRedirect";

export default async function MarkerLayout({ children, params }) {
    const { locale } = await params;
    if (!routing.locales.includes(locale)) notFound()

    setRequestLocale(locale);
    const messages = await getMessages();

    return (
        <html lang={locale}>
        <head>
            <link rel="icon" type="image/png" href="/images/logo/logo.svg" />
            <title>Marker</title>
        </head>
        <body>
        <NextIntlClientProvider messages={messages}>

            <AuthRedirect locale={locale} />
            {children}
        </NextIntlClientProvider>
        </body>
        </html>
    );
}
