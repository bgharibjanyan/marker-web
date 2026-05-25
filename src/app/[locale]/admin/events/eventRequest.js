export const createEventFormData = (payload, mediaFiles = [], id = "") => {
    const formData = new FormData();

    formData.append("event", JSON.stringify(id ? {...payload, id} : payload));
    mediaFiles.forEach((file) => formData.append("media", file));

    return formData;
};
