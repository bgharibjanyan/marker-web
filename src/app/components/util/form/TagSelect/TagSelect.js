"use client";

import {useMemo, useState} from "react";
import styles from "./TagSelect.module.scss";

const normalizeTag = (value) => (
    String(value || "")
        .trim()
        .replace(/^#+/, "")
        .replace(/\s+/g, " ")
        .toLowerCase()
);

const getTagName = (tag) => normalizeTag(typeof tag === "string" ? tag : tag?.name);

export default function TagSelect({
    label = "Tags",
    selectedTags = [],
    popularTags = [],
    onChange,
    disabled = false,
    placeholder = "Create tag",
}) {
    const [draft, setDraft] = useState("");
    const normalizedSelectedTags = useMemo(() => (
        [...new Set(selectedTags.map(getTagName).filter(Boolean))]
    ), [selectedTags]);
    const selectedSet = useMemo(() => new Set(normalizedSelectedTags), [normalizedSelectedTags]);
    const availablePopularTags = useMemo(() => (
        popularTags
            .map((tag) => ({
                name: getTagName(tag),
                usage: Number(tag?.usage || 0),
            }))
            .filter((tag) => tag.name && !selectedSet.has(tag.name))
    ), [popularTags, selectedSet]);

    const updateTags = (nextTags) => {
        if (disabled) {
            return;
        }

        onChange?.([...new Set(nextTags.map(getTagName).filter(Boolean))]);
    };

    const addTag = (value) => {
        const nextTag = normalizeTag(value);

        if (!nextTag || selectedSet.has(nextTag)) {
            setDraft("");
            return;
        }

        updateTags([...normalizedSelectedTags, nextTag]);
        setDraft("");
    };

    const removeTag = (tagName) => {
        updateTags(normalizedSelectedTags.filter((tag) => tag !== tagName));
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addTag(draft);
        }

        if (event.key === "Backspace" && !draft && normalizedSelectedTags.length) {
            removeTag(normalizedSelectedTags[normalizedSelectedTags.length - 1]);
        }
    };

    return (
        <div className={styles.tagSelect}>
            {label ? <span className={styles.label}>{label}</span> : null}

            <div className={styles.selectedTags}>
                {normalizedSelectedTags.length ? normalizedSelectedTags.map((tag) => (
                    <span key={tag} className={styles.selectedTag}>
                        #{tag}
                        {!disabled ? (
                            <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove #${tag}`}>
                                x
                            </button>
                        ) : null}
                    </span>
                )) : <span className={styles.emptyTag}>No tags selected</span>}
            </div>

            {!disabled ? (
                <label className={styles.inputRow}>
                    <span>#</span>
                    <input
                        type="text"
                        value={draft}
                        placeholder={placeholder}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button type="button" onClick={() => addTag(draft)} disabled={!draft.trim()}>
                        Add
                    </button>
                </label>
            ) : null}

            {availablePopularTags.length ? (
                <div className={styles.popularTags}>
                    {availablePopularTags.slice(0, 16).map((tag) => (
                        <button
                            key={tag.name}
                            type="button"
                            onClick={() => addTag(tag.name)}
                            disabled={disabled}
                            title={`${tag.usage} users`}
                        >
                            #{tag.name}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
