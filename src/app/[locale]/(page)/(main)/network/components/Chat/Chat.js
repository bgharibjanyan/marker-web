"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {useTranslations} from "next-intl";
import styles from "./Chat.module.scss";
import useApiCall from "@/app/lib/api/call";
import TextInput from "@/app/components/util/form/TextInput/TextInput";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import Message from "./Message";

const PAGE_SIZE = 20;
const getUserId = (user) => String(user?._id || user?.id || "");

const getDisplayName = (user, fallback) => {
    const fullName = [user?.firstname, user?.lastname].filter(Boolean).join(" ").trim();
    return fullName || user?.login || user?.email || fallback;
};

export default function Chat({currentUser, selectedUser}) {
    const t = useTranslations("NetworkPage.chat");
    const apiCall = useApiCall();
    const listRef = useRef(null);
    const isLoadingMoreRef = useRef(false);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState("");
    const [editingMessage, setEditingMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState("");

    const currentUserId = useMemo(() => getUserId(currentUser), [currentUser]);
    const selectedUserId = useMemo(() => getUserId(selectedUser), [selectedUser]);
    const selectedUserName = useMemo(
        () => getDisplayName(selectedUser, t("labels.user")),
        [selectedUser, t]
    );

    const scrollToBottom = () => {
        const list = listRef.current;

        if (!list) {
            return;
        }

        setTimeout(() => {
            list.scrollTop = list.scrollHeight;
        }, 0);
    };

    useEffect(() => {
        let isCanceled = false;

        const loadInitialMessages = async () => {
            setMessages([]);
            setDraft("");
            setEditingMessage(null);
            setError("");
            setHasMore(false);

            if (!selectedUserId || !currentUserId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            try {
                const response = await apiCall("post", "/message/get-messages", {
                    userId: selectedUserId,
                    limit: PAGE_SIZE,
                });

                if (isCanceled) {
                    return;
                }

                if (!response.success) {
                    setError(response.error?.error || response.error?.message || t("states.loadFailed"));
                    return;
                }

                setMessages(response.data?.messages || []);
                setHasMore(Boolean(response.data?.hasMore));
                scrollToBottom();
            } finally {
                if (!isCanceled) {
                    setIsLoading(false);
                }
            }
        };

        loadInitialMessages();

        return () => {
            isCanceled = true;
        };
    }, [selectedUserId, currentUserId]);

    const loadOlderMessages = async () => {
        const oldestMessage = messages[0];

        if (
            isLoading ||
            isLoadingMoreRef.current ||
            !hasMore ||
            !selectedUserId ||
            !oldestMessage?.time
        ) {
            return;
        }

        const list = listRef.current;
        const previousScrollHeight = list?.scrollHeight || 0;
        const previousScrollTop = list?.scrollTop || 0;
        isLoadingMoreRef.current = true;
        setIsLoadingMore(true);

        try {
            const response = await apiCall("post", "/message/get-messages", {
                userId: selectedUserId,
                before: oldestMessage.time,
                limit: PAGE_SIZE,
            });

            if (!response.success) {
                setError(response.error?.error || response.error?.message || t("states.loadFailed"));
                return;
            }

            const olderMessages = response.data?.messages || [];

            setMessages((currentMessages) => {
                const currentIds = new Set(currentMessages.map((message) => message._id));
                const nextOlderMessages = olderMessages.filter((message) => !currentIds.has(message._id));
                return [...nextOlderMessages, ...currentMessages];
            });
            setHasMore(Boolean(response.data?.hasMore));

            setTimeout(() => {
                if (!list) {
                    return;
                }

                list.scrollTop = list.scrollHeight - previousScrollHeight + previousScrollTop;
            }, 0);
        } finally {
            isLoadingMoreRef.current = false;
            setIsLoadingMore(false);
        }
    };

    const handleScroll = (event) => {
        if (event.currentTarget.scrollTop <= 72) {
            loadOlderMessages();
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const value = draft.trim();

        if (!value || !selectedUserId || isSending) {
            return;
        }

        setIsSending(true);
        setError("");

        try {
            const response = editingMessage
                ? await apiCall("post", "/message/edit-message", {
                    messageId: editingMessage._id,
                    content: {type: "text", value},
                })
                : await apiCall("post", "/message/send-message", {
                    reciverId: selectedUserId,
                    content: {type: "text", value},
                });

            if (!response.success) {
                setError(response.error?.error || response.error?.message || t("states.sendFailed"));
                return;
            }

            const savedMessage = response.data?.message;

            if (!savedMessage) {
                return;
            }

            setMessages((currentMessages) => {
                if (editingMessage) {
                    return currentMessages.map((message) => (
                        message._id === savedMessage._id ? savedMessage : message
                    ));
                }

                return [...currentMessages, savedMessage];
            });
            setDraft("");
            setEditingMessage(null);

            if (!editingMessage) {
                scrollToBottom();
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleEditMessage = (message) => {
        setEditingMessage(message);
        setDraft(message?.content?.value || "");
    };

    const cancelEditing = () => {
        setEditingMessage(null);
        setDraft("");
    };

    if (!selectedUser) {
        return (
            <div className={styles.chat}>
                <div className={`${styles.emptyState} ${styles.t5}`}>{t("states.noUser")}</div>
            </div>
        );
    }

    return (
        <div className={styles.chat}>
            <div className={styles.chatHeader}>
                <div>
                    <span className={`${styles.t7} ${styles.chatEyebrow}`}>{t("labels.chatWith")}</span>
                    <h2 className={`${styles.t4} ${styles.chatTitle}`}>{selectedUserName}</h2>
                </div>
            </div>

            <div className={styles.messageList} ref={listRef} onScroll={handleScroll}>
                {isLoadingMore && (
                    <span className={`${styles.t7} ${styles.loadingMore}`}>{t("states.loadingMore")}</span>
                )}

                {isLoading ? (
                    <div className={`${styles.emptyState} ${styles.t5}`}>{t("states.loading")}</div>
                ) : messages.length ? (
                    messages.map((message) => (
                        <Message
                            key={message._id}
                            message={message}
                            isOwn={String(message.sender) === currentUserId}
                            labels={{
                                menu: t("actions.menu"),
                                edit: t("actions.edit"),
                            }}
                            onEdit={handleEditMessage}
                        />
                    ))
                ) : (
                    <div className={`${styles.emptyState} ${styles.t5}`}>{t("states.empty")}</div>
                )}
            </div>

            {error && <p className={`${styles.errorMessage} ${styles.t7}`}>{error}</p>}

            {editingMessage && (
                <div className={styles.editBar}>
                    <span className={styles.t7}>{t("labels.editing")}</span>
                    <button type="button" onClick={cancelEditing}>
                        {t("actions.cancel")}
                    </button>
                </div>
            )}

            <form className={styles.composer} onSubmit={handleSubmit}>
                <TextInput
                    name="chatMessage"
                    casual
                    shadowColor={ColorSelector("--g-color8")}
                    placeholder={editingMessage ? t("form.editPlaceholder") : t("form.placeholder")}
                    value={draft}
                    disabled={isSending}
                    onChange={(name, value) => setDraft(value)}
                    actionIcon="message-send-icon"
                    actionLabel={editingMessage ? t("actions.save") : t("actions.send")}
                    actionButtonType="submit"
                    actionDisabled={isSending || !draft.trim()}
                />
            </form>
        </div>
    );
}
