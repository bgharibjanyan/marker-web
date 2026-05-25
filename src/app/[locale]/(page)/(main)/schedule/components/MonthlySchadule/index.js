import styles from "./MonthlySchadule.module.scss";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import {stripRichText} from "@/app/lib/richText";
import {formatDateKey, getTaskDisplayTime, getTasksForDate, isTaskPrivateForViewer} from "../scripts/scheduleUtils";

export default function MonthlySchadule({
                                            monthCalendarDays,
                                            visibleMonth,
                                            setVisibleMonth,
                                            tasks,
                                            today,
                                            onDayClick,
                                            t,
                                            viewerUserId = "",
                                        }) {
    const goToMonth = (direction) => {
        setVisibleMonth((currentMonth) => (
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1)
        ));
    };

    const renderTaskPill = (task) => {
        const isPrivateHidden = isTaskPrivateForViewer(task, viewerUserId);
        const displayTime = getTaskDisplayTime(task, t("labels.anytime"));
        const description = stripRichText(task.description);

        return (
            <span
                key={task._id}
                className={`${styles.taskPill} ${isPrivateHidden ? styles.disabledTaskPill : ""}`}
                style={{"--task-color": task.color || ColorSelector("--g-color13")}}
                title={isPrivateHidden ? displayTime : (description || task.title)}
                aria-disabled={isPrivateHidden}
            >
                <span>{displayTime}</span>
                {!isPrivateHidden ? <strong>{task.title}</strong> : null}
            </span>
        );
    };

    const handleDayKeyDown = (event, date) => {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        onDayClick?.(date);
    };

    return (
        <div className={styles.monthlySchadule}>
            <div className={styles.monthControls}>
                <button type="button" onClick={() => goToMonth(-1)}>
                    {t("actions.previousMonth")}
                </button>
                <strong>{visibleMonth.toLocaleDateString([], {month: "long", year: "numeric"})}</strong>
                <button type="button" onClick={() => goToMonth(1)}>
                    {t("actions.nextMonth")}
                </button>
            </div>

            <div className={styles.monthWeekdays}>
                {Array.from({length: 7}, (_, index) => {
                    const date = new Date(2024, 0, index + 1);

                    return (
                        <span key={date.getDay()}>{date.toLocaleDateString([], {weekday: "short"})}</span>
                    );
                })}
            </div>

            <div className={styles.monthGrid}>
                {monthCalendarDays.map(({date, isCurrentMonth}) => {
                    const dateKey = formatDateKey(date);
                    const dayTasks = isCurrentMonth ? getTasksForDate(tasks, date) : [];
                    const isToday = dateKey === formatDateKey(today);

                    return (
                        <article
                            key={dateKey}
                            className={`${styles.dayCell} ${isToday && isCurrentMonth ? styles.isToday : ""} ${!isCurrentMonth ? styles.isDisabledDay : ""}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => onDayClick?.(date)}
                            onKeyDown={(event) => handleDayKeyDown(event, date)}
                            aria-label={date.toLocaleDateString([], {weekday: "long", month: "long", day: "numeric", year: "numeric"})}
                        >
                            <div className={styles.cellHeader}>
                                <span>{date.toLocaleDateString([], {weekday: "short"})}</span>
                                <strong>{date.getDate()}</strong>
                            </div>
                            <div className={styles.cellTasks}>
                                {dayTasks.slice(0, 3).map(renderTaskPill)}
                                {dayTasks.length > 3 ? (
                                    <span className={styles.moreTasks}>{t("labels.more", {count: dayTasks.length - 3})}</span>
                                ) : null}
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
