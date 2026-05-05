"use client";

import styles from "./MonthdaySelector.module.scss";
import { useState, useMemo } from "react";

const MonthdaySelector = ({ value = null, onChange }) => {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth());
    const [year, setYear] = useState(now.getFullYear());

    const daysInMonth = useMemo(() => {
        return new Date(year, month + 1, 0).getDate();
    }, [month, year]);

    const firstDayOfMonth = useMemo(() => {
        return new Date(year, month, 1).getDay();
    }, [month, year]);

    const daysArray = useMemo(() => {
        const days = [];
        // Add empty cells for days before month starts (convert Sunday=0 to Monday=0)
        const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }
        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    }, [daysInMonth, firstDayOfMonth]);

    const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long' });

    const handlePrevMonth = () => {
        if (month === 0) {
            setMonth(11);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 11) {
            setMonth(0);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    return (
        <div className={styles.monthdaySelector}>
            <div className={styles.header}>
                <button
                    type="button"
                    className={styles.navButton}
                    onClick={handlePrevMonth}
                >
                    ←
                </button>
                <span className={`${styles.monthYear} ${styles.t5}`}>
                    {monthName} {year}
                </span>
                <button
                    type="button"
                    className={styles.navButton}
                    onClick={handleNextMonth}
                >
                    →
                </button>
            </div>

            <div className={styles.weekdays}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className={`${styles.weekday} ${styles.t7}`}>
                        {day}
                    </div>
                ))}
            </div>

            <div className={styles.calendar}>
                {daysArray.map((day, index) => (
                    <div
                        key={index}
                        className={`${styles.day} ${day ? styles.active : ''} ${value === day ? styles.selected : ''}`}
                        onClick={() => {
                            if (day) {
                                onChange('monthday', day);
                            }
                        }}
                    >
                        {day}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MonthdaySelector;
