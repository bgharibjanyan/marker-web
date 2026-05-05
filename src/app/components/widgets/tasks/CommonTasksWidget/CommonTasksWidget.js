"use client";

import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";
import TaskCard from "./TaskCard/TaskCard";
import styles from "./CommonTasksWidget.module.scss";

const WEEKDAYS = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
];

const formatDate = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const parseDate = (dateString) => {
    if (!dateString) return null;

    const [year, month, day] = String(dateString).split('-').map(Number);

    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day);
};

const parseTaskStart = (start) => {
    if (!start) return null;

    const match = String(start)
        .trim()
        .match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);

    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3]?.toLowerCase();

    if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) return null;

    if (period) {
        if (hours < 1 || hours > 12) return null;

        if (period === 'pm' && hours !== 12) hours += 12;
        if (period === 'am' && hours === 12) hours = 0;
    }

    if (hours > 23) return null;

    return {hours, minutes};
};

const getTaskTime = (task, date = new Date()) => {
    if (!task.start) return null;

    const time = parseTaskStart(task.start);

    if (!time) return null;

    const taskTime = new Date(date);
    taskTime.setHours(time.hours, time.minutes, 0, 0);

    return taskTime;
};

const getTaskStartMinutes = (task) => {
    const time = parseTaskStart(task.start);

    if (!time) return Number.MAX_SAFE_INTEGER;

    return (time.hours * 60) + time.minutes;
};

const isTaskForDate = (task, date) => {
    const weekday = WEEKDAYS[date.getDay()];
    const formattedDate = formatDate(date);
    const monthday = date.getDate();

    if (task.repeat) {
        if (task.repeatType === 'daily') return true;
        if (task.repeatType === 'weekly') return Array.isArray(task.weekdays) && task.weekdays.includes(weekday);
        if (task.repeatType === 'monthly') return Number(task.monthday) === monthday;
    }

    return task.date === formattedDate;
};

const getNextTaskOccurrence = (task, now) => {
    if (!parseTaskStart(task.start)) return null;

    if (!task.repeat) {
        const taskDate = parseDate(task.date);

        if (!taskDate) return null;

        const taskTime = getTaskTime(task, taskDate);

        return taskTime && taskTime.getTime() > now.getTime() ? taskTime : null;
    }

    const searchDate = new Date(now);
    searchDate.setHours(0, 0, 0, 0);

    for (let daysAhead = 0; daysAhead <= 366; daysAhead += 1) {
        const candidateDate = new Date(searchDate);
        candidateDate.setDate(searchDate.getDate() + daysAhead);

        if (!isTaskForDate(task, candidateDate)) continue;

        const taskTime = getTaskTime(task, candidateDate);

        if (taskTime && taskTime.getTime() > now.getTime()) {
            return taskTime;
        }
    }

    return null;
};

const formatTaskTimeLabel = (date) => {
    const dateLabel = formatDate(date);
    const todayLabel = formatDate(new Date());

    if (dateLabel === todayLabel) {
        return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    }

    return `${dateLabel} ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
};

const formatCountdown = (milliseconds) => {
    if (milliseconds <= 0) return '00:00:00';

    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
        .map((unit) => String(unit).padStart(2, '0'))
        .join(':');
};

const CommonTasksWidget = () => {
    const t = useTranslations('TasksWidget');
    const [tasks, setTasks] = useState([]);
    const [now, setNow] = useState(() => new Date());
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const token = localStorage.getItem('marker_im_token');
                const response = await fetch('/api/task/get-user-task', {
                    headers: {
                        ...(token ? {Authorization: token} : {}),
                    },
                });
                const data = await response.json();

                if (!response.ok) {
                    setError(t('errors.loadFailed'));
                    return;
                }

                setTasks(Array.isArray(data.tasks) ? data.tasks : []);
            } catch (error) {
                setError(t('errors.loadFailed'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchTasks();
    }, [t]);

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const todayTasks = useMemo(() => {
        return tasks
            .filter((task) => isTaskForDate(task, now))
            .sort((firstTask, secondTask) => {
                return getTaskStartMinutes(firstTask) - getTaskStartMinutes(secondTask);
            });
    }, [tasks, now]);

    const nextTaskOccurrence = useMemo(() => {
        return tasks.reduce((closestOccurrence, task) => {
            const taskTime = getNextTaskOccurrence(task, now);

            if (!taskTime) return closestOccurrence;
            if (!closestOccurrence || taskTime.getTime() < closestOccurrence.time.getTime()) {
                return {task, time: taskTime};
            }

            return closestOccurrence;
        }, null);
    }, [tasks, now]);

    const nextTask = nextTaskOccurrence?.task;
    const nextTaskTime = nextTaskOccurrence?.time || null;
    const countdown = nextTaskTime ? formatCountdown(nextTaskTime.getTime() - now.getTime()) : '00:00:00';

    useEffect(() => {
        if (!nextTaskTime) return;

        const delay = nextTaskTime.getTime() - Date.now();

        if (delay <= 0) return;

        const timeout = setTimeout(() => {
            setNow(new Date());
        }, delay);

        return () => clearTimeout(timeout);
    }, [nextTaskTime]);

    return (
        <div className={styles.commonTasks}>
            <div className={styles.nextTaskCard}>
                <span className={`${styles.sectionLabel} ${styles.t6}`}>{t('nextTask')}</span>

                {isLoading && <span className={`${styles.emptyMessage} ${styles.t6}`}>{t('loading')}</span>}
                {!isLoading && error && <span className={`${styles.errorMessage} ${styles.t6}`}>{error}</span>}
                {!isLoading && !error && !nextTask && (
                    <span className={`${styles.emptyMessage} ${styles.t6}`}>{t('noUpcomingTasks')}</span>
                )}

                {nextTask && (
                    <>
                        <span className={`${styles.taskName} ${styles.t5}`}>{nextTask.title}</span>
                        {nextTask.description && (
                            <span className={`${styles.taskDescription} ${styles.t6}`}>{nextTask.description}</span>
                        )}

                        <div className={styles.timer}>
                            <span className={`${styles.timerValue} ${styles.t3}`}>{countdown}</span>
                            <span className={`${styles.timerLabel} ${styles.t7}`}>
                                {t('until', {time: formatTaskTimeLabel(nextTaskTime)})}
                            </span>
                        </div>
                    </>
                )}
            </div>

            <div className={styles.taskList}>
                <span className={`${styles.sectionLabel} ${styles.t6}`}>{t('today')}</span>

                {!isLoading && !error && todayTasks.length === 0 && (
                    <span className={`${styles.emptyMessage} ${styles.t6}`}>{t('noTasksToday')}</span>
                )}

                {todayTasks.map((task) => (
                    <TaskCard key={task._id} task={task}/>
                ))}
            </div>
        </div>
    );
};

export default CommonTasksWidget;
