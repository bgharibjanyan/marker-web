"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import styles from "./page.module.scss";
import {
    AdminButton,
    AdminCheckboxField,
    AdminFormGrid,
    AdminPageHeader,
    AdminSelectField,
    AdminStatusMessage,
    AdminTextField
} from "@/app/components/admin";

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

const getUserDisplayName = (user) => (
    [user.firstname, user.lastname].filter(Boolean).join(" ") || user.login || user.email || "Unnamed user"
);

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

    const updateUserFields = (fields) => {
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
                        ...fields,
                        name: getUserDisplayName({...user, ...fields})
                    }
                    : user
            ))
        ));
    };

    const updateUser = (field, value) => updateUserFields({[field]: value});

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
            <AdminPageHeader eyebrow="Users" title="Account settings"/>

            {error ? <AdminStatusMessage type="error">{error}</AdminStatusMessage> : null}

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
                            <AdminButton onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : "Save"}
                            </AdminButton>
                        </div>
                    </div>

                    {isSaved ? <AdminStatusMessage>User configuration saved.</AdminStatusMessage> : null}

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

                    <AdminFormGrid>
                        <AdminTextField label="First name" value={selectedUser.firstname} onChange={(value) => updateUser("firstname", value)}/>
                        <AdminTextField label="Last name" value={selectedUser.lastname} onChange={(value) => updateUser("lastname", value)}/>
                        <AdminTextField label="Login" value={selectedUser.login} onChange={(value) => updateUser("login", value)}/>
                        <AdminTextField label="Email" type="email" value={selectedUser.email} onChange={(value) => updateUser("email", value)}/>
                        <AdminTextField
                            label="New password"
                            type="password"
                            value={password}
                            placeholder="Leave empty to keep current"
                            onChange={(value) => {
                                setPassword(value);
                                setIsSaved(false);
                                setError("");
                            }}
                        />
                        <AdminTextField
                            label="Age"
                            type="number"
                            min="0"
                            value={selectedUser.age}
                            onChange={(value) => updateUser("age", value === "" ? "" : Number(value))}
                        />
                        <AdminSelectField
                            label="Sex"
                            value={selectedUser.sex}
                            options={sexes}
                            onChange={(value) => updateUser("sex", value)}
                        />
                        <AdminTextField label="Address" value={selectedUser.address} onChange={(value) => updateUser("address", value)}/>
                        <AdminSelectField
                            label="Country"
                            value={selectedUser.country}
                            placeholder="Select country"
                            options={countryOptions.map((item) => item.country)}
                            onChange={(value) => updateUserFields({country: value, city: ""})}
                        />
                        <AdminSelectField
                            label="City"
                            value={selectedUser.city}
                            placeholder={selectedUser.country ? "Select city" : "Select country first"}
                            options={visibleCityOptions}
                            onChange={(value) => updateUser("city", value)}
                            disabled={!selectedUser.country}
                        />
                        <AdminSelectField
                            label="Status"
                            value={selectedUser.status}
                            options={statuses}
                            onChange={(value) => updateUser("status", value)}
                        />
                        <AdminTextField label="Timezone" value={selectedUser.timezone} onChange={(value) => updateUser("timezone", value)}/>
                    </AdminFormGrid>

                    <div className={styles.settingsGrid}>
                        <AdminCheckboxField
                            label="Public profile"
                            checked={selectedUser.publicProfile}
                            onChange={(checked) => updateUser("publicProfile", checked)}
                        />
                        <AdminCheckboxField
                            label="Notifications"
                            checked={selectedUser.notifications}
                            onChange={(checked) => updateUser("notifications", checked)}
                        />
                        <AdminCheckboxField
                            label="Direct messages"
                            checked={selectedUser.allowMessages}
                            onChange={(checked) => updateUser("allowMessages", checked)}
                        />
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
