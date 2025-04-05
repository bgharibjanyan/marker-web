"use client";

import { useState } from "react";

export const previewLayers = [
    { color: "#FF5964", content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." },
    { color: "#454ADE", content: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s." },
    { color: "#231F20", content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." }
];

export const useLoginLogic = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const sendToLogin = (formData) => {
        if (!formData || typeof formData !== "object") {
            console.error("sendToLogin: formData is undefined or not an object", formData);
            return;
        }

        console.log("sendToLogin Form Data:", formData);
    };

    const changeLayer = (index) => {

        console.log("changeLayer", index);
        if (index >= 0 && index < previewLayers.length) {
            setCurrentIndex(index);
        }
    };

    return { currentIndex, setCurrentIndex, sendToLogin, changeLayer };
};
