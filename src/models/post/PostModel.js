export default class PostModel {
    constructor({
                    task,
                    title,
                    description,
                    media,
                    userId,
                    createdAt,
                    updatedAt,
                }) {
        this.task = task;
        this.title = title ? String(title).trim() : null;
        this.description = description ? String(description).trim() : "";
        this.media = Array.isArray(media) ? media : [];
        this.userId = userId;
        this.createdAt = createdAt || new Date();
        this.updatedAt = updatedAt || new Date();
    }

    setUser(id) {
        this.userId = id;
    }

    setTask(id) {
        this.task = id;
    }
}
