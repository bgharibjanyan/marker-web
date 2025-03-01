'use client';

const TextInput = ({ type, name, placeholder, value, onChange }) => {
    return (
        <div className={"inputContainer"}>
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="input"
            />
            <div className={"inputBackground"}></div>
        </div>

    );
};
export default TextInput;