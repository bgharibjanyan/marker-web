"use client";
import {useState} from "react";
import {apiCall} from "@/app/lib/api/call";


export const previewLayers = [
    { color: "#FF5964", content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." },
    { color: "#454ADE", content: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s." },
    { color: "#231F20", content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." }
];

export const useLoginLogic = (locale) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const sendToLogin = async (formData) => {
        if (!formData || typeof formData !== "object") {
            console.error("Invalid formData", formData);
            return;
        }

        const { success, data, error } = await apiCall("post", "/auth/login", {
            login: formData.username,
            password: formData.password,
            saveConnection: formData.rememberMe,
        });

        if (success) {
            console.log("Logged in:", data);
            if (data.token) {
                localStorage.setItem("token", data.token);
            }
        } else {
            console.error("Login failed:", error.message);
        }
    };

    const changeLayer = (index) => {
        if (index >= 0 && index < previewLayers.length) {
            setCurrentIndex(index);
        }
    };

    return { currentIndex, setCurrentIndex, sendToLogin, changeLayer };
};
