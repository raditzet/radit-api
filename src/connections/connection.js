const mysql = require('mysql')

const conn = mysql.createConnection({
    user: 'devuser',
    password: 'Mysql123',
    host: '127.0.0.1',
    database:'cocoshop',
    port: '3306'
})

// const conn = mysql.createConnection({
//     user: 'devuser10',
//     password: 'Mysql123',
//     host: 'db4free.net',
//     database: 'jc8expmysql',
//     port: '3306'
// })


module.exports = conn
