'use client';

import styles from "./Header.module.scss";
import LanguageSwitcher from "@/app/components/util/LanguageSwitcher/LanguageSwitcher";
import {useLocale, useTranslations} from 'next-intl';
import {usePathname, useRouter} from "next/navigation";
import LinkButton from "@/app/components/util/form/LinkButton/LinkButton";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import {useEffect, useState} from "react";

import UserManager from "@/app/lib/user/UserManager";

export default function Header() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Global');

    const [activeColor, setActiveColor] = useState(ColorSelector("--g-color5"));
    const [defaultColor, setDefaultColor] = useState(ColorSelector("--g-color2"));

    const [userProfilePicture, setUserProfilePicture] = useState("/uploads/profiles/default/image.png");
    const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

    const [user, setUser] = useState(null);

    useEffect(() => {
        setActiveColor(ColorSelector('--g-color5'));
        setDefaultColor(ColorSelector('--g-color2'));

        const loadUser = async () => {
            const u = await UserManager.getUser();
            setUser(u);

            if (u && (u.id || u._id)) {
                setUserProfilePicture(`/uploads/profiles/${u.id || u._id}.png`);
                setIsUserLoggedIn(true);
            } else {
                setUserProfilePicture("/uploads/profiles/default/image.png");
                setIsUserLoggedIn(false);
            }
        };

        loadUser();

    }, []);

    useEffect(() => {
        const checkUserAuthAndLoadProfile = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setIsUserLoggedIn(false);
                    return;
                }

                const authResponse = await fetch('/api/auth/check', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (authResponse.ok) {
                    const {user} = await authResponse.json();
                    setIsUserLoggedIn(true);

                    const profileResponse = await fetch(`/api/user/profile?userId=${user._id}`);
                    if (profileResponse.ok) {
                        const {user: userProfile} = await profileResponse.json();
                        setUserProfilePicture(userProfile.profilePicture || "/uploads/profiles/default/image.png");
                    }
                } else {
                    setIsUserLoggedIn(false);
                    localStorage.removeItem('authToken');
                }
            } catch (error) {
                console.error('Error checking user auth:', error);
                setIsUserLoggedIn(false);
            }
        };

        checkUserAuthAndLoadProfile();
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
                        e.target.src = "/uploads/profiles/default/image.png";
                    }}
                />
            ) : (
                <img
                    className={styles.userAvatar}
                    src="/uploads/profiles/default/image.png"
                    alt={t('alt.defaultAvatar')}
                />
            )}
        </div>
    );
}
