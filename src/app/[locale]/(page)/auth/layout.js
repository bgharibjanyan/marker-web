import {NextIntlClientProvider} from "next-intl";
import {getMessages, getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
import AuthRedirect from "@/app/components/util/AuthRedirect/AuthRedirect";
import LanguageSwitcher from "@/app/components/util/LanguageSwitcher/LanguageSwitcher";
import styles from "./layout.module.scss";


export default async function AuthLayout({ children, params }) {
    const {locale} = await params;

    if (!routing.locales.includes(locale)) {
        notFound();
    }

    setRequestLocale(locale);
    const messages = await getMessages();
    const t = await getTranslations({locale});

    return (
        <NextIntlClientProvider messages={messages}>
            <AuthRedirect locale={locale}/>
            <div className={styles.main}></div>
            <div className={styles.fullHeightPage}>
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <div className={styles.header}>
                        <LanguageSwitcher currentLocale={locale}/>
                    </div>

                    <div className={styles.infoButtonContainer}>
                        <div className={styles.infoButtonContent}>
                                <span className={`${styles.infoButtonLabel} ${styles.t3}`}>
                                    {t('AuthLayout.infoButtonTitle')}
                                </span>
                        </div>
                    </div>
                    <AuthRedirect locale={locale}/>
                    {children}
                </NextIntlClientProvider>
            </div>
        </NextIntlClientProvider>
    );
}


