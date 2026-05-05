export default class TaskModel {
    constructor({
                    title,
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
        this.repeatType = repeatType ? repeatType : null;
        this.weekdays = weekdays ? weekdays : [];
        this.monthday = monthday ? monthday : null;
        this.color = color ? color : '#FF5D66';
        this.date = date ? date : null;
        this.isPrivate = isPrivate ? isPrivate : false;
        this.media = media ? media : [];
        this.userId = userId;
    }

    setUser(id) {
        this.userId = id;
    }
}
