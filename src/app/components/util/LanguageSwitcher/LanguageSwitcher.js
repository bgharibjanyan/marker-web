"use client";

import { usePathname, useRouter } from "next/navigation";
import { routing } from "@/i18n/routing";
import styles from "./languageSwitcher.module.scss";
import { ColorSelector } from "@/app/scripts/HelperFunctions/colorSelector";
import { useTransition, useEffect, useState } from "react";

const locales = routing.locales;

export default function LanguageSwitcher({
                                             activeColor = ColorSelector("--g-color5"),
                                             inactiveColor = ColorSelector("--g-color2"),
                                         }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [currentLocale, setCurrentLocale] = useState("");

    useEffect(() => {
        const detectedLocale = pathname.split("/")[1];
        if (locales.includes(detectedLocale)) {
            setCurrentLocale(detectedLocale);
        }
    }, [pathname]);

    const switchLanguage = (locale) => {
        startTransition(() => {
            const newPathname = pathname.replace(`/${currentLocale}`, `/${locale}`);
            router.push(newPathname);
        });
    };

    return (
        <div className={`${styles.languageSwitcherContainer} ${styles.btnM}`}>
            {locales.map((locale) => (
                <span
                    key={locale}
                    onClick={() => switchLanguage(locale)}
                    style={{
                        color: locale === currentLocale ? activeColor : inactiveColor,
                        cursor: isPending ? "not-allowed" : "pointer",
                        opacity: isPending ? 0.6 : 1,
                    }}
                >
                    {locale.toUpperCase()}
                </span>
            ))}
        </div>
    );
}
