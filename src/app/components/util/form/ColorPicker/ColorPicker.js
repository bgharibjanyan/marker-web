"use client";

import styles from "./ColorPicker.module.scss";
import {useTranslations} from "next-intl";
import {ColorSelector} from "@/app/scripts/HelperFunctions/colorSelector";

const DEFAULT_COLORS = [
    ColorSelector("--g-color13"),
    ColorSelector("--g-color8"),
    ColorSelector("--g-color4"),
    ColorSelector("--g-color14"),
    ColorSelector("--g-color15"),
    ColorSelector("--g-color16"),
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
    const t = useTranslations('Form.colorPicker');
    const selectedColor = value || colors[0];

    const handleChange = (color) => {
        onChange(name, color);
    };

    return (
        <div className={styles.colorField}>
            {label && <span className={`${styles.t5} ${styles.fieldLabel}`}>{label}</span>}
            <div
                className={`${styles.colorContainer} ${casual ? styles.casual : ''}`}
                style={{"--shadow-color": shadowColor || ColorSelector("--g-color8")}}
            >
                <div className={styles.swatches}>
                    {colors.map((color) => (
                        <button
                            key={color}
                            type="button"
                            className={`${styles.swatch} ${selectedColor === color ? styles.selected : ''}`}
                            style={{"--task-color": color}}
                            aria-label={t('selectColor', {color})}
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
