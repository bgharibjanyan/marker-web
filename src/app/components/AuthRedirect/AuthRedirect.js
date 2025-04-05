"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function AuthRedirect({ locale }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);

        if (typeof window !== "undefined") {
            const token = document.cookie
                .split("; ")
                .find((row) => row.startsWith("auth_token="))
                ?.split("=")[1];

            if (!token && !pathname.startsWith(`/${locale}/auth`)) {
                router.replace(`/${locale}/auth/login`);
            }
        }
    }, [router, locale, pathname]);

    return null;
}
