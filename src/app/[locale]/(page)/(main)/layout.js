import "../../../global.scss";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
import AuthRedirect from "@/app/components/util/AuthRedirect/AuthRedirect";
import {PopupProvider} from "@/app/components/overlays/popup/PopupProvider/PopupProvider";
import Header from "@/app/components/layout/header/Header";
import styles from "./layout.module.scss";

export default async function MarkerLayout({children, params}) {
    const {locale} = await params;
    if (!routing.locales.includes(locale)) notFound()

    setRequestLocale(locale);
    const messages = await getMessages();

    return (
        <html lang={locale}>
        <head>
            <link rel="icon" type="image/png" href="/images/logo/logo.svg"/>
            <title>Marker</title>
        </head>
        <body>
        <NextIntlClientProvider messages={messages}>
            <PopupProvider>
                <AuthRedirect locale={locale}/>
                <Header />
                <div className={styles.main}>
                    {children}
                </div>
            </PopupProvider>
        </NextIntlClientProvider>
        </body>
        </html>
    );
}
