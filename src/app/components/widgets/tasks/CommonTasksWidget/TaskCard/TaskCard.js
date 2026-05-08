"use client";

import styles from "./TaskCard.module.scss";
import {useEffect, useRef, useState} from "react";
import {useTranslations} from "next-intl";

const DEFAULT_TASK_COLOR = '#FF5D66';

const TaskCard = ({task, onEdit, onDelete}) => {
    const t = useTranslations('TaskCard');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const taskColor = task.color || DEFAULT_TASK_COLOR;

    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const handleMenuAction = (action) => {
        setIsMenuOpen(false);

        if (action === 'edit' && onEdit) onEdit(task);
        if (action === 'delete' && onDelete) onDelete(task);
    };

    return (
        <article
            className={`${styles.taskCard} ${isMenuOpen ? styles.menuOpen : ''}`}
            style={{"--task-color": taskColor}}
        >
            <div className={styles.cardHeader}>
                <div className={styles.menuWrapper} ref={menuRef}>
                    <button
                        type="button"
                        className={styles.moreButton}
                        aria-label={t('actions.more')}
                        aria-expanded={isMenuOpen}
                        onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
                    >
                        <span/>
                        <span/>
                        <span/>
                    </button>

                    {isMenuOpen && (
                        <div className={styles.contextMenu}>
                            <button type="button" onClick={() => handleMenuAction('edit')}>
                                {t('actions.edit')}
                            </button>
                            <button type="button" onClick={() => handleMenuAction('delete')}>
                                {t('actions.delete')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.cardBody}>
                <div className={styles.timeBadge}>
                    <span className={`${styles.timeLabel} ${styles.t7}`}>{t('start')}</span>
                    <span className={`${styles.timeValue} ${styles.t6}`}>{task.start || '--:--'}</span>
                </div>

                <div className={styles.taskContent}>
                    <span className={`${styles.taskName} ${styles.t6}`}>{task.title}</span>
                    <span className={`${styles.taskDescription} ${styles.t7}`}>
                        {task.description || t('noDescription')}
                    </span>
                </div>
            </div>
        </article>
    );
};

export default TaskCard;
