'use client';

import styles from "./CreateEvent.module.scss";
import TextInput from "@/app/components/util/form/TextInput/TextInput";
import TimeInput from "@/app/components/util/form/TimeInput/TimeInput";
import {useState} from "react";
import TaskModel from "@/models/event/TaskModel";
import Switch from "@/app/components/util/form/switch/Switch";
import Radio from "@/app/components/util/form/Radio/Radio";
import WeekdaySelector from "@/app/components/util/form/WeekdaySelector/WeekdaySelector";
import DatePicker from "@/app/components/util/form/DatePicker/DatePicker";
import Button from "@/app/components/util/buttons/MarkerButton/Button";
import {usePopup} from "@/app/components/overlays/popup/PopupProvider/PopupProvider";

export default function CreateEvent(eventState) {
    const {closePopup} = usePopup();

    const getTodaySelection = () => {
        const now = new Date();

        return {
            monthday: now.getDate(),
            date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        };
    };

    const getInitialEventState = () => {
        const todaySelection = getTodaySelection();

        return {
            title: '',
            description: '',
            tags: [],
            isPrivate: true,
            start: null,
            end: null,
            repeat: false,
            repeatType: null,
            weekdays: [],
            monthday: todaySelection.monthday,
            date: todaySelection.date,
            media: null,
        };
    };

    const [formData, setFormData] = useState(() => {
        return new TaskModel({
            ...getInitialEventState(),
            ...eventState,
        });
    }, {})
    const [formKey, setFormKey] = useState(0);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (name, value) => {
        const shouldRestoreDate = (name === 'repeat' && !value) || (name === 'repeatType' && value !== 'weekly');
        const todaySelection = shouldRestoreDate && (!formData.date || !formData.monthday) ? getTodaySelection() : {};
        const isCalendarDisabledRepeat = name === 'repeatType' && (value === 'daily' || value === 'weekly');

        if (formError) {
            setFormError('');
        }

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
            ...(name === 'repeat' && !value ? {repeatType: null, weekdays: []} : {}),
            ...(isCalendarDisabledRepeat ? {monthday: null, date: null} : {}),
            ...(name === 'repeatType' && value !== 'weekly' ? {weekdays: []} : {}),
            ...todaySelection,
        }));
    };

    const validateForm = () => {
        const isDailyRepeat = formData.repeat && formData.repeatType === 'daily';
        const isWeeklyRepeat = formData.repeat && formData.repeatType === 'weekly';
        const isCalendarDisabledRepeat = isDailyRepeat || isWeeklyRepeat;

        if (!formData.title?.trim()) {
            return 'Event name is required.';
        }

        if (!formData.start) {
            return 'Start time is required.';
        }

        if (!isCalendarDisabledRepeat && (!formData.date || !formData.monthday)) {
            return 'Day is required.';
        }

        if (formData.repeat && !formData.repeatType) {
            return 'Repeat type is required.';
        }

        if (isWeeklyRepeat && (!Array.isArray(formData.weekdays) || formData.weekdays.length === 0)) {
            return 'Select at least one weekday.';
        }

        if (formData.repeat && formData.repeatType === 'monthly' && !formData.monthday) {
            return 'Select a day for monthly repeat.';
        }

        return '';
    };

    const handleSubmit = async () => {
        const error = validateForm();

        if (error) {
            setFormError(error);
            return;
        }

        setFormError('');
        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('marker_im_token');
            const response = await fetch('/api/task/add-task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? {Authorization: token} : {}),
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                setFormError(data.error || 'Failed to create task.');
                return;
            }

            const nextState = new TaskModel(getInitialEventState());
            setFormData(nextState);
            setFormKey((key) => key + 1);
            closePopup();
        } catch (error) {
            setFormError('Failed to create task.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setFormData(new TaskModel(getInitialEventState()));
        setFormError('');
        setFormKey((key) => key + 1);

        if (typeof eventState?.onCancel === 'function') {
            eventState.onCancel();
        }

        closePopup();
    };

    return (
        <div className={styles.contentContainer}>
            <h5 className={`${styles.title} ${styles.t3}`}>Add Task</h5>
            <span className={`${styles.description} ${styles.t6}`}>
                fill form to add new task to your schedule.
            </span>

            <div key={formKey} className={styles.formContainer}>
                <div className={`${styles.input} ${styles.eventName}`}>
                    <TextInput
                        name={'title'}
                        casual={true}
                        shadowColor="#9E373E"
                        placeholder={"Eg. pool party"}
                        label={"Event Name"}
                        value={formData.title}
                        onChange={handleChange}
                    />
                </div>

                <div className={`${styles.input} ${styles.privacy}`}>
                    <Switch
                        name="isPrivate"
                        label="Private"
                        checked={formData.isPrivate}
                        onChange={handleChange}
                        casual
                        shadowColor="#9E373E"
                        activeColor="#9E373E"
                        inactiveColor="#ddd"
                    />
                </div>

                <div className={`${styles.input} ${styles.eventDescription}`}>
                    <TextInput
                        name={'description'}
                        casual={true}
                        shadowColor="#9E373E"
                        placeholder={"Eg. something about event "}
                        label={"Description"}
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.repeatCard}>
                    <div className={styles.repeatHeader}>
                        <Switch
                            name="repeat"
                            label="Repeat"
                            checked={formData.repeat}
                            onChange={handleChange}
                            casual
                            shadowColor="#9E373E"
                            activeColor="#9E373E"
                            inactiveColor="#ddd"
                        />
                    </div>

                    <div className={styles.repeatOptions}>
                        <Radio
                            name={'repeatType'}
                            label={'Daily'}
                            value={'daily'}
                            checked={formData.repeatType === 'daily'}
                            onChange={handleChange}
                            disabled={!formData.repeat}
                        />
                        <Radio
                            name={'repeatType'}
                            label={'Weekly'}
                            value={'weekly'}
                            checked={formData.repeatType === 'weekly'}
                            onChange={handleChange}
                            disabled={!formData.repeat}
                        />
                        <Radio
                            name={'repeatType'}
                            label={'Monthly'}
                            value={'monthly'}
                            checked={formData.repeatType === 'monthly'}
                            onChange={handleChange}
                            disabled={!formData.repeat}
                        />
                    </div>

                    {formData.repeat && formData.repeatType === 'weekly' && (
                        <div className={styles.weekdayPickerContainer}>
                            <WeekdaySelector
                                value={formData.weekdays}
                                onChange={handleChange}
                            />
                        </div>
                    )}

                </div>

                <div className={styles.scheduleCard}>
                    <div className={`${styles.input} ${styles.scheduleTime}`}>
                        <div className={styles.timeGroup}>
                            <TimeInput
                                name={'start'}
                                casual={true}
                                shadowColor="#9E373E"
                                placeholder={"HH:MM"}
                                label={"Start Time"}
                                value={formData.start || ""}
                                onChange={handleChange}
                            />
                            <TimeInput
                                name={'end'}
                                casual={true}
                                shadowColor="#9E373E"
                                placeholder={"HH:MM"}
                                label={"End Time"}
                                value={formData.end || ""}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className={styles.calendarContainer}>
                        <DatePicker
                            value={formData.monthday}
                            onChange={handleChange}
                            disabled={formData.repeat && (formData.repeatType === 'daily' || formData.repeatType === 'weekly')}
                        />
                    </div>
                </div>

                <div className={`${styles.actionBar}`}>
                    <div className={styles.actions}>
                        <Button
                            text="Cancel"
                            bgColor="#fff"
                            textColor="#000"
                            width="auto"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            casual={true}
                            shadowColor="#9E373E"
                            padding="10px 24px"
                        />
                        <Button
                            type="primary"
                            text={isSubmitting ? 'Saving...' : 'Submit'}
                            bgColor="#FF5D66"
                            textColor="white"
                            width="auto"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            casual={true}
                            shadowColor="#9E373E"
                            padding="10px 24px"
                        />
                    </div>

                    {formError && (
                        <span className={`${styles.formError} ${styles.t6}`}>{formError}</span>
                    )}
                </div>
            </div>
        </div>
    );
};
