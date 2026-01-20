const mysql = require("mysql2");
const util = require("util");

const conn = mysql.createConnection({
    host: "bo9qrikke7ytr5ldivm7-mysql.services.clever-cloud.com",
    user: "uynxmdpscrcnfhhg",
    password: "HRL5u1VVfHf8pB3KUzuy", 
    database: "bo9qrikke7ytr5ldivm7"
});

const exe = util.promisify(conn.query).bind(conn);
module.exports = exe;
