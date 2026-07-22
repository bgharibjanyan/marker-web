export default class User {
    constructor({
        firstname,
        login,
        email,
        password,
        age,
        sex,
        lastname = null,
        address = null,
        country = null,
        city = null,
        connections = [],
        profilePicture = null,
        role = "user",
        status = "Active",
    }) {
        this.firstname = firstname;
        this.login = login;
        this.password = password;
        this.age = age;
        this.sex = sex;
        this.email = email;
        this.lastname = lastname;
        this.address = address;
        this.country = country;
        this.city = city;
        this.connections = connections;
        this.profilePicture = profilePicture;
        this.role = role;
        this.status = status;
        this.publicProfile = true;
        this.notifications = true;
        this.allowMessages = true;
        this.createdAt = new Date();
    }
}
