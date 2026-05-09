const COLOR_FALLBACKS = {
    "--g-color1": "#fff",
    "--g-color2": "#000",
    "--g-color3": "#616161",
    "--g-color4": "#454ADE",
    "--g-color5": "#FF5964",
    "--g-color6": "#e04848",
    "--g-color7": "#B3B3B3",
    "--g-color8": "#9E373E",
    "--g-color9": "#f5babf",
    "--g-color10": "#acacac",
    "--g-color11": "#129a00",
    "--g-color12": "#fff500",
    "--g-color13": "#FF5D66",
    "--g-color14": "#2F9E44",
    "--g-color15": "#F59F00",
    "--g-color16": "#15AABF",
    "--g-color17": "#231F20",
    "--g-color18": "#ddd",
    "--g-color19": "#ccc",
};

export const ColorSelector = (variable) => {
    if (typeof window === "undefined" || !document?.documentElement) {
        return COLOR_FALLBACKS[variable] || "";
    }

    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
        || COLOR_FALLBACKS[variable]
        || "";
};
