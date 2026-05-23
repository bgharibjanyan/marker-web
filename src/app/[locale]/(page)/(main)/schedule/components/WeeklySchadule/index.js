import styles from "./WeeklySchadule.module.scss";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import {
    formatDateKey,
    getMergedTaskHours,
    getTaskDisplayTime,
    getTasksForDate,
    isTaskPrivateForViewer,
} from "../scripts/scheduleUtils";

export default function WeeklySchadule({weekDays, setVisibleWeek, tasks, today, t, viewerUserId = ""}) {
    const goToWeek = (direction) => {
        setVisibleWeek((currentWeek) => {
            const nextWeek = new Date(currentWeek);
            nextWeek.setDate(currentWeek.getDate() + (direction * 7));
            return nextWeek;
        });
    };

    const renderTaskPill = (task) => {
        const isPrivateHidden = isTaskPrivateForViewer(task, viewerUserId);
        const displayTime = getTaskDisplayTime(task, t("labels.anytime"));

        return (
            <span
                key={task._id}
                className={`${styles.taskPill} ${isPrivateHidden ? styles.disabledTaskPill : ""}`}
                style={{"--task-color": task.color || ColorSelector("--g-color13")}}
                title={isPrivateHidden ? displayTime : (task.description || task.title)}
                aria-disabled={isPrivateHidden}
            >
                <span>{displayTime}</span>
                {!isPrivateHidden ? <strong>{task.title}</strong> : null}
            </span>
        );
    };

    return (
        <div className={styles.weeklySchadule}>
            <div className={styles.weekControls}>
                <button type="button" onClick={() => goToWeek(-1)}>
                    {t("actions.previousWeek")}
                </button>
                <strong>
                    {weekDays[0].toLocaleDateString([], {month: "short", day: "numeric"})}
                    {" - "}
                    {weekDays[6].toLocaleDateString([], {month: "short", day: "numeric", year: "numeric"})}
                </strong>
                <button type="button" onClick={() => goToWeek(1)}>
                    {t("actions.nextWeek")}
                </button>
            </div>

            <div className={styles.weekGrid}>
                {weekDays.map((date) => {
                    const dayTasks = getTasksForDate(tasks, date);
                    const occupiedHours = getMergedTaskHours(dayTasks);
                    const isToday = formatDateKey(date) === formatDateKey(today);

                    return (
                        <article key={formatDateKey(date)} className={`${styles.weekColumn} ${isToday ? styles.isToday : ""}`}>
                            <div className={styles.weekDayHeader}>
                                <span>{date.toLocaleDateString([], {weekday: "short"})}</span>
                                <strong>{date.getDate()}</strong>
                            </div>
                            <div className={styles.weekTasks}>
                                {dayTasks.length ? dayTasks.map(renderTaskPill) : (
                                    <span className={styles.emptyInline}>{t("states.noTasks")}</span>
                                )}
                            </div>
                            <div className={styles.weekDayUsage}>
                                <span>{t("labels.dayUsage")}</span>
                                <strong>{occupiedHours}/24 {t("labels.hour")}</strong>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
