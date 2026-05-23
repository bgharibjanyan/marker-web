import {useEffect, useMemo, useState} from "react";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";
import {formatDateKey, getTaskDisplayTime, getTaskTimeRange, isTaskPrivateForViewer, parseTaskTime} from "../scripts/scheduleUtils";
import styles from "./DailySchadule.module.scss";

const DAY_MINUTES = 24 * 60;
const HOUR_MARKS = Array.from({length: 24}, (_, hour) => hour);
const DEFAULT_TASK_COLOR = ColorSelector("--g-color13");

const getTaskKey = (task, fallbackIndex) => task._id || `${task.title}-${task.start}-${fallbackIndex}`;

const formatRange = (task, t) => {
    return getTaskDisplayTime(task, t("labels.anytime"));
};

const formatDuration = (minutes) => {
    if (minutes <= 0) return "0m";

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (!hours) return `${remainingMinutes}m`;
    if (!remainingMinutes) return `${hours}h`;

    return `${hours}h ${remainingMinutes}m`;
};

const getDateTimeFromMinutes = (date, minutes) => {
    const dateTime = new Date(date);

    dateTime.setHours(0, minutes, 0, 0);
    return dateTime;
};

const getTaskTimer = (task, selectedDate, now, t) => {
    const range = getTaskTimeRange(task);
    const startMinutes = parseTaskTime(task.start);
    const isSelectedToday = formatDateKey(selectedDate) === formatDateKey(now);

    if (!isSelectedToday || startMinutes === null) {
        return {
            label: range ? t("labels.durationLabel") : t("labels.time"),
            value: range ? t("labels.duration", {time: formatDuration(range.end - range.start)}) : t("labels.anytime"),
        };
    }

    const startDateTime = getDateTimeFromMinutes(selectedDate, startMinutes);
    const endDateTime = range ? getDateTimeFromMinutes(selectedDate, range.end) : null;

    if (now < startDateTime) {
        return {
            label: t("labels.startsInLabel"),
            value: formatDuration(Math.ceil((startDateTime - now) / 60000)),
        };
    }

    if (endDateTime && now <= endDateTime) {
        return {
            label: t("labels.endsInLabel"),
            value: formatDuration(Math.ceil((endDateTime - now) / 60000)),
        };
    }

    return {
        label: t("labels.status"),
        value: t("labels.completed"),
    };
};

const getTimelineTasks = (tasks) => {
    const timedTasks = [];
    const anytimeTasks = [];

    tasks.forEach((task, index) => {
        const range = getTaskTimeRange(task);

        if (!range) {
            anytimeTasks.push({
                task,
                key: getTaskKey(task, index),
            });
            return;
        }

        timedTasks.push({
            task,
            range,
            key: getTaskKey(task, index),
        });
    });

    const laneEnds = [];
    const scheduledTasks = timedTasks
        .sort((firstTask, secondTask) => firstTask.range.start - secondTask.range.start)
        .map((timelineTask) => {
            const laneIndex = laneEnds.findIndex((laneEnd) => laneEnd <= timelineTask.range.start);
            const targetLane = laneIndex === -1 ? laneEnds.length : laneIndex;

            laneEnds[targetLane] = timelineTask.range.end;

            return {
                ...timelineTask,
                lane: targetLane,
            };
        });

    return {
        scheduledTasks,
        anytimeTasks,
        laneCount: Math.max(laneEnds.length, 1),
    };
};

const hasTimeOverlap = (firstTask, secondTask) => {
    const firstRange = getTaskTimeRange(firstTask);
    const secondRange = getTaskTimeRange(secondTask);

    if (!firstRange || !secondRange) return false;

    return firstRange.start < secondRange.end && secondRange.start < firstRange.end;
};

function TaskInfoCard({task, selectedDate, now, t, disabled = false, hiddenContent = false}) {
    const timer = getTaskTimer(task, selectedDate, now, t);

    if (hiddenContent) {
        return (
            <article
                className={`${styles.taskInfoCard} ${styles.disabledTaskInfoCard}`}
                style={{"--task-color": task.color || DEFAULT_TASK_COLOR}}
                aria-disabled="true"
            >
                <div className={styles.taskInfoHeader}>
                    <span>{formatRange(task, t)}</span>
                </div>
            </article>
        );
    }

    return (
        <article
            className={`${styles.taskInfoCard} ${disabled ? styles.disabledTaskInfoCard : ""}`}
            style={{"--task-color": task.color || DEFAULT_TASK_COLOR}}
        >
            <div className={styles.taskInfoHeader}>
                <strong>{task.title}</strong>
                <span>{formatRange(task, t)}</span>
            </div>
            <p>{task.description || t("states.noDescription")}</p>
            <div className={styles.taskTimer}>
                <span>{timer.label}</span>
                <strong>{timer.value}</strong>
            </div>
            <div className={styles.taskInfoMeta}>
                <span>{formatRange(task, t)}</span>
                {task.repeat ? <span>{t("labels.repeating")}</span> : null}
                {task.isPrivate ? <span>{t("labels.private")}</span> : null}
            </div>
        </article>
    );
}

