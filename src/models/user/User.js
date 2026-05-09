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
                    profilePicture = null
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
        this.profilePicture = profilePicture; // Path to profile picture
        this.createdAt = new Date();
    }
}
