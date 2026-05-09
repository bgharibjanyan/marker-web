import "../../global.scss";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
import AdminShell from "./_components/AdminShell";


export default async function MarkerLayout({children, params}) {
    const {locale} = await params;
    if (!routing.locales.includes(locale)) notFound()

    setRequestLocale(locale);
    const messages = await getMessages();
    const t = await getTranslations('Admin.sidebar');

    return (
        <html lang={locale}>
        <head>
            <link rel="icon" type="image/png" href="/images/logo/logo.svg"/>
            <title>{t('title')}</title>
        </head>
        <body>
        <NextIntlClientProvider messages={messages}>
            <AdminShell>{children}</AdminShell>
        </NextIntlClientProvider>
        </body>
        </html>
    );
}
