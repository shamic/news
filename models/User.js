const db = require('../db');

module.exports = db.defineModel('users', {
    email: {
        type: db.STRING(100),
        unique: true
    },
    password: db.STRING(200),
    name: {
        type: db.STRING(100),
        allowNull: true
    }
});
// create table users (
//      id varchar(50) not null,
//      email varchar(100) not null,
//      password varchar(200) not null,
//      name varchar(100),
//      createdAt bigint not null,
//      updatedAt bigint not null,
//      version bigint not null,
//      primary key (id)
//      ) engine=innodb;