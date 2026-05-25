"use client";

import {sanitizeRichText, stripRichText} from "@/app/lib/richText";
import styles from "./RichTextContent.module.scss";

const joinClassNames = (...classNames) => classNames.filter(Boolean).join(" ");

export default function RichTextContent({value, fallback = null, className = ""}) {
    const sanitizedValue = sanitizeRichText(value);
    const hasContent = Boolean(stripRichText(sanitizedValue));

    if (!hasContent) {
        return fallback;
    }

    return (
        <div
            className={joinClassNames(styles.richTextContent, className)}
            dangerouslySetInnerHTML={{__html: sanitizedValue}}
        />
    );
}
