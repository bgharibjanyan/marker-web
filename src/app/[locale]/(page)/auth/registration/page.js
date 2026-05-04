"use client";

import Form from "@/app/components/util/form/Form";
import styles from "./page.module.scss";
import {useTranslations, useLocale} from 'next-intl';
import {previewLayers, useRegistrationLogic} from "./scripts";
import Button from "@/app/components/util/buttons/MarkerButton/Button";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import LinkButton from "@/app/components/util/form/LinkButton/LinkButton";

export default function Registration() {
    const locale = useLocale();
    const t = useTranslations('Registration');
    const {form, currentIndex, changeLayer, sendToRegister, goToConfirm, backToRegistration} = useRegistrationLogic();

    const formFields = [
        {
            field: "text",
            type: "text",
            name: "firstName",
            placeholder: "name",
            value: "",
            label: t('form.firstName'),
            size: "half"
        },
        {
            field: "text",
            type: "text",
            name: "lastName",
            placeholder: "surname",
            value: "",
            label: t('form.lastName'),
            size: "half"
        },
        {
            field: "text",
            type: "text",
            name: "email",
            placeholder: "example@example.com",
            value: "",
            label: t('form.email'),
            size: "full"
        },
        {
            field: "text",
            type: "number",
            name: "age",
            placeholder: "0",
            value: 0,
            label: t('form.age'),
            size: "third",
        },
        {
            field: "select",
            name: "sex",
            value: null,
            options: [
                {value: "male", label: "male"},
                {value: "female", label: "female"},
                {value: "other", label: "other"},
            ],
            label: t('form.sex'),
            size: "third",
        }, {
            size: "third",
        },
        {
            field: "button",
            type: "button",
            name: 'submit',
            label: t('form.continue'),
            onClick: (formData) => goToConfirm(formData)
        },
    ];

    const confirmFormFields = [
        {
            field: "text",
            type: "password",
            name: "password",
            placeholder: "*********",
            value: "",
            label: t('form.confirm.passwordLabel'),
            size: "full"
        }, {
            field: "text",
            type: "password",
            name: "confirm_password",
            placeholder: "*********",
            value: "",
            label: t('form.confirm.confirmPasswordLabel'),
            size: "full"
        },
        {
            field: "checkbox",
            name: "rememberMe",
            label: t('form.checkboxLabel'),
            checked: false,
            size: "full"
        },
        {
            name: 'submit',
            field: "button",
            type: "button",
            label: t('form.confirm.signup'),
            onClick: (formData) => sendToRegister(formData)
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

                        {previewLayers[index + 1] && index === currentIndex &&
                            <button className={styles.nextButton}
                                    style={{backgroundColor: previewLayers[index + 1].color,}}
                                    onClick={() => changeLayer(index + 1)}>
                                <svg className={`${styles.icon} ${styles.next}`}>
                                    <use href={`/images/sprites.svg#icon-arrow-right`}></use>
                                </svg>
                            </button>
                        }

                        {previewLayers[index - 1] && index === currentIndex &&
                            <button className={styles.prevButton}
                                    style={{
                                        backgroundColor: previewLayers[index - 1].color,
                                        left: `${(currentIndex - index) * 60 + 20}px`,
                                    }}
                                    onClick={() => changeLayer(index - 1)}>

                                <svg className={`${styles.icon} ${styles.prev}`}>
                                    <use href={`/images/sprites.svg#icon-arrow-right`}></use>
                                </svg>
                            </button>
                        }
                    </div>
                ))}
            </div>
            <div
                className={`${styles.formSectionContainer} ${form === "confirm" ? styles.openConfirm : styles.openRegistration}`}>
                <div className={`${styles.formSection}`}>
                    <h1 className={`${styles.t1} ${styles.formTitle}`}>{t('form.title')}</h1>
                    <span className={`${styles.t3} ${styles.formDescription}`}>{t('form.description')}</span>
                    <Form fields={formFields}/>

                    <div className={`${styles.t5} ${styles.afterForm}`}>
                        <span className={`${styles.t5} ${styles.signUpLabel}`}>{t('form.haveAccount')}</span>
                        <LinkButton
                            text={t('form.signIn')}
                            url={`/${locale}/auth/login`}
                            color={ColorSelector("--g-color8")}
                        />
                    </div>
                </div>

                <div className={`${styles.confirmSection}`}>
                    <div className={`${styles.goBack}`}>
                        <Button
                            icon="icon-arrow-left"
                            type="secondery"
                            text={t('form.confirm.goBack')}
                            size="M"
                            horizontalAlign="start"
                            bgColor={ColorSelector("--g-color1")}
                            textColor={ColorSelector("--g-color2")}
                            width="auto"
                            onClick={() => {
                                backToRegistration()
                            }}
                            casual={false}
                            shadowColor="#9E373E"
                        />
                    </div>

                    <h1 className={`${styles.t1} ${styles.formTitle}`}>{t('form.confirm.title')}</h1>
                    <span className={`${styles.t3} ${styles.formDescription}`}>{t('form.confirm.description')}</span>

                    <Form fields={confirmFormFields}/>
                </div>
            </div>
        </div>
    );
}
