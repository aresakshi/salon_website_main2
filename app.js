const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const path = require("path");

const user_route = require("./Routes/user");
const admin_route = require("./Routes/admin");
const auth_route = require("./Routes/auth");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: "123456789", 
    resave: true,
    saveUninitialized: true
}));

const fs = require('fs');
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
app.use("/", auth_route.route); 

app.use("/", user_route);
app.use("/admin", admin_route);
app.listen(1000)


