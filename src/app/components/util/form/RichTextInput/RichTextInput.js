"use client";

import {useEffect, useMemo, useState} from "react";
import {Editor} from "@tinymce/tinymce-react";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import styles from "./RichTextInput.module.scss";

const loadTinyMce = async () => {
    if (typeof window === "undefined") {
        return false;
    }

    if (window.tinymce?.EditorManager) {
        return true;
    }

    await import("tinymce/tinymce");
    await Promise.all([
        import("tinymce/models/dom"),
        import("tinymce/icons/default"),
        import("tinymce/themes/silver"),
        import("tinymce/plugins/autolink"),
        import("tinymce/plugins/link"),
        import("tinymce/plugins/lists"),
        import("tinymce/plugins/autoresize"),
        import("tinymce/plugins/wordcount"),
        import("tinymce/skins/ui/oxide/skin.js"),
        import("tinymce/skins/ui/oxide/content.js"),
        import("tinymce/skins/content/default/content.js"),
    ]);

    return Boolean(window.tinymce?.EditorManager);
};

export default function RichTextInput({
                                          name,
                                          value = "",
                                          onChange,
                                          label,
                                          placeholder = "",
                                          shadowColor,
                                          casual = false,
                                          disabled = false,
                                          minHeight = 220,
                                      }) {
    const [isTinyReady, setIsTinyReady] = useState(false);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        let isMounted = true;

        loadTinyMce()
            .then((isReady) => {
                if (isMounted) {
                    setIsTinyReady(isReady);
                    setLoadError(isReady ? "" : "Unable to load editor.");
                }
            })
            .catch(() => {
                if (isMounted) {
                    setIsTinyReady(false);
                    setLoadError("Unable to load editor.");
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const editorInit = useMemo(() => ({
        license_key: "gpl",
        menubar: false,
        statusbar: false,
        branding: false,
        promotion: false,
        resize: false,
        height: minHeight,
        min_height: minHeight,
        max_height: Math.max(minHeight + 160, 420),
        plugins: "autolink link lists autoresize wordcount",
        toolbar: "bold italic underline | forecolor backcolor | bullist numlist | link removeformat",
        toolbar_mode: "wrap",
        contextmenu: false,
        skin: "oxide",
        content_css: "default",
        placeholder,
        browser_spellcheck: true,
        convert_urls: false,
        link_assume_external_targets: "https",
        link_default_target: "_blank",
        target_list: false,
        rel_list: false,
        link_title: false,

        color_map: [
            "000000", "Black",
            "FFFFFF", "White",
            "9E373E", "Main Red",
            "FF0000", "Red",
            "00AA00", "Green",
            "0000FF", "Blue",
            "FFA500", "Orange",
            "800080", "Purple",
            "808080", "Gray",
        ],
        custom_colors: true,

        valid_elements: "p,br,strong/b,em/i,u,ul,ol,li,a[href|target|rel],span[style],font[color]",
        invalid_elements: "script,style,iframe,object,embed,form,input,button,meta,link",
        content_style: `
            body {
                box-sizing: border-box;
                margin: 0;
                padding: 16px 12px;
                color: #000;
                font-family: MontserratArm, sans-serif;
                font-size: 18px;
                line-height: 1.55;
            }

            body.mce-content-body[data-mce-placeholder]::before {
                color: #9b9b9b;
            }

            p,
            ul,
            ol {
                margin: 0 0 10px;
            }

            ul,
            ol {
                padding-left: 24px;
            }

            a {
                color: #9E373E;
                font-weight: 700;
            }

            @media (max-width: 560px) {
                body {
                    padding: 14px 10px;
                    font-size: 16px;
                }
            }
        `,
    }), [minHeight, placeholder]);

    return (
        <div className={styles.richTextField}>
            {label ? <span className={`${styles.t5} ${styles.fieldLabel}`}>{label}</span> : null}
            <div
                className={`${styles.editorContainer} ${casual ? styles.casual : ""} ${disabled ? styles.disabled : ""}`}
                style={{"--shadow-color": shadowColor || ColorSelector("--g-color8")}}
            >
                {isTinyReady ? (
                    <Editor
                        tinymceScriptSrc={[]}
                        textareaName={name}
                        value={value || ""}
                        disabled={disabled}
                        init={editorInit}
                        onEditorChange={(content) => onChange?.(name, content.trim())}
                    />
                ) : (
                    <div
                        className={`${styles.editorFallback} ${loadError ? styles.error : ""}`}
                        style={{minHeight}}
                        role="status"
                        aria-live="polite"
                    >
                        {loadError || placeholder}
                    </div>
                )}
            </div>
        </div>
    );
}
