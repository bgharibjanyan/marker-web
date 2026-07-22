"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import styles from "./ProfileContent.module.scss";
import Button from "@/app/components/util/buttons/MarkerButton/Button";
import TagSelect from "@/app/components/util/form/TagSelect/TagSelect";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import useApiCall from "@/app/lib/api/call";
import UserManager from "@/app/lib/user/UserManager";
import {useRouter} from "@/i18n/navigation";

const defaultProfilePicture = "/uploads/profiles/default/image.png";
const sexes = ["male", "female", "other"];

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
    {country: "United Arab Emirates", cities: ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman"]},
];

const getUserId = (user) => String(user?._id || user?.id || "");
const getProfilePicture = (user) => user?.profilePicture || defaultProfilePicture;
const getShareUrl = (locale, userId) => {
    if (typeof window === "undefined" || !userId) {
        return "";
    }

    return `${window.location.origin}/${locale}/profile/${userId}`;
};

const getDraftFromUser = (user) => ({
    firstname: user?.firstname || "",
    lastname: user?.lastname || "",
    login: user?.login || "",
    email: user?.email || "",
    age: user?.age ?? "",
    sex: user?.sex || "",
    address: user?.address || "",
    country: user?.country || "",
    city: user?.city || "",
    timezone: user?.timezone || "Asia/Yerevan",
    publicProfile: user?.publicProfile ?? true,
    notifications: user?.notifications ?? true,
    allowMessages: user?.allowMessages ?? true,
    favoriteTags: user?.favoriteTags || [],
});

function ProfileField({label, value}) {
    return (
        <div className={styles.infoField}>
            <span>{label}</span>
            <strong>{value || "-"}</strong>
        </div>
    );
}

function TextField({label, value, onChange, type = "text", ...props}) {
    return (
        <label className={styles.editField}>
            <span>{label}</span>
            <input
                type={type}
                value={value ?? ""}
                onChange={(event) => onChange(event.target.value)}
                {...props}
            />
        </label>
    );
}

