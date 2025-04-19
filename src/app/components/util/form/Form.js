"use client";

import styles from "./form.module.scss";
import {useState} from "react";
import TextInput from "@/app/components/util/form/TextInput/TextInput";
import Button from "@/app/components/util/buttons/MarkerButton/Button";
import Checkbox from "@/app/components/util/form/Checkbox/Checkbox";
import LinkButton from "@/app/components/util/form/LinkButton/LinkButton";
import SelectField from "@/app/components/util/form/Select/SelectField";

const Form = ({fields, onSubmit}) => {
    const [formData, setFormData] = useState(() =>
        fields.reduce((formData, input) => {

            if (input.value) {
                formData[input.name] = input.value || "";
            }

            return formData;
        }, {})
    );

    const handleChange = (name,value) => {
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form className={styles.formContainer}>
            {fields.map((field, index) => (
                <div
                    key={index}
                    className={`
                    ${styles.field} ${field.size === "full" ? styles.fullWidth : ""}
                    ${field.size === "half" ? styles.halfWidth : ""}
                    ${field.size === "third" ? styles.thirdWidth : ""}
                    ${field.align === "left" ? styles.alignLeft : ""}
                    ${field.name === "submit" ? styles.submitButton: ""}
                      `}
                >
                    {field.field === "text" && (
                        <TextInput
                            type={field.type}
                            name={field.name}
                            casual={true}
                            shadowColor="#9E373E"
                            placeholder={field.placeholder}
                            label={field.label}
                            value={formData[field.name] || ""}
                            onChange={handleChange}
                        />
                    )}

                    {field.field ==="select" &&
                        <SelectField
                            name={field.name}
                            casual={true}
                            options={field.options}
                            shadowColor="#9E373E"
                            label={field.label}
                            value={formData[field.name] || ""}
                            onChange={handleChange}
                        ></SelectField>
                    }

                    {field.field === "button" && (
                        <Button
                            type="primary"
                            text={field.label}
                            bgColor="#FF5D66"
                            textColor="white"
                            width="auto"
                            onClick={() => field.onClick(formData)}
                            casual={true}
                            shadowColor="#9E373E"
                        />
                    )}

                    {field.field === "checkbox" && (
                        <Checkbox
                            name={field.name}
                            label={field.label}
                            value={formData[field.name] || false}
                            onChange={handleChange}
                        />
                    )}

                    {field.field === "link" && (
                        <LinkButton
                            text={field.label}
                            url={field.url}
                            color={field.color}
                        />
                    )}
                </div>
            ))}
        </form>
    );
};

export default Form;
