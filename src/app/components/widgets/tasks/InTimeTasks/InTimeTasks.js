"use client"
import styles from "./InTimeTask.module.scss";
import React from "react";

const InTimeTasksWidget = ({}) => {

    return (
        <div className={styles.inTimeTasks}>
            <div className={styles.recentlyTask}>
                <span className={styles.taskName}></span>
                <span className={styles.taskDescription}></span>

                <div className={styles.timer}>

                </div>
            </div>
        </div>
    );
};

export default InTimeTasksWidget;
