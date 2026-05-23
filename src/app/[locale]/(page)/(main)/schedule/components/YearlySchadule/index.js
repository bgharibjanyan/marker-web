import styles from "./YearlySchadule.module.scss";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import {
    formatDateKey,
    getDateRange,
    getMonthDays,
    getMonthStartOffset,
    getTaskDisplayTime,
    getTasksForDate,
    getWeekStart,
    isTaskPrivateForViewer,
} from "../scripts/scheduleUtils";

export default function YearlySchadule({
                                           yearMonths,
                                           tasks,
                                           today,
                                           visibleYear,
                                           setVisibleYear,
                                           selectedDate,
                                           selectedDayTasks,
                                           setSelectedDate,
                                           t,
                                           viewerUserId = "",
                                       }) {
    const goToYear = (direction) => {
        setVisibleYear((currentYear) => currentYear + direction);
    };

    return (
        <div className={styles.yearDashboard}>
            <aside className={styles.selectedDayPanel}>
                <span className={styles.panelLabel}>{t("labels.selectedDay")}</span>
                <strong>{selectedDate.toLocaleDateString([], {weekday: "long", month: "long", day: "numeric"})}</strong>

                <div className={styles.selectedTaskList}>
                    {selectedDayTasks.length ? selectedDayTasks.map((task) => {
                        const isPrivateHidden = isTaskPrivateForViewer(task, viewerUserId);

                        return (
                            <article
                                key={task._id}
                                className={`${styles.selectedTask} ${isPrivateHidden ? styles.disabledSelectedTask : ""}`}
                                style={{"--task-color": task.color || ColorSelector("--g-color13")}}
                                aria-disabled={isPrivateHidden}
                            >
                                <span>{getTaskDisplayTime(task, t("labels.anytime"))}</span>
                                {!isPrivateHidden ? (
                                    <>
                                        <strong>{task.title}</strong>
                                        <small>{task.description || t("states.noDescription")}</small>
                                    </>
                                ) : null}
                            </article>
                        );
                    }) : (
                        <span className={styles.emptyInline}>{t("states.noTasksSelected")}</span>
                    )}
                </div>
            </aside>

            <div className={styles.yearCalendar}>
                <div className={styles.yearControls}>
                    <button type="button" onClick={() => goToYear(-1)}>
                        {t("actions.previousYear")}
                    </button>
                    <strong>{visibleYear}</strong>
                    <button type="button" onClick={() => goToYear(1)}>
                        {t("actions.nextYear")}
                    </button>
                </div>

                {yearMonths.map((month) => (
                    <article key={month.getMonth()} className={styles.yearMonth}>
                        <header>
                            <strong>{month.toLocaleDateString([], {month: "long"})}</strong>
                        </header>

                        <div className={styles.monthWeekdays}>
                            {getDateRange(getWeekStart(month), 7).map((date) => (
                                <span key={date.getDay()}>{date.toLocaleDateString([], {weekday: "narrow"})}</span>
                            ))}
                        </div>

                        <div className={styles.yearDays}>
                            {Array.from({length: getMonthStartOffset(month)}).map((_, index) => (
                                <span key={`empty-${index}`} className={styles.emptyDay}/>
                            ))}
                            {getMonthDays(month).map((date) => {
                                const dateKey = formatDateKey(date);
                                const selectedDateKey = formatDateKey(selectedDate);
                                const todayDateKey = formatDateKey(today);
                                const dayTasks = getTasksForDate(tasks, date);

                                return (
                                    <button
                                        type="button"
                                        key={dateKey}
                                        className={`${styles.yearDay} ${dateKey === selectedDateKey ? styles.isSelected : ""} ${dateKey === todayDateKey ? styles.isCurrentDay : ""}`}
                                        onClick={() => setSelectedDate(date)}
                                        aria-label={date.toLocaleDateString([], {weekday: "long", month: "long", day: "numeric"})}
                                    >
                                        <span>{date.getDate()}</span>
                                        {dayTasks.length ? <i>{dayTasks.length}</i> : null}
                                    </button>
                                );
                            })}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
