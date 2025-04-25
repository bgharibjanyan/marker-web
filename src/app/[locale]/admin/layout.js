import "../../global.scss";
import {NextIntlClientProvider} from "next-intl";
import {getMessages, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
import styles from "./layout.module.scss";

import MainSideBar from "@/app/components/admin/layout/mainSideBar";


export default async function MarkerLayout({children, params}) {
    const {locale} = await params;
    if (!routing.locales.includes(locale)) notFound()

    setRequestLocale(locale);
    const messages = await getMessages();

    return (
        <html lang={locale}>
        <head>
            <link rel="icon" type="image/png" href="/images/logo/logo.svg"/>
            <title>Marker Admin</title>
        </head>
        <body>
        <NextIntlClientProvider messages={messages}>
            <div className={styles.page}>
                <MainSideBar></MainSideBar>
                <div className={styles.mainContent}> {children} </div>
            </div>
        </NextIntlClientProvider>
        </body>
        </html>
    );
}
