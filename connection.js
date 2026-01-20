const mysql = require("mysql2");
const util = require("util");

const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root", 
    database: "salon_project_main2"
});

const exe = util.promisify(conn.query).bind(conn);
module.exports = exe;
