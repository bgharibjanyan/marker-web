"use client";

import {useState} from "react";
import useApiCall from "@/app/lib/api/call";
import {useRouter} from "next/navigation";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import UserManager from "@/app/lib/user/UserManager";

export const previewLayers = [
    {color: ColorSelector("--g-color5"), content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry."},
    {color: ColorSelector("--g-color4"), content: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."},
    {color: ColorSelector("--g-color17"), content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry."}
];

export const useRegistrationLogic = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [form, setForm] = useState("registration");
    const [formDataState, setFormDataState] = useState({});
    const apiCall = useApiCall();
    const router = useRouter();

    const sendToRegister = async (formData) => {
        const mergedData = {...formDataState, ...formData};
        setFormDataState(mergedData);
        if (mergedData.password !== mergedData.confirm_password) return;

        const {success, data, error} = await apiCall("post", "/auth/register", {
            login: mergedData.firstName,
            firstname: mergedData.firstName,
            lastname: mergedData.lastName,            formData: mergedData.formData,
            email: mergedData.email,
            password: mergedData.password,
            age: mergedData.age,
            sex: mergedData.sex,
        });

        if (success && data.user) {
            UserManager.setUser(data.user);
            router.replace("/");
        } else if (!success) {
            console.warn("Registration failed:", error);
        }
    };

    const changeLayer = (index) => {
        if (index >= 0 && index < previewLayers.length) setCurrentIndex(index);
    };
    const goToConfirm = (data) => {
        setFormDataState((current) => ({...current, ...data}));
        setForm("confirm");
    };

    return {
        backToRegistration: () => setForm("registration"),
        goToConfirm,
        form,
        currentIndex,
        setCurrentIndex,
        sendToRegister,
        changeLayer,
    };
};