"use client";

import styles from "./TaskCard.module.scss";

const DEFAULT_TASK_COLOR = '#FF5D66';

const TaskCard = ({task}) => {
    const taskColor = task.color || DEFAULT_TASK_COLOR;

    return (
        <article className={styles.taskCard} style={{"--task-color": taskColor}}>
            <div className={styles.timeBadge}>
                <span className={`${styles.timeLabel} ${styles.t7}`}>Start</span>
                <span className={`${styles.timeValue} ${styles.t6}`}>{task.start || '--:--'}</span>
            </div>

            <div className={styles.taskContent}>
                <span className={`${styles.taskName} ${styles.t6}`}>{task.title}</span>
                <span className={`${styles.taskDescription} ${styles.t7}`}>
                    {task.description || 'No description'}
                </span>
            </div>

            <span className={styles.colorDot} aria-hidden="true"/>
        </article>
    );
};

export default TaskCard;
