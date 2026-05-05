'use client';

import {useState, useRef, useEffect} from "react";
import styles from "./TimeInput.module.scss";

const TimeInput = ({
                       name,
                       placeholder,
                       value,
                       onChange,
                       shadowColor,
                       textColor,
                       label,
                       width,
                       casual = false,
                   }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState('');
    const [selectedMinute, setSelectedMinute] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Parse initial value
    useEffect(() => {
        if (value) {
            const [hour, minute] = value.split(':');
            setSelectedHour(hour || '');
            setSelectedMinute(minute || '');
        } else {
            setSelectedHour('');
            setSelectedMinute('');
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputClick = () => {
        setIsOpen(!isOpen);
    };

    const saveTime = (hour, minute) => {
        if (hour === '' || minute === '') return;

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onChange(name, timeString);
    };

    const handleHourSelect = (hour) => {
        const nextHour = hour.toString();

        setSelectedHour(nextHour);
        saveTime(nextHour, selectedMinute);
    };

    const handleMinuteSelect = (minute) => {
        const nextMinute = minute.toString();

        setSelectedMinute(nextMinute);
        saveTime(selectedHour, nextMinute);

        if (selectedHour !== '') {
            setIsOpen(false);
        }
    };

    const displayValue = selectedHour && selectedMinute
        ? `${selectedHour.padStart(2, '0')}:${selectedMinute.padStart(2, '0')}`
        : '';

    const hours = Array.from({length: 24}, (_, i) => i);
    const minutes = Array.from({length: 60}, (_, i) => i);

    return (
        <div className={styles.timeField} ref={containerRef}>
            {label && <span className={`${styles.t5} ${styles.fieldLabel}`}>{label}</span>}
            <div className={`${styles.timeContainer} ${casual ? styles.casual : ''} ${isOpen ? styles.open : ''}`}>
                <input
                    ref={inputRef}
                    type="text"
                    name={name}
                    placeholder={placeholder}
                    value={displayValue}
                    onClick={handleInputClick}
                    readOnly
                    className={styles.timeInput}
                    style={{
                        color: textColor,
                        width,
                        "--shadow-color": shadowColor || "#9E373E",
                    }}
                />
                <div className={styles.timeIcon}>
                    <svg className={styles.icon} viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                </div>

                {isOpen && (
                    <div className={styles.timePicker}>
                        <div className={styles.timePickerBody}>
                            <div className={styles.timeColumn}>
                                <div className={styles.columnLabel}>Hr</div>
                                <div className={styles.timeList}>
                                    {hours.map(hour => (
                                        <div
                                            key={hour}
                                            className={`${styles.timeOption} ${selectedHour === hour.toString() ? styles.selected : ''}`}
                                            onClick={() => handleHourSelect(hour)}
                                        >
                                            {hour.toString().padStart(2, '0')}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.timeColumn}>
                                <div className={styles.columnLabel}>Min</div>
                                <div className={styles.timeList}>
                                    {minutes.map(minute => (
                                        <div
                                            key={minute}
                                            className={`${styles.timeOption} ${selectedMinute === minute.toString() ? styles.selected : ''}`}
                                            onClick={() => handleMinuteSelect(minute)}
                                        >
                                            {minute.toString().padStart(2, '0')}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TimeInput;
