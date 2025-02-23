'use client';

import {useEffect, useState} from 'react';
import TextInput from "@/app/components/form/TextInput/TextInput";
import './form.scss';
import Button from "@/app/components/button/Button";

const Form = ({inputs, onSubmit}) => {
    const [formData, setFormData] = useState(
        inputs.reduce((acc, input) => {
            acc[input.name] = input.value || '';
            return acc;
        }, {})
    );

    useEffect(() => {
        inputs.forEach(input => {
            input.value = formData[input.name];
        });
    }, [formData, inputs]);

    const handleChange = (e) => {
        setFormData((prevData) => {
            return {...prevData, [e.target.name]: e.target.value};
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form className="form-container">
            {inputs.map((input, index) => (
                <TextInput
                    key={index}
                    type={input.type}
                    name={input.name}
                    placeholder={input.placeholder}
                    value={formData[input.name]}
                    onChange={handleChange}
                />
            ))}

            <div className="submitContainer">
                <Button
                    type="primary"
                    text="Sign in"
                    bgColor="#FF5D66"
                    textColor="white"
                    width="95%"
                    onClick={handleSubmit}
                />
            </div>
        </form>
    );
};

export default Form;