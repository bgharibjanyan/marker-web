export default class User {
    constructor({firstname, login, email, password, age, sex, lastname = null, address = null}) {
        this.firstname = firstname;
        this.login = login;
        this.password = password;
        this.age = age;
        this.sex = sex;
        this.email = email;
        this.lastname = lastname;
        this.address = address;
        this.createdAt = new Date();
    }
}
