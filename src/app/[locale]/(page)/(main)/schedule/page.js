"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";
import styles from "./page.module.scss";
import CommonTasksWidget from "@/app/components/widgets/tasks/CommonTasksWidget/CommonTasksWidget";
import TabNavigation from "@/app/components/util/tabs/TabNavigation/TabNavigation";
import CreateEvent from "@/app/components/overlays/popup/CreateEvent/CreateEvent";
import CreatePost from "@/app/components/overlays/popup/CreatePost/CreatePost";
import ConfirmPopup from "@/app/components/overlays/popup/ConfirmPopup/ConfirmPopup";
import {usePopup} from "@/app/components/overlays/popup/PopupProvider/PopupProvider";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import MonthlySchadule from "./components/MonthlySchadule";
import YearlySchadule from "./components/YearlySchadule";
import DailySchadule from "./components/DailySchadule";
import WeeklySchadule from "./components/WeeklySchadule";
import SchaduleGlobalInfo from "./components/SchaduleGlobalInfo";
import {getDateRange, getMonthCalendarDays, getTasksForDate, getWeekStart} from "./components/scripts/scheduleUtils";

const TABLET_LARGE_QUERY = "(max-width: 1024px)";

export default function SchedulePage() {
    const t = useTranslations("SchedulePage");
    const taskWidgetT = useTranslations("TasksWidget");
    const {openPopup} = usePopup();
    const [activeTabKey, setActiveTabKey] = useState("month");
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isMounted, setIsMounted] = useState(false);
    const today = useMemo(() => new Date(), []);
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [visibleMonth, setVisibleMonth] = useState(() => new Date());
    const [visibleWeek, setVisibleWeek] = useState(() => new Date());
    const [visibleYear, setVisibleYear] = useState(() => new Date().getFullYear());
    const [isTabletLarge, setIsTabletLarge] = useState(false);

    const tabs = useMemo(() => [
        {key: "year", label: t("tabs.year"), color: ColorSelector("--g-color4")},
        {key: "month", label: t("tabs.month"), color: ColorSelector("--g-color8")},
        {key: "week", label: t("tabs.week"), color: ColorSelector("--g-color5")},
        {key: "day", label: t("tabs.day"), color: ColorSelector("--g-color13")},
    ], [t]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    
    const availableTabs = useMemo(() => (
        isTabletLarge ? tabs.filter((tab) => tab.key !== "month") : tabs
    ), [isTabletLarge, tabs]);

    const loadTasks = useCallback(async ({showLoading = false} = {}) => {
        if (showLoading) {
            setIsLoading(true);
        }

        try {
            const token = localStorage.getItem("marker_im_token");
            const response = await fetch("/api/task/get-user-task", {
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
    }, [t]);

    useEffect(() => {
        loadTasks({showLoading: true});
    }, [loadTasks]);

    useEffect(() => {
        const handleTasksUpdated = () => loadTasks();

        window.addEventListener("marker:tasks-updated", handleTasksUpdated);
        return () => window.removeEventListener("marker:tasks-updated", handleTasksUpdated);
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

    const todayTasks = useMemo(() => getTasksForDate(tasks, today), [tasks, today]);
    const selectedDayTasks = useMemo(() => getTasksForDate(tasks, selectedDate), [tasks, selectedDate]);
    const weekDays = useMemo(() => getDateRange(getWeekStart(visibleWeek), 7), [visibleWeek]);
    const monthCalendarDays = useMemo(() => getMonthCalendarDays(visibleMonth), [visibleMonth]);
    const yearMonths = useMemo(() => (
        Array.from({length: 12}, (_, index) => new Date(visibleYear, index, 1))
    ), [visibleYear]);
    const repeatingTasks = tasks.filter((task) => task.repeat);
    const datedTasks = tasks.filter((task) => !task.repeat && task.date);
    const privateTasks = tasks.filter((task) => task.isPrivate);

    const openCreateTask = () => {
        openPopup(
            <CreateEvent onSaved={() => loadTasks()}/>
        );
    };

    const openDailyView = useCallback((date) => {
        setSelectedDate(new Date(date));
        setActiveTabKey("day");
    }, []);

    const handleEditTask = useCallback((task) => {
        openPopup(
            <CreateEvent
                task={task}
                onSaved={() => loadTasks()}
            />
        );
    }, [loadTasks, openPopup]);

    const handleDeleteTask = useCallback((task) => {
        openPopup(
            <ConfirmPopup
                title={taskWidgetT("delete.title")}
                message={taskWidgetT("delete.message", {task: task.title})}
                confirmText={taskWidgetT("delete.confirm")}
                cancelText={taskWidgetT("delete.cancel")}
                errorMessage={taskWidgetT("delete.error")}
                onConfirm={async () => {
                    const token = localStorage.getItem("marker_im_token");
                    const response = await fetch("/api/task/delete-task", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...(token ? {Authorization: token} : {}),
                        },
                        body: JSON.stringify({taskId: task._id}),
                    });

                    if (!response.ok) {
                        throw new Error(taskWidgetT("delete.error"));
                    }

                    await loadTasks();
                    window.dispatchEvent(new CustomEvent("marker:tasks-updated"));
                }}
            />
        );
    }, [loadTasks, openPopup, taskWidgetT]);

    const handleCreatePost = useCallback((task) => {
        openPopup(
            <CreatePost task={task}/>
        );
    }, [openPopup]);

    if (!isMounted) {
        return (
            <div className={styles.schedulePage}>
                <section className={styles.scheduleWorkspace}>
                    <div className={styles.emptyState}>{t("states.loading")}</div>
                </section>
            </div>
        );
    }

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
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteTask}
                    onCreatePost={handleCreatePost}
                    t={t}
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
                    onDayClick={openDailyView}
                    t={t}
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
                    onDayClick={openDailyView}
                    t={t}
                />
            );
        }

        return (
            <DailySchadule
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedDayTasks={selectedDayTasks}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onCreatePost={handleCreatePost}
                t={t}
            />
        );
    };

    return (
        <div className={styles.schedulePage}>
            <section className={styles.scheduleWorkspace}>
                <SchaduleGlobalInfo
                    totalTasks={tasks.length}
                    todayTasksCount={todayTasks.length}
                    repeatingTasksCount={repeatingTasks.length}
                    privateTasksCount={privateTasks.length}
                    onCreateTask={openCreateTask}
                    t={t}
                />

                <div className={styles.tabPanel}>
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

                <div className={styles.scheduleSummary}>
                    <span>{t("summary.label")}</span>
                    <strong>{t("summary.value", {dated: datedTasks.length, repeating: repeatingTasks.length})}</strong>
                </div>
            </section>

            <aside className={styles.rightSidebar}>
                <CommonTasksWidget/>
            </aside>
        </div>
    );
}
