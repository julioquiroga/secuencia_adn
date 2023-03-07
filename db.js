const mariadb = require('mariadb');

const pool_dev = mariadb.createPool({
    host: 'adn-db', 
    port: '3306',
    user:'appADN', 
    password: 'mutations',
    database: 'appADN',
    connectionLimit: 10
});

module.exports = pool_dev;