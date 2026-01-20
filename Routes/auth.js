const express = require("express");
const route = express.Router();
const exe = require("./../connection");

const isAuth = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

route.get("/login", (req, res) => {
    const redirect = req.query.redirect || "";
    
    // LOGIC: If the user was trying to go to /admin, then this is an Admin Login.
    // We pass 'isAdminLogin: true' to the EJS file.
    const isAdminLogin = redirect.includes('/admin');

    res.render("user/auth_login", { 
        error: req.query.error || "",
        redirect: redirect,
        isAdminLogin: isAdminLogin // <-- Pass this to the view
    });
});

route.get("/register", (req, res) => {
    res.render("user/auth_register");
});

route.post("/login", async (req, res) => {
    const { email, password, redirect } = req.body; // Capture redirect from hidden input
    
    const user = await exe("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
    
    if (user.length > 0) {
        req.session.user = user[0];
        
        if (redirect) {
            res.redirect(redirect);
        } else {
            if (user[0].role === 'admin') {
                res.redirect("/admin");
            } else {
                res.redirect("/");
            }
        }
    } else {
        // Preserve redirect on error
        res.redirect("/login?error=Invalid Credentials" + (redirect ? "&redirect="+redirect : ""));
    }
});

route.post("/register", async (req, res) => {
    const { name, email, password, phone } = req.body;
    try {
        // Force role to 'user'
        await exe("INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, 'user')", [name, email, password, phone]);
        res.redirect("/login");
    } catch (error) {
        res.send("Email already exists or error: " + error.message);
    }
});

route.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

module.exports = { route, isAuth };