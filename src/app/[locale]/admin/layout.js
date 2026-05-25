import {NextIntlClientProvider} from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
import AdminShell from "./_components/AdminShell";


export default async function MarkerLayout({children, params}) {
    const {locale} = await params;
    if (!routing.locales.includes(locale)) notFound()

    setRequestLocale(locale);
    const messages = await getMessages();

    return (
        <NextIntlClientProvider messages={messages}>
            <AdminShell>{children}</AdminShell>
        </NextIntlClientProvider>
    );
}
