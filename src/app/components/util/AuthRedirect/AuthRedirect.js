"use client";

import {useEffect} from "react";
import {usePathname, useRouter} from "next/navigation";
import UserManager from "@/app/lib/user/UserManager";

export default function AuthRedirect({locale}) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (pathname.startsWith(`/${locale}/auth`)) return undefined;

        let cancelled = false;
        UserManager.getUser().then((user) => {
            if (!cancelled && !user) router.replace(`/${locale}/auth/login`);
        });
        return () => {
            cancelled = true;
        };
    }, [router, locale, pathname]);

    return null;}
