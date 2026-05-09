"use client";

import {useEffect, useMemo, useState} from "react";
import styles from "./TabNavigation.module.scss";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";

const getTabKey = (tab, index) => tab?.key ?? index;

export default function TabNavigation({
    tabList = [],
    tablist = null,
    onTabClick,
    activeTabIndex = null,
    activeTabKey = null,
}) {
    const tabsSource = tablist ?? tabList;
    const tabs = Array.isArray(tabsSource) ? tabsSource : [];
    const hasActiveTabKey = activeTabKey !== null && activeTabKey !== undefined;
    const hasActiveTabIndex = activeTabIndex !== null && activeTabIndex !== undefined;

    const selectedIndex = useMemo(() => {
        if (!tabs.length) {
            return -1;
        }

        if (hasActiveTabKey) {
            const tabIndex = tabs.findIndex((tab, index) => getTabKey(tab, index) === activeTabKey);
            return tabIndex >= 0 ? tabIndex : 0;
        }

        if (hasActiveTabIndex && activeTabIndex >= 0 && activeTabIndex < tabs.length) {
            return activeTabIndex;
        }

        return 0;
    }, [activeTabIndex, activeTabKey, hasActiveTabIndex, hasActiveTabKey, tabs]);

    const [localActiveIndex, setLocalActiveIndex] = useState(selectedIndex);
    const isControlled = hasActiveTabKey || hasActiveTabIndex;
    const activeIndex = isControlled ? selectedIndex : localActiveIndex;

    useEffect(() => {
        if (!isControlled) {
            setLocalActiveIndex(selectedIndex);
        }
    }, [isControlled, selectedIndex]);

    const handleTabClick = (tab, index) => {
        if (!isControlled) {
            setLocalActiveIndex(index);
        }

        if (typeof onTabClick === "function") {
            onTabClick(tab);
        }
    };

    if (!tabs.length) {
        return null;
    }

    return (
        <div className={styles.tabNavigation} role="tablist">
            {tabs.map((tab, index) => {
                const isActive = index === activeIndex;
                const tabColor = tab?.color || ColorSelector("--g-color8");

                return (
                    <button
                        key={getTabKey(tab, index)}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`${styles.tabButton} ${isActive ? styles.active : ""}`}
                        style={{
                            "--tab-color": tabColor,
                        }}
                        onClick={() => handleTabClick(tab, index)}
                    >
                        {tab?.label}
                    </button>
                );
            })}
        </div>
    );
}
