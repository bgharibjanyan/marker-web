export const MAP_LINK_ERROR = "Location must be a Google Maps or Yandex Maps link.";

export const isSupportedMapLink = (value) => {
    const link = String(value || "").trim();

    if (!link) {
        return true;
    }

    try {
        const url = new URL(link);
        const host = url.hostname.toLowerCase().replace(/^www\./, "");
        const pathname = url.pathname.toLowerCase();
        const isHttpLink = url.protocol === "http:" || url.protocol === "https:";

        if (!isHttpLink) {
            return false;
        }

        const isGoogleHost = /(^|\.)google\./.test(host) || host === "maps.app.goo.gl" || host === "goo.gl";
        const isGoogleMapsLink = isGoogleHost && (
            host.startsWith("maps.")
            || host === "maps.app.goo.gl"
            || pathname.startsWith("/maps")
            || (host === "goo.gl" && pathname.startsWith("/maps"))
        );
        const isYandexHost = /(^|\.)yandex\./.test(host);
        const isYandexMapsLink = isYandexHost && (
            host.startsWith("maps.")
            || pathname.startsWith("/maps")
        );

        return isGoogleMapsLink || isYandexMapsLink;
    } catch (error) {
        return false;
    }
};
