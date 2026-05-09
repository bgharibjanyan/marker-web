"use client"
import styles from "./Network.module.scss";

import React from "react";
import {useState, useEffect} from "react";
import {useTranslations} from "next-intl";
import useApiCall from "@/app/lib/api/call";
import UserManager from "@/app/lib/user/UserManager";
import AccountItem from "@/app/components/widgets/Network/AccountItem/AccountItem";

const NetworkWidget = ({}) => {
    const t = useTranslations('NetworkWidget');
    const [network, setNetwork] = useState([]);
    const apiCall = useApiCall();

    useEffect(() => {
        const fetchNetwork = async () => {
            try {
                const user = await UserManager.getUser();

                if (user?.connections?.length) {
                    const res = await apiCall("post", "/user/get-user-collection", {
                        ids: user.connections,
                    });
                    setNetwork(res.data?.users || []);
                    console.log(network[0])
                }
            } catch (err) {
                console.error("Error fetching network:", err);
            }
        };

        fetchNetwork();
    }, []);
    return (
        <div className={styles.userListContainer}>
            <h6 className={`${styles.t5} ${styles.headline}`}>{t('title')}</h6>

            <div className={styles.userList}>
                {network[0]?.name}
                {network.length ? (
                    network.map((user, index) => (
                        <React.Fragment key={index}>
                            <AccountItem user={user}></AccountItem>
                        </React.Fragment>
                    ))
                ) : (
                    <p className={`${styles.t4} ${styles.emptyMessage}`}>{t('empty')}</p>
                )}
            </div>
        </div>
    );
};

export default NetworkWidget;
