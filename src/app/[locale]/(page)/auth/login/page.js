"use client";

import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";

import Form from "@/app/components/util/form/Form";
import styles from "./page.module.scss";
import {useLocale, useTranslations} from 'next-intl';
import {previewLayers, useLoginLogic} from "./scripts";
import LinkButton from "@/app/components/util/form/LinkButton/LinkButton";

export default function Login() {
    const locale = useLocale();
    const t = useTranslations('Login');
    const {currentIndex, changeLayer, sendToLogin} = useLoginLogic(locale);

    const loginFormFields = [
        {
            field: "text",
            type: "text",
            name: "username",
            placeholder: "Gmail/username",
            value: "",
            label: t('form.mailLabel'),
            size: "full"
        },
        {
            field: "text",
            type: "password",
            name: "password",
            placeholder: "Password",
            value: "",
            label: t('form.passwordLabel'),
            size: "full"
        },
        {
            field: "checkbox",
            name: "rememberMe",
            label: t('form.rememberMeCheckbox'),
            value: false,
            size: "half"
        },
        {
            field: "link",
            label: t('form.forgotPass'),
            color: ColorSelector("--g-color8"),
            url: "/reset-password",
            size: "half",
            align: "left"
        },
        {
            name:'submit',
            field: "button",
            type: "button",
            label: t('form.signIn'),
            onClick: (formData) => sendToLogin(formData)
        },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.bottomLogo}>
                <svg>
                    <use href="/images/sprites.svg#text-logo"></use>
                </svg>
            </div>
            <div className={styles.previewSection}>
                {previewLayers.map((layer, index) => (
                    <div
                        key={index}
                        className={`${styles.layer} ${index === currentIndex ? styles.active : ""} ${index < currentIndex ? styles.prev : ""} ${index > currentIndex ? styles.next : ""}`}
                        style={{
                            backgroundColor: layer.color,
                            left: `${-(currentIndex - index) * 60}px`,
                            zIndex: previewLayers.length - index,
                            marginTop: `${-(currentIndex - index) * 15}px`,
                            marginBottom: `${-(currentIndex - index) * 15}px`,
                            height: `calc(120vh - ${-(currentIndex - index) * 30}px)`,
                        }}
                    >
                        <div className={styles.content}>
                            <img className={styles.mainLogo} src='/images/logo/loading.gif' alt="Logo"/>
                        </div>

                        {previewLayers[index + 1]&& index===currentIndex &&
                            <button className={styles.nextButton}
                                    style={{backgroundColor: previewLayers[index + 1].color,}}
                                    onClick={() => changeLayer(index+1)}>
                                <svg className={`${styles.icon} ${styles.next}`}>
                                    <use href={`/images/sprites.svg#icon-arrow-right`}></use>
                                </svg>
                            </button>
                        }

                        {previewLayers[index - 1] && index===currentIndex &&
                            <button className={styles.prevButton}
                                    style={{
                                        backgroundColor: previewLayers[index - 1].color,
                                        left: `${(currentIndex - index) * 60 + 20}px`,}}
                                    onClick={() => changeLayer(index-1)}>

                                <svg className={`${styles.icon} ${styles.prev}`}>
                                    <use href={`/images/sprites.svg#icon-arrow-right`}></use>
                                </svg>
                            </button>
                        }
                    </div>
                ))}
            </div>
            <div className={styles.formSectionContainer}>
                <div className={styles.formSection}>
                    <h1 className={`${styles.t1} ${styles.formTitle}`}>{t('form.title')}</h1>
                    <span className={`${styles.t3} ${styles.formDescription}`}>{t('form.description')}</span>
                    <Form fields={loginFormFields} onSubmit={(formData) => sendToLogin(formData)}/>

                    <div className={`${styles.t5} ${styles.afterForm}`}>
                        <span className={`${styles.t5} ${styles.signUpLabel}`}>{t('form.newUser')}</span>
                        <LinkButton
                            text={t('form.signUp')}
                            url={`/${locale}/auth/registration`}
                            color={ColorSelector("--g-color8")}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
