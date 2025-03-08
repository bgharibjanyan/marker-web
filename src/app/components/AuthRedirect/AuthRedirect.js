"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthRedirect({ locale }) {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true); // Ensures hydration is matched

        // Run authentication check only on the client
        if (typeof window !== "undefined") {
            const token = document.cookie
                .split("; ")
                .find((row) => row.startsWith("auth_token="))
                ?.split("=")[1];

            if (!token) {
                router.replace(`/${locale}/auth/login`);
            }
        }
    }, [router, locale]);

    return null;
}