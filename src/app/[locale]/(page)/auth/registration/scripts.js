"use client";

import {useState} from "react";
import api from "@/app/lib/api/axios";

export const previewLayers = [
    { color: "#FF5964", content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." },
    { color: "#454ADE", content: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s." },
    { color: "#231F20", content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry." }
];

export const useRegistrationLogic = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [form, setForm] = useState("registration");
    const [formDataState, setFormDataState] = useState({});


    const sendToRegister = (formData) => {
        const mergedData = {
            ...formDataState,
            ...formData
        };

        setFormDataState(mergedData);

        if(mergedData.password !== mergedData.confirm_password) {
            console.error("Password mismatch");
            return;
        }

        api.post("/auth/register", {
            login: mergedData.firstName,
            firstname: mergedData.firstName,
            lastname: mergedData.lastName,
            formData: mergedData.formData,
            email: mergedData.email,
            password: mergedData.password,
            age: mergedData.age,
            sex: mergedData.sex,
        });
    };


    const changeLayer = (index) => {
        if (index >= 0 && index < previewLayers.length) {
            setCurrentIndex(index);
        }
    };

    const fillFormData = (data) => {
        const mergedData = {
            ...formDataState,
            ...data
        };

        // Optionally keep your formDataState updated
        setFormDataState(mergedData);
    }

    const goToConfirm =  (formData) => {
        fillFormData(formData)
        setForm("confirm");
    };

    const backToRegistration = () => {
        setForm("registration");
    };

    return {backToRegistration,goToConfirm,form, currentIndex, setCurrentIndex, sendToRegister, changeLayer };
};
