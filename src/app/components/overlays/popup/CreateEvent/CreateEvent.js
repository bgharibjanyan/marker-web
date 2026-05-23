'use client';

import styles from "./CreateEvent.module.scss";
import TextInput from "@/app/components/util/form/TextInput/TextInput";
import TimeInput from "@/app/components/util/form/TimeInput/TimeInput";
import {useCallback, useEffect, useState} from "react";
import {useTranslations} from "next-intl";
import TaskModel from "@/models/event/TaskModel";
import Switch from "@/app/components/util/form/switch/Switch";
import Radio from "@/app/components/util/form/Radio/Radio";
import WeekdaySelector from "@/app/components/util/form/WeekdaySelector/WeekdaySelector";
import DatePicker from "@/app/components/util/form/DatePicker/DatePicker";
import ColorPicker from "@/app/components/util/form/ColorPicker/ColorPicker";
import TagSelect from "@/app/components/util/form/TagSelect/TagSelect";
import Button from "@/app/components/util/buttons/MarkerButton/Button";
import {usePopup} from "@/app/components/overlays/popup/PopupProvider/PopupProvider";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";

export default function CreateEvent({task = null, onSaved, onCancel, ...eventState} = {}) {
    const {closePopup} = usePopup();
    const t = useTranslations('CreateTask');
    const taskId = task?._id || eventState?._id;
    const isEditing = Boolean(taskId);

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
            color: ColorSelector("--g-color13"),
            media: null,
        };
    };

    const [formData, setFormData] = useState(() => {
        return new TaskModel({
            ...getInitialEventState(),
            ...eventState,
            ...(task || {}),
        });
    }, {})
    const [formKey, setFormKey] = useState(0);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [popularTags, setPopularTags] = useState([]);

    const loadPopularTags = useCallback(async () => {
        try {
            const response = await fetch('/api/tags?limit=24');
            const data = await response.json();

            if (response.ok) {
                setPopularTags(data.tags || []);
            }
        } catch (error) {
            setPopularTags([]);
        }
    }, []);

    useEffect(() => {
        loadPopularTags();
    }, [loadPopularTags]);

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
            return t('validation.titleRequired');
        }

        if (!formData.start) {
            return t('validation.startRequired');
        }

        if (!isCalendarDisabledRepeat && (!formData.date || !formData.monthday)) {
            return t('validation.dayRequired');
        }

        if (formData.repeat && !formData.repeatType) {
            return t('validation.repeatTypeRequired');
        }

        if (isWeeklyRepeat && (!Array.isArray(formData.weekdays) || formData.weekdays.length === 0)) {
            return t('validation.weekdayRequired');
        }

        if (formData.repeat && formData.repeatType === 'monthly' && !formData.monthday) {
            return t('validation.monthdayRequired');
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
            const response = await fetch(isEditing ? '/api/task/update-task' : '/api/task/add-task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? {Authorization: token} : {}),
                },
                body: JSON.stringify({
                    ...formData,
                    ...(isEditing ? {taskId} : {}),
                }),
            });

            if (!response.ok) {
                setFormError(t(isEditing ? 'validation.updateFailed' : 'validation.createFailed'));
                return;
            }

            if (onSaved) {
                await onSaved();
            } else {
                window.dispatchEvent(new CustomEvent('marker:tasks-updated'));
            }

            if (!isEditing) {
                const nextState = new TaskModel(getInitialEventState());
                setFormData(nextState);
                setFormKey((key) => key + 1);
            }

            closePopup();
        } catch (error) {
            setFormError(t(isEditing ? 'validation.updateFailed' : 'validation.createFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setFormData(new TaskModel(getInitialEventState()));
        setFormError('');
        setFormKey((key) => key + 1);

        if (typeof onCancel === 'function') {
            onCancel();
        }

        closePopup();
    };

    return (
        <div className={styles.contentContainer}>
            <h5 className={`${styles.title} ${styles.t3}`}>{t(isEditing ? 'editTitle' : 'title')}</h5>
            <span className={`${styles.description} ${styles.t6}`}>
                {t(isEditing ? 'editDescription' : 'description')}
            </span>

            <div key={formKey} className={styles.formContainer}>
                <div className={`${styles.input} ${styles.eventName}`}>
                    <TextInput
                        name={'title'}
                        casual={true}
                        shadowColor={ColorSelector("--g-color8")}
                        placeholder={t('form.titlePlaceholder')}
                        label={t('form.titleLabel')}
                        value={formData.title}
                        onChange={handleChange}
                    />
                </div>

                <div className={`${styles.input} ${styles.privacy}`}>
                    <Switch
                        name="isPrivate"
                        label={t('form.privateLabel')}
                        checked={formData.isPrivate}
                        onChange={handleChange}
                        casual
                        shadowColor={ColorSelector("--g-color8")}
                        activeColor={ColorSelector("--g-color8")}
                        inactiveColor={ColorSelector("--g-color18")}
                    />
                </div>

                <div className={`${styles.input} ${styles.eventDescription}`}>
                    <TextInput
                        name={'description'}
                        casual={true}
                        shadowColor={ColorSelector("--g-color8")}
                        placeholder={t('form.descriptionPlaceholder')}
                        label={t('form.descriptionLabel')}
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.tagsCard}>
                    <TagSelect
                        label={t('form.tagsLabel')}
                        selectedTags={formData.tags || []}
                        popularTags={popularTags}
                        onChange={(tags) => handleChange('tags', tags)}
                        placeholder={t('form.tagsPlaceholder')}
                    />
                </div>

                <div className={`${styles.input} ${styles.eventColor}`}>
                    <ColorPicker
                        name={'color'}
                        casual={true}
                        shadowColor={ColorSelector("--g-color8")}
                        label={t('form.colorLabel')}
                        value={formData.color}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.repeatCard}>
                    <div className={styles.repeatHeader}>
                        <Switch
                            name="repeat"
                            label={t('form.repeatLabel')}
                            checked={formData.repeat}
                            onChange={handleChange}
                            casual
                            shadowColor={ColorSelector("--g-color8")}
                            activeColor={ColorSelector("--g-color8")}
                            inactiveColor={ColorSelector("--g-color18")}
                        />
                    </div>

                    <div className={styles.repeatOptions}>
                        <Radio
                            name={'repeatType'}
                            label={t('repeat.daily')}
                            value={'daily'}
                            checked={formData.repeatType === 'daily'}
                            onChange={handleChange}
                            disabled={!formData.repeat}
                        />
                        <Radio
                            name={'repeatType'}
                            label={t('repeat.weekly')}
                            value={'weekly'}
                            checked={formData.repeatType === 'weekly'}
                            onChange={handleChange}
                            disabled={!formData.repeat}
                        />
                        <Radio
                            name={'repeatType'}
                            label={t('repeat.monthly')}
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
                                shadowColor={ColorSelector("--g-color8")}
                                placeholder={t('form.timePlaceholder')}
                                label={t('form.startTimeLabel')}
                                value={formData.start || ""}
                                onChange={handleChange}
                            />
                            <TimeInput
                                name={'end'}
                                casual={true}
                                shadowColor={ColorSelector("--g-color8")}
                                placeholder={t('form.timePlaceholder')}
                                label={t('form.endTimeLabel')}
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
                            text={t('actions.cancel')}
                            bgColor={ColorSelector("--g-color1")}
                            textColor={ColorSelector("--g-color2")}
                            width="auto"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            casual={true}
                            shadowColor={ColorSelector("--g-color8")}
                            padding="10px 24px"
                        />
                        <Button
                            type="primary"
                            text={isSubmitting
                                ? t(isEditing ? 'actions.updating' : 'actions.saving')
                                : t(isEditing ? 'actions.update' : 'actions.submit')}
                            bgColor={ColorSelector("--g-color13")}
                            textColor={ColorSelector("--g-color1")}
                            width="auto"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            casual={true}
                            shadowColor={ColorSelector("--g-color8")}
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
