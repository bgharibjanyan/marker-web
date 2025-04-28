export default class EventData {
    constructor({
                    title,
                    description,
                    start,
                    end,
                    location,
                    tags,
                    perWeak,
                    perMonth,
                    once,
                    isPrivate,
                    media,
                    userId
                }) {
        this.title = title;
        this.description = description ? description : null;
        this.start = start ? start : null;
        this.end = end ? end : null;
        this.location = location ? location : null;
        this.tags = tags ? tags : null;
        this.perWeak = perWeak ? perWeak : null;
        this.perMonth = perMonth ? perMonth : null;
        this.once = once ? once : null;
        this.isPrivate = isPrivate ? isPrivate : false;
        this.media = media ? media : [];
        this.userId = userId;
    }

    setUser(id) {
        this.userId = id;
    }
}
