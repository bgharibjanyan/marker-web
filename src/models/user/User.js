export default class User {
    constructor({firstname, login, email, password, age, sex, lastname = null, address = null, connections = []}) {
        this.firstname = firstname;
        this.login = login;
        this.password = password;
        this.age = age;
        this.sex = sex;
        this.email = email;
        this.lastname = lastname;
        this.address = address;
        this.connections = connections;
        this.createdAt = new Date();
    }
}
