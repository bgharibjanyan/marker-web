"use strict";

import { cookies } from "next/headers";

class AuthToken {
    constructor(storageType = "cookie") {
        this.storageType = storageType;
    }

    /**
     * Save the auth token
     * @param {string} token - The authentication token
     */
    setToken(token) {
        if (!token) return;

        switch (this.storageType) {
            case "cookie":
                cookies().set("auth_token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                    maxAge: 60 * 60 * 24 * 7, // 7 days
                    path: "/",
                });
                break;

            case "localStorage":
                localStorage.setItem("auth_token", token);
                break;

            case "sessionStorage":
                sessionStorage.setItem("auth_token", token);
                break;

            default:
                throw new Error("Invalid storage type");
        }
    }

    /**
     * Retrieve the auth token
     * @returns {string|null} The authentication token or null if not found
     */
    getToken() {
        switch (this.storageType) {
            case "cookie":
                return cookies().get("auth_token")?.value || null;

            case "localStorage":
                return localStorage.getItem("auth_token");

            case "sessionStorage":
                return sessionStorage.getItem("auth_token");

            default:
                return null;
        }
    }

    /**
     * Remove the auth token
     */
    removeToken() {
        switch (this.storageType) {
            case "cookie":
                cookies().delete("auth_token");
                break;

            case "localStorage":
                localStorage.removeItem("auth_token");
                break;

            case "sessionStorage":
                sessionStorage.removeItem("auth_token");
                break;

            default:
                throw new Error("Invalid storage type");
        }
    }

    /**
     * Check if the token exists
     * @returns {boolean} True if token exists, otherwise false
     */
    hasToken() {
        return !!this.getToken();
    }
}

export default AuthToken;
