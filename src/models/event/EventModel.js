export default class EventModel {
    constructor({
                    title='',
                    description,
                    start,
                    end,
                    location,
                    tags,
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
        this.isPrivate = isPrivate ? isPrivate : false;
        this.media = media ? media : [];
        this.userId = userId;
    }

    setUser(id) {
        this.userId = id;
    }
}
