"use client";

import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";
import styles from "./page.module.scss";
import useApiCall from "@/app/lib/api/call";
import UserManager from "@/app/lib/user/UserManager";
import TextInput from "@/app/components/util/form/TextInput/TextInput";
import AccountItem from "@/app/components/widgets/Network/AccountItem/AccountItem";
import TabNavigation from "@/app/components/util/tabs/TabNavigation/TabNavigation";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import Chat from "./components/Chat/Chat";
import Schedule from "./components/Schedule/Schedule";
import ProfileContent from "../profile/components/ProfileContent/ProfileContent";

const getUserId = (user) => String(user?._id || user?.id || "");

export default function NetworkPage() {
    const t = useTranslations('NetworkPage');
    const apiCall = useApiCall();
    const [currentUser, setCurrentUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [search, setSearch] = useState("");
    const [searchedUsers, setSearchedUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTabKey, setActiveTabKey] = useState("chat");
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    const dashboardTabs = [
        {key: "chat", label: t('tabs.chat'), color: ColorSelector("--g-color5")},
        {key: "posts", label: t('tabs.posts'), color: ColorSelector("--g-color4")},
        {key: "schedule", label: t('tabs.schedule'), color: ColorSelector("--g-color8")},
        {key: "profile", label: t('tabs.profile'), color: ColorSelector("--g-color8")},
    ];

    const connectionIds = useMemo(() => {
        return new Set((currentUser?.connections || []).map((id) => String(id)));
    }, [currentUser]);

    const displayedUsers = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        const friendMatches = normalizedSearch
            ? friends.filter((user) => {
                const fullName = `${user?.firstname || ""} ${user?.lastname || ""}`.toLowerCase();
                return fullName.includes(normalizedSearch)
                    || String(user?.email || "").toLowerCase().includes(normalizedSearch)
                    || String(user?.login || "").toLowerCase().includes(normalizedSearch);
            })
            : friends;

        const friendIds = new Set(friendMatches.map(getUserId));
        const sortedSearchUsers = searchedUsers.filter((user) => !friendIds.has(getUserId(user)));

        return [...friendMatches, ...sortedSearchUsers];
    }, [friends, search, searchedUsers]);

    useEffect(() => {
        const fetchFriends = async () => {
            setIsLoading(true);

            try {
                const user = await UserManager.getUser();
                setCurrentUser(user);

                if (!user?.connections?.length) {
                    setFriends([]);
                    return;
                }

                const response = await apiCall("post", "/user/get-user-collection", {
                    ids: user.connections,
                });

                if (response.success) {
                    setFriends(response.data?.users || []);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchFriends();
    }, []);

    useEffect(() => {
        const query = search.trim();

        if (!query) {
            setSearchedUsers([]);
            return;
        }

        const searchTimer = setTimeout(async () => {
            setIsSearching(true);

            try {
                const response = await apiCall("post", "/user/search-users", {query});

                if (response.success) {
                    setSearchedUsers(response.data?.users || []);
                }
            } finally {
                setIsSearching(false);
            }
        }, 250);

        return () => clearTimeout(searchTimer);
    }, [search]);

    useEffect(() => {
        if (!displayedUsers.length) {
            setSelectedUser(null);
            return;
        }
        const selectedUserExists = displayedUsers.some((user) => getUserId(user) === getUserId(selectedUser));

        if (!selectedUser || !selectedUserExists) {
            setSelectedUser(displayedUsers[0]);
        }
    }, [displayedUsers, selectedUser]);

    return (
        <div className={styles.networkPage}>
            <section className={styles.users}>
                <div className={styles.search}>
                    <TextInput
                        name="networkSearch"
                        casual={true}
                        shadowColor={ColorSelector("--g-color8")}
                        label={t('search.label')}
                        placeholder={t('search.placeholder')}
                        value={search}
                        onChange={(name, value) => setSearch(value)}
                    />
                </div>

                <div className={styles.userList}>
                    {isLoading ? (
                        <p className={`${styles.t5} ${styles.emptyMessage}`}>{t('states.loading')}</p>
                    ) : displayedUsers.length ? (
                        displayedUsers.map((user) => {
                            const isFriend = connectionIds.has(getUserId(user));

                            return (
                                <AccountItem
                                    key={getUserId(user)}
                                    user={user}
                                    isFriend={isFriend}
                                    isSelected={getUserId(user) === getUserId(selectedUser)}
                                    friendLabel={t('states.friend')}
                                    onClick={() => setSelectedUser(user)}
                                />
                            );
                        })
                    ) : (
                        <p className={`${styles.t5} ${styles.emptyMessage}`}>
                            {search.trim() ? t('states.noSearchResults') : t('states.empty')}
                        </p>
                    )}

                    {isSearching && (
                        <span className={`${styles.t7} ${styles.searching}`}>{t('states.searching')}</span>
                    )}
                </div>
            </section>

            <section className={styles.userDashboard}>
                <div className={styles.dashboardHeader}>
                    <TabNavigation
                        tabList={dashboardTabs}
                        activeTabKey={activeTabKey}
                        onTabClick={(tab) => setActiveTabKey(tab.key)}
                    />
                </div>

                <div className={styles.dashboardBody}>
                    {activeTabKey === "chat" && (
                        <Chat currentUser={currentUser} selectedUser={selectedUser}/>
                    )}
                    {activeTabKey === "schedule" && (
                        <Schedule currentUser={currentUser} selectedUser={selectedUser}/>
                    )}
                    {activeTabKey === "profile" && (
                        <ProfileContent
                            embedded
                            userId={getUserId(selectedUser)}
                            user={selectedUser}
                            currentUser={currentUser}
                        />
                    )}
                </div>
            </section>
        </div>
    );
}
