export default class Tag {
    constructor({name, usage = 0}) {
        this.name = name;
        this.usage = usage;
        this.createdAt = new Date();
    }
}