export default function DailySchadule({selectedDate, setSelectedDate, selectedDayTasks, t, viewerUserId = ""}) {
    const [now, setNow] = useState(() => new Date());
    const {scheduledTasks, anytimeTasks, laneCount} = useMemo(() => (
        getTimelineTasks(selectedDayTasks)
    ), [selectedDayTasks]);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const selectedTask = useMemo(() => (
        selectedDayTasks.find((task, index) => getTaskKey(task, index) === selectedTaskId) || scheduledTasks[0]?.task || selectedDayTasks[0] || null
    ), [scheduledTasks, selectedDayTasks, selectedTaskId]);
    const selectedTaskKey = selectedTask ? getTaskKey(selectedTask, selectedDayTasks.indexOf(selectedTask)) : null;
    const isSelectedToday = formatDateKey(selectedDate) === formatDateKey(now);
    const currentMinutes = (now.getHours() * 60) + now.getMinutes();
    const currentTimePosition = (currentMinutes / DAY_MINUTES) * 100;
    const overlappingTasks = useMemo(() => {
        if (!selectedTask) return [];

        return selectedDayTasks.filter((task) => (
            task !== selectedTask && hasTimeOverlap(selectedTask, task)
        ));
    }, [selectedDayTasks, selectedTask]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            setNow(new Date());
        }, 60 * 1000);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        setSelectedTaskId(null);
    }, [selectedDate]);

    const goToDay = (direction) => {
        setSelectedDate((currentDate) => {
            const nextDate = new Date(currentDate);

            nextDate.setDate(currentDate.getDate() + direction);
            return nextDate;
        });
    };

    return (
        <div className={styles.dailySchadule}>
            <div className={styles.dayControls}>
                <button type="button" onClick={() => goToDay(-1)}>
                    {t("actions.previousDay")}
                </button>
                <strong>{selectedDate.toLocaleDateString([], {weekday: "long", month: "long", day: "numeric", year: "numeric"})}</strong>
                <button type="button" onClick={() => goToDay(1)}>
                    {t("actions.nextDay")}
                </button>
            </div>

            {!selectedDayTasks.length ? (
                <div className={styles.emptyState}>{t("states.noTasksSelected")}</div>
            ) : (
                <>
                    <div className={styles.timelineScroller}>
                        <div className={styles.timeline}>
                            <div className={styles.hourHeader}>
                                {HOUR_MARKS.map((hour) => (
                                    <span key={hour}>{String(hour).padStart(2, "0")}:00</span>
                                ))}
                            </div>

                            <div
                                className={styles.timelineBody}
                                style={{"--lane-count": laneCount}}
                            >
                                {HOUR_MARKS.map((hour) => (
                                    <span
                                        key={hour}
                                        className={styles.hourDivider}
                                        style={{left: `${(hour / 24) * 100}%`}}
                                    />
                                ))}

                                {isSelectedToday ? (
                                    <span
                                        className={styles.currentTimeLine}
                                        style={{left: `${currentTimePosition}%`}}
                                    >
                                <i>{now.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}</i>
                            </span>
                                ) : null}

                                {scheduledTasks.map(({task, range, lane, key}) => {
                                    const isSelected = key === selectedTaskKey;
                                    const isPrivateHidden = isTaskPrivateForViewer(task, viewerUserId);
                                    const duration = range.end - range.start;

                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            className={`${styles.timelineTask} ${isSelected ? styles.selectedTimelineTask : ""} ${isPrivateHidden ? styles.disabledTimelineTask : ""}`}
                                            style={{
                                                "--task-color": task.color || DEFAULT_TASK_COLOR,
                                                "--task-left": `${(range.start / DAY_MINUTES) * 100}%`,
                                                "--task-width": `${Math.max((duration / DAY_MINUTES) * 100, 2.5)}%`,
                                                "--task-lane": lane,
                                            }}
                                            onClick={() => setSelectedTaskId(key)}
                                            aria-disabled={isPrivateHidden}
                                        >
                                            {!isPrivateHidden ? <strong>{task.title}</strong> : null}
                                            <span>{formatRange(task, t)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {anytimeTasks.length ? (
                        <div className={styles.anytimeTasks}>
                            <span>{t("labels.anytime")}</span>
                            <div>
                                {anytimeTasks.map(({task, key}) => {
                                    const isPrivateHidden = isTaskPrivateForViewer(task, viewerUserId);

                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            className={`${styles.anytimeTask} ${isPrivateHidden ? styles.disabledAnytimeTask : ""}`}
                                            style={{"--task-color": task.color || DEFAULT_TASK_COLOR}}
                                            onClick={() => setSelectedTaskId(key)}
                                            aria-disabled={isPrivateHidden}
                                        >
                                            {isPrivateHidden ? formatRange(task, t) : task.title}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}

                    {selectedTask ? (
                        <section className={styles.selectedTaskPanel}>
                            <div className={styles.selectedTaskTitle}>
                                <span>{t("labels.selectedTask")}</span>
                                <strong>{selectedDate.toLocaleDateString([], {weekday: "long", month: "long", day: "numeric"})}</strong>
                            </div>

                            <TaskInfoCard
                                task={selectedTask}
                                selectedDate={selectedDate}
                                now={now}
                                t={t}
                                hiddenContent={isTaskPrivateForViewer(selectedTask, viewerUserId)}
                            />

                            {overlappingTasks.length ? (
                                <div className={styles.overlapGroup}>
                                    <span>{t("labels.overlappingTasks")}</span>
                                    {overlappingTasks.map((task, index) => (
                                        <TaskInfoCard
                                            key={getTaskKey(task, index)}
                                            task={task}
                                            selectedDate={selectedDate}
                                            now={now}
                                            t={t}
                                            disabled
                                            hiddenContent={isTaskPrivateForViewer(task, viewerUserId)}
                                        />
                                    ))}
                                </div>
                            ) : null}
                        </section>
                    ) : null}
                </>
            )}
        </div>
    );
}
