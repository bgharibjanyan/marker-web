'use client';

import styles from "./CreateEvent.module.scss";
import TextInput from "@/app/components/util/form/TextInput/TextInput";
import {useState} from "react";
import TaskModel from "@/models/event/TaskModel";
import Switch from "@/app/components/util/form/switch/Switch";
import Checkbox from "@/app/components/util/form/Checkbox/Checkbox";

export default function CreateEvent(eventState) {


    const [formData, setFormData] = useState(() => {

        if (!eventState) {
            eventState = {
                title: '',
                description: '',
                tags: [],
                isPrivate: true,
                start: null,
                end: null,
                perMonth: null,
                perWeak: null,
                media: null,
            }
        }
        return new TaskModel(eventState);
    }, {})

    const handleChange = (name, value) => {
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    return (
        <div className={styles.contentContainer}>
            <h5 className={`${styles.title} ${styles.t3}`}>Add Task</h5>
            <span className={`${styles.description} ${styles.t6}`}>
                fill form to add new task to your schedule.
            </span>

            <div className={styles.formContainer}>


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
                        name="privacy"
                        label="Public"
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
                        placeholder={"Eg. somethimg about event "}
                        label={"Description"}
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>


                <div className={styles.durationPanel}>
                    <div className={`${styles.input} ${styles.repeat}`}>
                        <Switch
                            name="repiet"
                            label="repiet"
                            checked={formData.repeat}
                            onChange={handleChange}
                            casual
                            shadowColor="#9E373E"
                            activeColor="#9E373E"
                            inactiveColor="#ddd"
                        />
                    </div>
                    <Checkbox
                        name={'daily'}
                        label={'Daily'}
                        value={false}
                        onChange={handleChange}
                    />
                    <Checkbox
                        name={'weekly'}
                        label={'Weekly'}
                        value={false}
                        onChange={handleChange}
                    />
                    <Checkbox
                        name={'monthly'}
                        label={'Monthly'}
                        value={false}
                        onChange={handleChange}
                    />
                </div>

                <div className={`${styles.actionBar}`}>
                </div>
            </div>
        </div>
    );
};

