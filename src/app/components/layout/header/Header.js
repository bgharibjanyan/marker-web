'use client';

import styles from "./Header.module.scss";
import LanguageSwitcher from "@/app/components/util/LanguageSwitcher/LanguageSwitcher";
import {useLocale, useTranslations} from 'next-intl';
import {usePathname, useRouter} from "next/navigation";
import LinkButton from "@/app/components/util/form/LinkButton/LinkButton";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import {useEffect, useState} from "react";

import UserManager from "@/app/lib/user/UserManager";

const defaultProfilePicture = "/uploads/profiles/default/image.png";
const getProfilePicture = (user) => user?.profilePicture || defaultProfilePicture;

export default function Header() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Global');

    const [activeColor, setActiveColor] = useState(ColorSelector("--g-color5"));
    const [defaultColor, setDefaultColor] = useState(ColorSelector("--g-color2"));

    const [userProfilePicture, setUserProfilePicture] = useState(defaultProfilePicture);
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

    useEffect(() => {
        setActiveColor(ColorSelector('--g-color5'));
        setDefaultColor(ColorSelector('--g-color2'));

        const loadUser = async () => {
            const u = await UserManager.getUser();

            if (u && (u.id || u._id)) {
                setUserProfilePicture(getProfilePicture(u));
                setIsUserLoggedIn(true);
            } else {
                setUserProfilePicture(defaultProfilePicture);
                setIsUserLoggedIn(false);
            }
        };

        loadUser();

    }, []);

    const navList = [
        {
            label: t('header.Home'),
            src: ""
        },
        {
            label: t('header.Events'),
            src: "/events"
        },
        {
            label: t('header.Schedule'),
            src: "/schedule"
        }, {
            label: t('header.Network'),
            src: "/network"
        }
    ];

    const routChange = (src) => {
        router.replace(`/${locale}${src}`);
    };

    return (
        <div className={styles.headerContainer}>
            <a href="/" className={styles.logoContainer}>
                <img className={styles.logoMaximal} src="/images/logo/text_logo.svg" alt={t('alt.logo')}/>
                <img className={styles.logoMinimal} src="/images/logo/logo.svg" alt={t('alt.logo')}/>
            </a>

            <div className={styles.navList}>
                {navList.map((item, index) => {
                    const active = pathname === `/${locale}${item.src}`;
                    const color = active ? activeColor : defaultColor;

                    return (
                        <LinkButton
                            text={item.label}
                            key={index}
                            color={color}
                            onClick={() => routChange(item.src)}
                        />
                    );
                })}
            </div>

            <LanguageSwitcher currentLocale={locale}/>
            {isUserLoggedIn ? (
                <img
                    className={styles.userAvatar}
                    src={userProfilePicture}
                    alt={t('alt.userAvatar')}
                    onError={(e) => {
                        e.currentTarget.src = defaultProfilePicture;
                    }}
                />
            ) : (
                <img
                    className={styles.userAvatar}
                    src={defaultProfilePicture}
                    alt={t('alt.defaultAvatar')}
                />
            )}
        </div>
    );
}
