export default class TaskModel {
    constructor({
                    title,
                    description,
                    start,
                    end,
                    location,
                    tags,
                    repeat,
                    perWeak,
                    perMonth,
                    isPrivate,
                    media,
                    userId,
                    date
                }) {
        this.title = title ? title: null;
        this.description = description ? description : null;
        this.start = start ? start : null;
        this.end = end ? end : null;
        this.location = location ? location : null;
        this.tags = tags ? tags : null;
        this.repeat = repeat ? repeat : null;
        this.perWeak = perWeak ? perWeak : null;
        this.perMonth = perMonth ? perMonth : null;
        this.date = date ? date : null;
        this.isPrivate = isPrivate ? isPrivate : false;
        this.media = media ? media : [];
        this.userId = userId;
    }

    setUser(id) {
        this.userId = id;
    }
}
