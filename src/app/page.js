"use client"; // Add this at the top

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";


export default function Dashboard() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);

        if (typeof window !== "undefined") {
            const token = document.cookie
                .split("; ")
                .find((row) => row.startsWith("auth_token="))
                ?.split("=")[1];

            if (!token) {
                router.push("/auth/login");
            }
        }
    }, []);

    if (!isMounted) return null; // Prevent hydration mismatch

    return (
        <div>

        </div>
    );

}
