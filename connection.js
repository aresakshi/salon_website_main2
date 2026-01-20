const mysql = require("mysql2");
const util = require("util");

const conn = mysql.createConnection({
    host: "b6efrhaytyiqxnij2p8l-mysql.services.clever-cloud.com",
    user: "uhkomcjepmyui83f",
    password: "j968dA3kQm20kylTL4WW", 
    database: "b6efrhaytyiqxnij2p8l"
});

const exe = util.promisify(conn.query).bind(conn);
module.exports = exe;
