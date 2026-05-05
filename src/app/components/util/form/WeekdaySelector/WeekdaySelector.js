"use client";

import styles from "./WeekdaySelector.module.scss";
import {useTranslations} from "next-intl";

const WeekdaySelector = ({ value = [], onChange }) => {
    const t = useTranslations('Form.weekdaySelector');
    const weekdays = [
        { label: t('days.monday'), value: 'monday' },
        { label: t('days.tuesday'), value: 'tuesday' },
        { label: t('days.wednesday'), value: 'wednesday' },
        { label: t('days.thursday'), value: 'thursday' },
        { label: t('days.friday'), value: 'friday' },
        { label: t('days.saturday'), value: 'saturday' },
        { label: t('days.sunday'), value: 'sunday' },
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
            <span className={`${styles.label} ${styles.t5}`}>{t('label')}</span>
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
