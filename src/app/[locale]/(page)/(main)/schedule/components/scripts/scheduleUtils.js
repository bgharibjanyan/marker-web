export const WEEKDAYS = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];

export const formatDateKey = (date) => (
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
);

export const parseTaskTime = (timeValue) => {
    const match = String(timeValue || "").trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);

    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3]?.toLowerCase();

    if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) return null;

    if (period === "pm" && hours !== 12) hours += 12;
    if (period === "am" && hours === 12) hours = 0;

    if (hours > 23) return null;

    return (hours * 60) + minutes;
};

export const getStartMinutes = (task) => {
    const time = parseTaskTime(task.start);

    if (!time) return Number.MAX_SAFE_INTEGER;

    return time;
};

export const getTaskTimeRange = (task) => {
    const start = parseTaskTime(task.start);
    const end = parseTaskTime(task.end);

    if (start === null || end === null || end <= start) return null;

    return {start, end};
};

export const getTaskOwnerId = (task) => String(task?.userId || task?.user || task?.owner || "");

export const isTaskPrivateForViewer = (task, viewerUserId) => (
    Boolean(viewerUserId) && Boolean(task?.isPrivate) && getTaskOwnerId(task) !== String(viewerUserId)
);

export const getTaskDisplayTime = (task, anytimeLabel) => {
    if (!task?.start && !task?.end) return anytimeLabel;
    if (!task?.end) return task.start;
    if (!task?.start) return task.end;

    return `${task.start} - ${task.end}`;
};

export const isTaskForDate = (task, date) => {
    const weekday = WEEKDAYS[date.getDay()];

    if (task.repeat) {
        if (task.repeatType === "daily") return true;
        if (task.repeatType === "weekly") return Array.isArray(task.weekdays) && task.weekdays.includes(weekday);
        if (task.repeatType === "monthly") return Number(task.monthday) === date.getDate();
    }

    return task.date === formatDateKey(date);
};

export const getDateRange = (startDate, days) => {
    return Array.from({length: days}, (_, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);
        return date;
    });
};

export const getWeekStart = (date) => {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;

    weekStart.setDate(weekStart.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    return weekStart;
};

export const getMonthDays = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    return getDateRange(firstDay, daysInMonth);
};

export const getMonthStartOffset = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    return firstDay === 0 ? 6 : firstDay - 1;
};

export const getMonthCalendarDays = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - getMonthStartOffset(date));

    return getDateRange(startDate, 42).map((calendarDate) => ({
        date: calendarDate,
        isCurrentMonth: calendarDate.getMonth() === date.getMonth(),
    }));
};

export const getTasksForDate = (tasks, date) => (
    tasks
        .filter((task) => isTaskForDate(task, date))
        .sort((firstTask, secondTask) => getStartMinutes(firstTask) - getStartMinutes(secondTask))
);

export const getMergedTaskHours = (tasks) => {
    const ranges = tasks
        .map(getTaskTimeRange)
        .filter(Boolean)
        .sort((firstRange, secondRange) => firstRange.start - secondRange.start);

    if (!ranges.length) return 0;

    const mergedRanges = ranges.reduce((merged, range) => {
        const previousRange = merged[merged.length - 1];

        if (!previousRange || range.start > previousRange.end) {
            return [...merged, {...range}];
        }

        previousRange.end = Math.max(previousRange.end, range.end);
        return merged;
    }, []);

    const totalMinutes = mergedRanges.reduce((total, range) => total + (range.end - range.start), 0);

    return Math.round((totalMinutes / 60) * 10) / 10;
};
