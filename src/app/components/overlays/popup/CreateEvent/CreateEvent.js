'use client';

import styles from "./CreateEvent.module.scss";

export default ({
                    slides = [],
                }) => {




    return (
        <div className={styles.contentContainer}>

            <h5 className={styles.title}>Add Task</h5>
            <span className={styles.description}>
                fill form to add new task to your schedule.
            </span>

            <div className={styles.formContainer}></div>

        </div>
    );
};

