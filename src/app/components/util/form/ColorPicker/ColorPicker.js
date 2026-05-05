"use client";

import styles from "./ColorPicker.module.scss";

const DEFAULT_COLORS = [
    '#FF5D66',
    '#9E373E',
    '#454ADE',
    '#2F9E44',
    '#F59F00',
    '#15AABF',
];

const ColorPicker = ({
                         name,
                         value,
                         onChange,
                         label,
                         colors = DEFAULT_COLORS,
                         shadowColor,
                         casual = false,
                     }) => {
    const selectedColor = value || colors[0];

    const handleChange = (color) => {
        onChange(name, color);
    };

    return (
        <div className={styles.colorField}>
            {label && <span className={`${styles.t5} ${styles.fieldLabel}`}>{label}</span>}
            <div
                className={`${styles.colorContainer} ${casual ? styles.casual : ''}`}
                style={{"--shadow-color": shadowColor || "#9E373E"}}
            >
                <div className={styles.swatches}>
                    {colors.map((color) => (
                        <button
                            key={color}
                            type="button"
                            className={`${styles.swatch} ${selectedColor === color ? styles.selected : ''}`}
                            style={{"--task-color": color}}
                            aria-label={`Select ${color}`}
                            onClick={() => handleChange(color)}
                        />
                    ))}
                </div>

                <label className={styles.customColor}>
                    <span className={styles.colorPreview} style={{"--task-color": selectedColor}}/>
                    <input
                        type="color"
                        name={name}
                        value={selectedColor}
                        onChange={(event) => handleChange(event.target.value)}
                    />
                </label>
            </div>
        </div>
    );
};

export default ColorPicker;