function SelectField({label, value, onChange, options = [], placeholder = "", disabled = false}) {
    return (
        <label className={styles.editField}>
            <span>{label}</span>
            <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
                {placeholder ? <option value="">{placeholder}</option> : null}
                {options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        </label>
    );
}

function CheckboxField({label, checked, onChange}) {
    return (
        <label className={styles.checkboxField}>
            <input
                type="checkbox"
                checked={Boolean(checked)}
                onChange={(event) => onChange(event.target.checked)}
            />
            <span>{label}</span>
        </label>
    );
}

export default function ProfileContent({
    userId = "",
    embedded = false,
    user = null,
    currentUser = null,
    mode = "view",
}) {
    const t = useTranslations("ProfilePage");
    const locale = useLocale();
    const apiCall = useApiCall();
    const router = useRouter();
    const [profileUser, setProfileUser] = useState(user);
    const [viewerUser, setViewerUser] = useState(currentUser);
    const [draft, setDraft] = useState(() => getDraftFromUser(user));
    const [popularTags, setPopularTags] = useState([]);
    const [isOwner, setIsOwner] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(!user);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isFollowingBusy, setIsFollowingBusy] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [error, setError] = useState("");
    const isSettingsMode = mode === "settings";
    const profileUserId = userId || getUserId(user);
    const selectedCountry = countryOptions.find((item) => item.country === draft.country);
    const cityOptions = selectedCountry?.cities || [];
    const visibleCityOptions = draft.city && !cityOptions.includes(draft.city)
        ? [draft.city, ...cityOptions]
        : cityOptions;
    const shareUrl = useMemo(() => getShareUrl(locale, getUserId(profileUser)), [locale, profileUser]);

    const loadProfile = useCallback(async () => {
        setIsLoading(true);
        setError("");
        setStatusMessage("");

        try {
            const token = localStorage.getItem("marker_im_token");
            const params = new URLSearchParams();

            if (profileUserId) {
                params.set("userId", profileUserId);
            }

            const response = await fetch(`/api/profile/get-profile${params.toString() ? `?${params.toString()}` : ""}`, {
                headers: {
                    ...(token ? {Authorization: token} : {}),
                },
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.error || t("states.loadFailed"));
                return;
            }

            setProfileUser(data.user);
            setViewerUser(data.currentUser);
            setDraft(getDraftFromUser(data.user));
            setIsOwner(Boolean(data.isOwner));
            setIsFollowing(Boolean(data.isFollowing));
        } catch (err) {
            setError(t("states.loadFailed"));
        } finally {
            setIsLoading(false);
        }
    }, [profileUserId, t]);

    const loadPopularTags = useCallback(async () => {
        try {
            const response = await fetch("/api/tags?limit=24");
            const data = await response.json();

            if (response.ok) {
                setPopularTags(data.tags || []);
            }
        } catch (err) {
            setPopularTags([]);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        loadPopularTags();
    }, [loadPopularTags]);

    const updateDraft = (field, value) => {
        setStatusMessage("");
        setError("");
        setDraft((currentDraft) => ({
            ...currentDraft,
            [field]: value,
        }));
    };

    const syncCurrentUser = (nextUser) => {
        if (!nextUser || getUserId(nextUser) !== getUserId(viewerUser)) {
            return;
        }

        UserManager.user = nextUser;
        setViewerUser(nextUser);
        window.dispatchEvent(new CustomEvent("marker:user-updated", {detail: {user: nextUser}}));
    };

    const handleSave = async () => {
        if (!isOwner || isSaving) {
            return;
        }

        setIsSaving(true);
        setError("");
        setStatusMessage("");

        try {
            const response = await apiCall("patch", "/profile/update-profile", {
                ...draft,
                age: draft.age === "" ? "" : Number(draft.age),
            });

            if (!response.success) {
                setError(response.error?.error || response.error?.message || t("states.saveFailed"));
                return;
            }

            setProfileUser(response.data.user);
            setDraft(getDraftFromUser(response.data.user));
            syncCurrentUser(response.data.user);
            setStatusMessage(t("states.saved"));
            loadPopularTags();
        } finally {
            setIsSaving(false);
        }
    };

    const handleProfileImageChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file || !isOwner) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setError(t("states.imageTypeError"));
            event.target.value = "";
            return;
        }

        setIsUploadingImage(true);
        setError("");
        setStatusMessage("");

        try {
            const token = localStorage.getItem("marker_im_token");
            const formData = new FormData();

            formData.append("image", file);

            const response = await fetch("/api/profile/profile-image", {
                method: "POST",
                headers: {
                    ...(token ? {Authorization: token} : {}),
                },
                body: formData,
            });
            const data = await response.json();

            if (!response.ok) {
                setError(data.error || t("states.imageFailed"));
                return;
            }

            setProfileUser(data.user);
            setDraft(getDraftFromUser(data.user));
            syncCurrentUser(data.user);
            setStatusMessage(t("states.imageSaved"));
        } catch (err) {
            setError(t("states.imageFailed"));
        } finally {
            setIsUploadingImage(false);
            event.target.value = "";
        }
    };

    const handleShare = async () => {
        if (!shareUrl) {
            return;
        }

        try {
            await navigator.clipboard.writeText(shareUrl);
            setStatusMessage(t("states.shared"));
        } catch (err) {
            setStatusMessage(shareUrl);
        }
    };

    const handleFollowToggle = async () => {
        if (!profileUser || isOwner || isFollowingBusy) {
            return;
        }

        setIsFollowingBusy(true);
        setError("");

        try {
            const response = await apiCall("post", isFollowing ? "/user/unfollow-user" : "/user/follow-user", {
                userId: getUserId(profileUser),
            });

            if (!response.success) {
                setError(response.error?.error || response.error?.message || t("states.followFailed"));
                return;
            }

            const updatedUser = response.data?.user;

            if (updatedUser) {
                UserManager.user = updatedUser;
                setViewerUser(updatedUser);
                window.dispatchEvent(new CustomEvent("marker:user-updated", {detail: {user: updatedUser}}));
            }

            setIsFollowing((value) => !value);
        } finally {
            setIsFollowingBusy(false);
        }
    };

    if (isLoading) {
        return <div className={`${styles.profileContent} ${embedded ? styles.embedded : ""}`}><div className={styles.emptyState}>{t("states.loading")}</div></div>;
    }

    if (error && !profileUser) {
        return <div className={`${styles.profileContent} ${embedded ? styles.embedded : ""}`}><div className={styles.errorState}>{error}</div></div>;
    }

    if (!profileUser) {
        return <div className={`${styles.profileContent} ${embedded ? styles.embedded : ""}`}><div className={styles.emptyState}>{t("states.empty")}</div></div>;
    }

    return (
        <section className={`${styles.profileContent} ${embedded ? styles.embedded : ""}`}>
            <div className={styles.profileHero}>
                <div className={styles.avatarPanel}>
                    <img
                        src={getProfilePicture(profileUser)}
                        alt={profileUser.name}
                        onError={(event) => {
                            event.currentTarget.src = defaultProfilePicture;
                        }}
                    />
                    {isOwner && isSettingsMode ? (
                        <label className={styles.uploadButton}>
                            {isUploadingImage ? t("actions.uploading") : t("actions.uploadImage")}
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                onChange={handleProfileImageChange}
                                disabled={isUploadingImage}
                            />
                        </label>
                    ) : null}
                </div>

                <div className={styles.identityPanel}>
                    <span className={styles.eyebrow}>{isOwner ? t("labels.myProfile") : t("labels.profile")}</span>
                    <h1>{profileUser.name}</h1>
                    <div className={styles.identityMeta}>
                        <span>@{profileUser.login || "-"}</span>
                        <span>{profileUser.email || "-"}</span>
                    </div>
                    <div className={styles.actions}>
                        {isOwner && !isSettingsMode ? (
                            <>
                                <Button
                                    text={t("actions.settings")}
                                    size="M"
                                    padding="8px 16px"
                                    bgColor={ColorSelector("--g-color2")}
                                    textColor={ColorSelector("--g-color1")}
                                    onClick={() => router.push("/profile/settings")}
                                />
                                <Button
                                    text={t("actions.archive")}
                                    size="M"
                                    padding="8px 16px"
                                    bgColor={ColorSelector("--g-color5")}
                                    textColor={ColorSelector("--g-color1")}
                                    onClick={() => router.push("/profile/archive")}
                                />
                            </>
                        ) : null}
                        {!isOwner ? (
                            <>
                                <Button
                                    text={t("actions.share")}
                                    size="M"
                                    padding="8px 16px"
                                    bgColor={ColorSelector("--g-color2")}
                                    textColor={ColorSelector("--g-color1")}
                                    onClick={handleShare}
                                />
                                <Button
                                    text={isFollowing ? t("actions.unfollow") : t("actions.follow")}
                                    size="M"
                                    padding="8px 16px"
                                    bgColor={isFollowing ? ColorSelector("--g-color8") : ColorSelector("--g-color5")}
                                    textColor={ColorSelector("--g-color1")}
                                    onClick={handleFollowToggle}
                                    disabled={isFollowingBusy}
                                />
                            </>
                        ) : null}
                    </div>

                    <div className={styles.heroTags}>
                        <TagSelect
                            label={t("fields.favoriteTags")}
                            selectedTags={isOwner && isSettingsMode ? draft.favoriteTags : profileUser.favoriteTags}
                            popularTags={isOwner && isSettingsMode ? popularTags : []}
                            onChange={(tags) => updateDraft("favoriteTags", tags)}
                            placeholder={t("fields.tagPlaceholder")}
                            disabled={!isOwner || !isSettingsMode}
                        />
                    </div>
                </div>
            </div>

            {statusMessage ? <div className={styles.statusMessage}>{statusMessage}</div> : null}
            {error ? <div className={styles.errorMessage}>{error}</div> : null}

            {isOwner && isSettingsMode ? (
                <div className={styles.profileEditor}>
                    <div className={styles.formGrid}>
                        <TextField label={t("fields.firstname")} value={draft.firstname} onChange={(value) => updateDraft("firstname", value)}/>
                        <TextField label={t("fields.lastname")} value={draft.lastname} onChange={(value) => updateDraft("lastname", value)}/>
                        <TextField label={t("fields.login")} value={draft.login} onChange={(value) => updateDraft("login", value)}/>
                        <TextField label={t("fields.email")} type="email" value={draft.email} onChange={(value) => updateDraft("email", value)}/>
                        <TextField label={t("fields.age")} type="number" min="0" value={draft.age} onChange={(value) => updateDraft("age", value)}/>
                        <SelectField label={t("fields.sex")} value={draft.sex} onChange={(value) => updateDraft("sex", value)} options={sexes} placeholder={t("fields.select")}/>
                        <TextField label={t("fields.address")} value={draft.address} onChange={(value) => updateDraft("address", value)}/>
                        <SelectField
                            label={t("fields.country")}
                            value={draft.country}
                            onChange={(value) => {
                                updateDraft("country", value);
                                updateDraft("city", "");
                            }}
                            options={countryOptions.map((item) => item.country)}
                            placeholder={t("fields.select")}
                        />
                        <SelectField
                            label={t("fields.city")}
                            value={draft.city}
                            onChange={(value) => updateDraft("city", value)}
                            options={visibleCityOptions}
                            placeholder={draft.country ? t("fields.select") : t("fields.selectCountry")}
                            disabled={!draft.country}
                        />
                        <TextField label={t("fields.timezone")} value={draft.timezone} onChange={(value) => updateDraft("timezone", value)}/>
                    </div>

                    <div className={styles.settingsGrid}>
                        <CheckboxField label={t("fields.publicProfile")} checked={draft.publicProfile} onChange={(value) => updateDraft("publicProfile", value)}/>
                        <CheckboxField label={t("fields.notifications")} checked={draft.notifications} onChange={(value) => updateDraft("notifications", value)}/>
                        <CheckboxField label={t("fields.allowMessages")} checked={draft.allowMessages} onChange={(value) => updateDraft("allowMessages", value)}/>
                    </div>

                    <div className={styles.saveBar}>
                        <Button
                            text={isSaving ? t("actions.saving") : t("actions.save")}
                            size="M"
                            padding="10px 20px"
                            bgColor={ColorSelector("--g-color5")}
                            textColor={ColorSelector("--g-color1")}
                            onClick={handleSave}
                            disabled={isSaving}
                        />
                    </div>
                </div>
            ) : (
                <>
                    <div className={styles.infoGrid}>
                        <ProfileField label={t("fields.firstname")} value={profileUser.firstname}/>
                        <ProfileField label={t("fields.lastname")} value={profileUser.lastname}/>
                        <ProfileField label={t("fields.login")} value={profileUser.login}/>
                        <ProfileField label={t("fields.email")} value={profileUser.email}/>
                        <ProfileField label={t("fields.age")} value={profileUser.age}/>
                        <ProfileField label={t("fields.sex")} value={profileUser.sex}/>
                        <ProfileField label={t("fields.address")} value={profileUser.address}/>
                        <ProfileField label={t("fields.country")} value={profileUser.country}/>
                        <ProfileField label={t("fields.city")} value={profileUser.city}/>
                        <ProfileField label={t("fields.timezone")} value={profileUser.timezone}/>
                    </div>

                </>
            )}
        </section>
    );
}
