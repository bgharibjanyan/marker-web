export default class User {
    constructor({ firstname, login, password, age, sex, lastname = null, address = null, phone = null }) {
        this.firstname = firstname;
        this.login = login;
        this.password = password;
        this.age = age;
        this.sex = sex;
        this.lastname = lastname;
        this.address = address;
        this.phone = phone;
        this.createdAt = new Date();
    }
}
