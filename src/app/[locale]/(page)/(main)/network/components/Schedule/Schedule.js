"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";
import styles from "./Schedule.module.scss";
import TabNavigation from "@/app/components/util/tabs/TabNavigation/TabNavigation";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import MonthlySchadule from "../../../schedule/components/MonthlySchadule";
import YearlySchadule from "../../../schedule/components/YearlySchadule";
import DailySchadule from "../../../schedule/components/DailySchadule";
import WeeklySchadule from "../../../schedule/components/WeeklySchadule";
import {
    getDateRange,
    getMonthCalendarDays,
    getTasksForDate,
    getWeekStart,
} from "../../../schedule/components/scripts/scheduleUtils";

const TABLET_LARGE_QUERY = "(max-width: 1024px)";

const getUserId = (user) => String(user?._id || user?.id || "");

export default function Schedule({currentUser, selectedUser}) {
    const t = useTranslations("SchedulePage");
    const [activeTabKey, setActiveTabKey] = useState("month");
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const today = useMemo(() => new Date(), []);
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [visibleMonth, setVisibleMonth] = useState(() => new Date());
    const [visibleWeek, setVisibleWeek] = useState(() => new Date());
    const [visibleYear, setVisibleYear] = useState(() => new Date().getFullYear());
    const [isTabletLarge, setIsTabletLarge] = useState(false);

    const currentUserId = useMemo(() => getUserId(currentUser), [currentUser]);
    const selectedUserId = useMemo(() => getUserId(selectedUser), [selectedUser]);

    const tabs = useMemo(() => [
        {key: "year", label: t("tabs.year"), color: ColorSelector("--g-color4")},
        {key: "month", label: t("tabs.month"), color: ColorSelector("--g-color8")},
        {key: "week", label: t("tabs.week"), color: ColorSelector("--g-color5")},
        {key: "day", label: t("tabs.day"), color: ColorSelector("--g-color13")},
    ], [t]);

    const availableTabs = useMemo(() => (
        isTabletLarge ? tabs.filter((tab) => tab.key !== "month") : tabs
    ), [isTabletLarge, tabs]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const loadTasks = useCallback(async () => {
        if (!selectedUserId) {
            setTasks([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const token = localStorage.getItem("marker_im_token");
            const response = await fetch(`/api/task/get-user-task?userId=${encodeURIComponent(selectedUserId)}`, {
                headers: {
                    ...(token ? {Authorization: token} : {}),
                },
            });
            const data = await response.json();

            if (!response.ok) {
                setError(t("states.loadFailed"));
                return;
            }

            setError("");
            setTasks(Array.isArray(data.tasks) ? data.tasks : []);
        } catch (err) {
            setError(t("states.loadFailed"));
        } finally {
            setIsLoading(false);
        }
    }, [selectedUserId, t]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    useEffect(() => {
        const mediaQuery = window.matchMedia(TABLET_LARGE_QUERY);
        const updateTabletLargeState = () => setIsTabletLarge(mediaQuery.matches);

        updateTabletLargeState();
        mediaQuery.addEventListener("change", updateTabletLargeState);

        return () => mediaQuery.removeEventListener("change", updateTabletLargeState);
    }, []);

    useEffect(() => {
        if (isTabletLarge && activeTabKey === "month") {
            setActiveTabKey("week");
        }
    }, [activeTabKey, isTabletLarge]);

    useEffect(() => {
        setSelectedDate(new Date());
        setVisibleMonth(new Date());
        setVisibleWeek(new Date());
        setVisibleYear(new Date().getFullYear());
    }, [selectedUserId]);

    const selectedDayTasks = useMemo(() => getTasksForDate(tasks, selectedDate), [tasks, selectedDate]);
    const weekDays = useMemo(() => getDateRange(getWeekStart(visibleWeek), 7), [visibleWeek]);
    const monthCalendarDays = useMemo(() => getMonthCalendarDays(visibleMonth), [visibleMonth]);
    const yearMonths = useMemo(() => (
        Array.from({length: 12}, (_, index) => new Date(visibleYear, index, 1))
    ), [visibleYear]);

    const renderActiveView = () => {
        if (activeTabKey === "year") {
            return (
                <YearlySchadule
                    yearMonths={yearMonths}
                    tasks={tasks}
                    today={today}
                    visibleYear={visibleYear}
                    setVisibleYear={setVisibleYear}
                    selectedDate={selectedDate}
                    selectedDayTasks={selectedDayTasks}
                    setSelectedDate={setSelectedDate}
                    t={t}
                    viewerUserId={currentUserId}
                />
            );
        }

        if (activeTabKey === "month") {
            return (
                <MonthlySchadule
                    monthCalendarDays={monthCalendarDays}
                    visibleMonth={visibleMonth}
                    setVisibleMonth={setVisibleMonth}
                    tasks={tasks}
                    today={today}
                    t={t}
                    viewerUserId={currentUserId}
                />
            );
        }

        if (activeTabKey === "week") {
            return (
                <WeeklySchadule
                    weekDays={weekDays}
                    setVisibleWeek={setVisibleWeek}
                    tasks={tasks}
                    today={today}
                    t={t}
                    viewerUserId={currentUserId}
                />
            );
        }

        return (
            <DailySchadule
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedDayTasks={selectedDayTasks}
                t={t}
                viewerUserId={currentUserId}
            />
        );
    };

    if (!selectedUserId) {
        return <div className={styles.emptyState}>{t("states.noTasksSelected")}</div>;
    }

    if (!isMounted) {
        return <div className={styles.emptyState}>{t("states.loading")}</div>;
    }

    return (
        <div className={styles.networkSchedule}>
            <TabNavigation
                tabList={availableTabs}
                activeTabKey={activeTabKey}
                onTabClick={(tab) => setActiveTabKey(tab.key)}
            />

            <div className={styles.viewMeta}>
                <span>{t("labels.currentRange")}</span>
                <strong>
                    {activeTabKey === "year" && visibleYear}
                    {activeTabKey === "month" && visibleMonth.toLocaleDateString([], {month: "long", year: "numeric"})}
                    {activeTabKey === "week" && `${weekDays[0].toLocaleDateString()} - ${weekDays[6].toLocaleDateString()}`}
                    {activeTabKey === "day" && selectedDate.toLocaleDateString([], {weekday: "long", month: "long", day: "numeric"})}
                </strong>
            </div>

            {isLoading ? (
                <div className={styles.emptyState}>{t("states.loading")}</div>
            ) : error ? (
                <div className={styles.errorState}>{error}</div>
            ) : (
                renderActiveView()
            )}
        </div>
    );
}
