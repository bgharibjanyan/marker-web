export const ColorSelector = (variable) => {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
};

