"use client";

import Form from "@/app/components/form/Form";
import styles from "./page.module.scss";
import TextInput from "@/app/components/form/TextInput/TextInput";
import {useState} from "react";

const inputs = [
    {type: 'text', name: 'userdname', placeholder: 'Gmail/username', value: ""},
    {type: 'password', name: 'password', placeholder: 'Password', value: ""},
];
const previewLayers = [
    {
        color: "#FF5964",
        content: "Lorem Ips,um is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. "
    }, {
        color: "#454ADE",
        content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. "
    }, {
        color: "#231F20",
        content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. "
    }
]


export default function Home() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const sendToLogin = () => {
        console.log("sendToLogin", inputs);
    }

    const handleClick = (index) => {
        if (index < previewLayers.length && index >= 0) {
            setCurrentIndex(index);
        }
    };

    return (
        <div className={`${styles.page}`}>
            <div className={`${styles.bottomLogo}`}>
                <svg>
                    <use href="/images/sprites.svg#text-logo"></use>
                </svg>
            </div>
            <div className={`${styles.previewSection}`}>
                {previewLayers.map((layer, index) => (
                    <div
                        key={index}
                        className={`${styles.layer} ${index === currentIndex ? styles.active : ""} ${index < currentIndex ? styles.prev : ""} ${index > currentIndex ? styles.next : ""}`}
                        style={{
                            backgroundColor: layer.color,
                            left: `${-(currentIndex- index) * 80}px`,
                            zIndex: previewLayers.length - index,
                            marginTop: `${-(currentIndex- index) * 15}px`,
                            marginBottom: `${-(currentIndex- index) * 15}px`,
                            height: `calc(120vh - ${-(currentIndex- index) * 30}px)`,
                        }}
                        onClick={() => handleClick(index)}
                    >
                        <div className={`${styles.content}`}>
                            <img className={`${styles.mainLogo}`} src='/images/logo/loading.gif'/>
                        </div>

                    </div>

                ))}
            </div>
            <div className={`${styles.formSectionContainer}`}>
                <div className={`${styles.formSection}`}>

                    <Form inputs={inputs} onSubmit={sendToLogin}/>
                </div>
            </div>
        </div>
    );
}
