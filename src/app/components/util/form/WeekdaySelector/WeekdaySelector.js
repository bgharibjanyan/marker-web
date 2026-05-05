"use client";

import styles from "./WeekdaySelector.module.scss";

const WeekdaySelector = ({ value = [], onChange }) => {
    const weekdays = [
        { label: 'Mon', value: 'monday' },
        { label: 'Tue', value: 'tuesday' },
        { label: 'Wed', value: 'wednesday' },
        { label: 'Thu', value: 'thursday' },
        { label: 'Fri', value: 'friday' },
        { label: 'Sat', value: 'saturday' },
        { label: 'Sun', value: 'sunday' },
    ];

    const toggleWeekday = (dayValue) => {
        const newValue = Array.isArray(value) ? [...value] : [];
        if (newValue.includes(dayValue)) {
            newValue.splice(newValue.indexOf(dayValue), 1);
        } else {
            newValue.push(dayValue);
        }
        onChange('weekdays', newValue);
    };

    return (
        <div className={styles.weekdaySelector}>
            <span className={`${styles.label} ${styles.t5}`}>Select Days</span>
            <div className={styles.daysContainer}>
                {weekdays.map(day => (
                    <button
                        key={day.value}
                        type="button"
                        className={`${styles.dayButton} ${Array.isArray(value) && value.includes(day.value) ? styles.selected : ''}`}
                        onClick={() => toggleWeekday(day.value)}
                    >
                        {day.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default WeekdaySelector;
