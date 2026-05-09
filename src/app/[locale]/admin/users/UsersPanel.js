"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import styles from "./page.module.scss";

const statuses = ["Active", "Suspended", "Pending"];
const sexes = ["male", "female", "other"];
const adminHeaders = {
    "x-marker-admin-auth": "authenticated"
};
const USERS_PAGE_SIZE = 20;
const defaultProfileImage = "/uploads/profiles/default/image.png";
const countryOptions = [
    {country: "Armenia", cities: ["Yerevan", "Gyumri", "Vanadzor", "Vagharshapat", "Hrazdan"]},
    {country: "Russia", cities: ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan"]},
    {country: "France", cities: ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"]},
    {country: "Italy", cities: ["Rome", "Milan", "Naples", "Turin", "Florence"]},
    {country: "Germany", cities: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt"]},
    {country: "Spain", cities: ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza"]},
    {country: "United Kingdom", cities: ["London", "Manchester", "Birmingham", "Leeds", "Glasgow"]},
    {country: "United States", cities: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"]},
    {country: "Georgia", cities: ["Tbilisi", "Batumi", "Kutaisi", "Rustavi", "Gori"]},
    {country: "Greece", cities: ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa"]},
    {country: "Netherlands", cities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven"]},
    {country: "United Arab Emirates", cities: ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman"]}
];

export default function UsersPanel() {
    const [users, setUsers] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [search, setSearch] = useState("");
    const [nextSkip, setNextSkip] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [profileImageVersion, setProfileImageVersion] = useState(0);
    const [error, setError] = useState("");

    const loadUsers = useCallback(async ({reset = false, query = search} = {}) => {
        const skip = reset ? 0 : nextSkip;

        if (!reset && (!hasMore || isLoadingMore || isLoading)) {
            return;
        }

        reset ? setIsLoading(true) : setIsLoadingMore(true);
        setError("");

        try {
            const params = new URLSearchParams({
                limit: String(USERS_PAGE_SIZE),
                skip: String(skip)
            });

            if (query.trim()) {
                params.set("search", query.trim());
            }

            const response = await fetch(`/api/admin/users?${params.toString()}`, {
                headers: adminHeaders
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to load users.");
                return;
            }

            const loadedUsers = data.users || [];

            setUsers((currentUsers) => reset ? loadedUsers : [...currentUsers, ...loadedUsers]);
            setNextSkip(data.nextSkip || 0);
            setHasMore(Boolean(data.hasMore));

            if (reset) {
                setSelectedId(loadedUsers[0]?.id || "");
                setPassword("");
                setIsSaved(false);
            }
        } catch (err) {
            setError("Failed to load users.");
        } finally {
            reset ? setIsLoading(false) : setIsLoadingMore(false);
        }
    }, [hasMore, isLoading, isLoadingMore, nextSkip, search]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            loadUsers({reset: true, query: search});
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [search]);

    const selectedUser = useMemo(
        () => users.find((user) => user.id === selectedId) ?? null,
        [selectedId, users]
    );
    const selectedCountry = countryOptions.find((item) => item.country === selectedUser?.country);
    const cityOptions = selectedCountry?.cities || [];
    const visibleCityOptions = selectedUser?.city && !cityOptions.includes(selectedUser.city)
        ? [selectedUser.city, ...cityOptions]
        : cityOptions;
    const profileImageSrc = selectedUser?.profilePicture
        ? `${selectedUser.profilePicture}?v=${profileImageVersion}`
        : defaultProfileImage;

    const updateUser = (field, value) => {
        if (!selectedUser) {
            return;
        }

        setIsSaved(false);
        setError("");
        setUsers((currentUsers) => (
            currentUsers.map((user) => (
                user.id === selectedUser.id
                    ? {
                        ...user,
                        [field]: value,
                        name: field === "firstname" || field === "lastname"
                            ? [
                                field === "firstname" ? value : user.firstname,
                                field === "lastname" ? value : user.lastname
                            ].filter(Boolean).join(" ") || user.login || user.email || "Unnamed user"
                            : user.name
                    }
                    : user
            ))
        ));
    };

    const handleSave = async () => {
        if (!selectedUser) {
            return;
        }

        setIsSaving(true);
        setIsSaved(false);
        setError("");

        try {
            const response = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...adminHeaders
                },
                body: JSON.stringify({
                    ...selectedUser,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to save user.");
                return;
            }

            setUsers((currentUsers) => (
                currentUsers.map((user) => user.id === data.user.id ? data.user : user)
            ));
            setSelectedId(data.user.id);
            setPassword("");
            setIsSaved(true);
        } catch (err) {
            setError("Failed to save user.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleProfileImageChange = async (event) => {
        const file = event.target.files?.[0];

        if (!selectedUser || !file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file.");
            event.target.value = "";
            return;
        }

        setIsUploadingImage(true);
        setIsSaved(false);
        setError("");

        try {
            const formData = new FormData();
            formData.append("id", selectedUser.id);
            formData.append("image", file);

            const response = await fetch("/api/admin/users/profile-image", {
                method: "POST",
                headers: adminHeaders,
                body: formData
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to upload profile image.");
                return;
            }

            setUsers((currentUsers) => (
                currentUsers.map((user) => user.id === data.user.id ? data.user : user)
            ));
            setSelectedId(data.user.id);
            setProfileImageVersion(Date.now());
            setIsSaved(true);
        } catch (err) {
            setError("Failed to upload profile image.");
        } finally {
            setIsUploadingImage(false);
            event.target.value = "";
        }
    };

    const handleUserListScroll = (event) => {
        const {scrollTop, scrollHeight, clientHeight} = event.currentTarget;
        const isAtEnd = scrollTop + clientHeight >= scrollHeight - 24;

        if (isAtEnd) {
            loadUsers();
        }
    };

    return (
        <section className={styles.usersPage}>
            <div className={styles.header}>
                <div>
                    <span className={styles.eyebrow}>Users</span>
                    <h1>Account settings</h1>
                </div>
            </div>

            {error ? <div className={styles.errorState}>{error}</div> : null}

            <div className={styles.workspace}>
                <aside className={styles.userList}>
                    <label className={styles.searchField}>
                        <span>Search users</span>
                        <input
                            type="search"
                            value={search}
                            placeholder="Name, login, email, country, city"
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </label>

                    <div className={styles.userScrollArea} onScroll={handleUserListScroll}>
                        {isLoading ? <div className={styles.emptyState}>Loading users...</div> : null}
                        {!isLoading && !users.length ? <div className={styles.emptyState}>No users found.</div> : null}

                        {users.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                className={`${styles.userItem} ${user.id === selectedUser?.id ? styles.active : ""}`}
                                onClick={() => {
                                    setSelectedId(user.id);
                                    setPassword("");
                                    setIsSaved(false);
                                    setError("");
                                }}
                            >
                                <span>{user.name}</span>
                                <small>{user.email || user.login}</small>
                            </button>
                        ))}

                        {isLoadingMore ? <div className={styles.emptyState}>Loading more users...</div> : null}
                        {!isLoading && users.length && !hasMore ? (
                            <div className={styles.listEndState}>End of list</div>
                        ) : null}
                    </div>
                </aside>

                {selectedUser ? (
                <form className={styles.editor} onSubmit={(event) => event.preventDefault()}>
                    <div className={styles.editorHeader}>
                        <div>
                            <h2>{selectedUser.name}</h2>
                            <span>{selectedUser.id}</span>
                        </div>
                        <div className={styles.actions}>
                            <button type="button" className={styles.primaryButton} onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>

                    {isSaved ? <div className={styles.savedState}>User configuration saved.</div> : null}

                    <div className={styles.profileUploader}>
                        <img
                            src={profileImageSrc}
                            alt={selectedUser.name}
                            className={styles.profilePreview}
                            onError={(event) => {
                                event.currentTarget.src = defaultProfileImage;
                            }}
                        />
                        <div className={styles.profileUploadContent}>
                            <span>Profile image</span>
                            <strong>{selectedUser.profilePicture || "Default profile image"}</strong>
                            <label className={styles.uploadButton}>
                                {isUploadingImage ? "Uploading..." : "Upload image"}
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    onChange={handleProfileImageChange}
                                    disabled={isUploadingImage}
                                />
                            </label>
                        </div>
                    </div>

                    <div className={styles.formGrid}>
                        <label>
                            <span>First name</span>
                            <input value={selectedUser.firstname} onChange={(event) => updateUser("firstname", event.target.value)}/>
                        </label>
                        <label>
                            <span>Last name</span>
                            <input value={selectedUser.lastname} onChange={(event) => updateUser("lastname", event.target.value)}/>
                        </label>
                        <label>
                            <span>Login</span>
                            <input value={selectedUser.login} onChange={(event) => updateUser("login", event.target.value)}/>
                        </label>
                        <label>
                            <span>Email</span>
                            <input type="email" value={selectedUser.email} onChange={(event) => updateUser("email", event.target.value)}/>
                        </label>
                        <label>
                            <span>New password</span>
                            <input
                                type="password"
                                value={password}
                                placeholder="Leave empty to keep current"
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                    setIsSaved(false);
                                    setError("");
                                }}
                            />
                        </label>
                        <label>
                            <span>Age</span>
                            <input
                                type="number"
                                min="0"
                                value={selectedUser.age}
                                onChange={(event) => updateUser("age", Number(event.target.value))}
                            />
                        </label>
                        <label>
                            <span>Sex</span>
                            <select value={selectedUser.sex} onChange={(event) => updateUser("sex", event.target.value)}>
                                {sexes.map((sex) => <option key={sex} value={sex}>{sex}</option>)}
                            </select>
                        </label>
                        <label>
                            <span>Address</span>
                            <input value={selectedUser.address} onChange={(event) => updateUser("address", event.target.value)}/>
                        </label>
                        <label>
                            <span>Country</span>
                            <select
                                value={selectedUser.country}
                                onChange={(event) => {
                                    updateUser("country", event.target.value);
                                    updateUser("city", "");
                                }}
                            >
                                <option value="">Select country</option>
                                {countryOptions.map((item) => (
                                    <option key={item.country} value={item.country}>{item.country}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <span>City</span>
                            <select
                                value={selectedUser.city}
                                onChange={(event) => updateUser("city", event.target.value)}
                                disabled={!selectedUser.country}
                            >
                                <option value="">{selectedUser.country ? "Select city" : "Select country first"}</option>
                                {visibleCityOptions.map((city) => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <span>Status</span>
                            <select value={selectedUser.status} onChange={(event) => updateUser("status", event.target.value)}>
                                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </label>
                        <label>
                            <span>Timezone</span>
                            <input value={selectedUser.timezone} onChange={(event) => updateUser("timezone", event.target.value)}/>
                        </label>
                    </div>

                    <div className={styles.settingsGrid}>
                        <label className={styles.switchRow}>
                            <input
                                type="checkbox"
                                checked={selectedUser.publicProfile}
                                onChange={(event) => updateUser("publicProfile", event.target.checked)}
                            />
                            <span>Public profile</span>
                        </label>
                        <label className={styles.switchRow}>
                            <input
                                type="checkbox"
                                checked={selectedUser.notifications}
                                onChange={(event) => updateUser("notifications", event.target.checked)}
                            />
                            <span>Notifications</span>
                        </label>
                        <label className={styles.switchRow}>
                            <input
                                type="checkbox"
                                checked={selectedUser.allowMessages}
                                onChange={(event) => updateUser("allowMessages", event.target.checked)}
                            />
                            <span>Direct messages</span>
                        </label>
                    </div>

                </form>
                ) : (
                    <div className={styles.editor}>
                        <div className={styles.emptyState}>Select a user to edit settings.</div>
                    </div>
                )}
            </div>
        </section>
    );
}
