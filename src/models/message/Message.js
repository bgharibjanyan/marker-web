export default class Message {
    constructor({sender, reciver, content}) {
        this.sender = sender;
        this.reciver = reciver;
        this.content = {
            type: content?.type || "text",
            value: content?.value || "",
        };
        this.time = new Date();
    }
}
