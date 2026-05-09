"use client";
import {useState} from "react";
import useApiCall from "@/app/lib/api/call";
import {useRouter} from "next/navigation";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";


export const previewLayers = [
    { color: ColorSelector("--g-color5"), content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." },
    { color: ColorSelector("--g-color4"), content: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s." },
    { color: ColorSelector("--g-color17"), content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." }
];

export const useLoginLogic = (locale) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const apiCall = useApiCall();
    const router = useRouter();


    const sendToLogin = async (formData) => {
        if (!formData || typeof formData !== "object") {
            console.warn("Invalid formData", formData);
            return;
        }

        const { success, data, error } = await apiCall("post", "/auth/login", {
            login: formData.username,
            password: formData.password,
            saveConnection: formData.rememberMe,
        });

        if (success) {
            if (data.token) {
                localStorage.setItem("marker_im_token", data.token);
                router.replace(`/`);
            }
        } else {
            console.warn("Login failed:", error);
        }
    };

    const changeLayer = (index) => {
        if (index >= 0 && index < previewLayers.length) {
            setCurrentIndex(index);
        }
    };

    return { currentIndex, setCurrentIndex, sendToLogin, changeLayer };
};
