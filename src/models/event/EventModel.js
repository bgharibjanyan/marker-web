export default class EventModel {
    constructor({
                    title='',
                    description,
                    start,
                    end,
                    location,
                    tags,
                    repeat,
                    repeatType,
                    weekdays,
                    monthday,
                    color,
                    date,
                    isPrivate,
                    media,
                    subscribers,
                    userId
                }) {
        this.title = title;
        this.description = description ? description : null;
        this.start = start ? start : null;
        this.end = end ? end : null;
        this.location = location ? location : null;
        this.tags = Array.isArray(tags) ? tags : [];
        this.repeat = repeat ? repeat : false;
        this.repeatType = repeatType ? repeatType : null;
        this.weekdays = Array.isArray(weekdays) ? weekdays : [];
        this.monthday = monthday ? monthday : null;
        this.color = color ? color : null;
        this.date = date ? date : null;
        this.isPrivate = isPrivate ? isPrivate : false;
        this.media = Array.isArray(media) ? media : [];
        this.subscribers = Array.isArray(subscribers) ? subscribers : [];
        this.userId = userId;
    }

    setUser(id) {
        this.userId = id;
    }
}
