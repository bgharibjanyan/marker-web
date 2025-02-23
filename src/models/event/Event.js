export default class Session {
    constructor({title, description, stat, end = null, location = null, tags = [], status = null}) {
        this.title = title;
        this.description = description;
        this.stat = stat;
        this.end = end;
        this.location = location;
        this.tags = tags;
        this.status = status;
    }
}
