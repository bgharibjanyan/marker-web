"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {routing} from "@/i18n/routing";

const locales = routing.locales; // Add the supported locales

export default function LanguageSwitcher({ currentLocale }) {
    const router = useRouter();
    const pathname = usePathname();

    const switchLanguage = (locale) => {
        // Replace the current locale in the pathname
        const newPathname = pathname.replace(`/${currentLocale}`, `/${locale}`);
        router.push(newPathname);
    };

    return (
        <div style={{ display: "flex", gap: "10px", fontSize: "18px", cursor: "pointer" }}>
            {locales.map((locale) => (
                <span
                    key={locale}
                    onClick={() => switchLanguage(locale)}
                    style={{
                        fontWeight: locale === currentLocale ? "bold" : "normal",
                        textDecoration: locale === currentLocale ? "underline" : "none",
                    }}
                >
          {locale.toUpperCase()}
        </span>
            ))}
        </div>
    );
}
