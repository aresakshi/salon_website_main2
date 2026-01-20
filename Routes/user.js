
const express = require("express");
const route = express.Router();
const { isAuth } = require('./auth'); 
const exe = require("./../connection");

const getSettings = async () => {
    try {
        const rows = await exe("SELECT * FROM site_settings");
        const obj = {};
        rows.forEach(r => obj[r.setting_key] = r.setting_value);
        return obj;
    } catch (error) {
        return {};
    }
};

const getContent = async () => {
    try {
        const rows = await exe("SELECT * FROM site_content");
        const obj = {};
        rows.forEach(r => obj[r.section_name] = r.content);
        return obj;
    } catch (error) {
        return {};
    }
};

route.get("/", async function(req, res) {
    try {
        const sliders = await exe("SELECT * FROM sliders WHERE status='active'");
        const facilities = await exe("SELECT * FROM facilities WHERE status='active' LIMIT 3");
        const team = await exe("SELECT * FROM team WHERE status='active'");
        const testimonials = await exe("SELECT * FROM testimonials");
        const faqs = await exe("SELECT * FROM faqs WHERE status='active' ORDER BY display_order ASC");
        const content = await getContent();
        const settings = await getSettings();

        res.render("user/index", { 
            sliders, facilities, team, testimonials, faqs, content, settings, user: req.session.user 
        }); 
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading home page");
    }
});

// 2. About Page
route.get("/about", async function(req, res) {
    try {
        const content = await getContent();
        const settings = await getSettings();
        res.render("user/about", { content, settings, user: req.session.user }); 
    } catch (error) {
        res.status(500).send("Error loading about page");
    }
});

// 3. Facilities Page
route.get("/Facilities", async function(req, res) {
    try {
        // Matches your 'facilities' table structure
        const data = await exe("SELECT * FROM facilities WHERE status='active' ORDER BY id DESC");
        const settings = await getSettings();
        res.render("user/Facilities", { facilities: data, settings, user: req.session.user });
    } catch (error) {
        res.status(500).send("Error loading facilities");
    }
});

// 4. Services Page
route.get("/services", async function(req, res) {
    try {
        const data = await exe("SELECT * FROM facilities WHERE status='active' ORDER BY id DESC");
        const settings = await getSettings();
        res.render("user/services", { facilities: data, settings, user: req.session.user });
    } catch (error) {
        res.status(500).send("Error loading services");
    }
});

// 5. Gallery Page
route.get("/gallery", async function(req, res) {
    try {
        const data = await exe("SELECT * FROM gallery WHERE status='active' ORDER BY id DESC");
        const settings = await getSettings();
        res.render("user/gallery", { gallery: data, settings, user: req.session.user });
    } catch (error) {
        res.status(500).send("Error loading gallery");
    }
});

route.get("/contact", async function(req, res) {
    try {
        const settings = await getSettings();
        const facilities = await exe("SELECT * FROM facilities WHERE status='active'");
        res.render("user/contact", { settings, user: req.session.user, facilities: facilities }); 
    } catch (error) {
        res.status(500).send("Error loading contact page");
    }
});

route.post("/save_contact_form", async function(req, res) {
    try {
        var d = req.body;
        await exe(`INSERT INTO client_detail_contact_form(client_name,client_email,client_phone,client_message) VALUES (?,?,?,?)`, 
        [d.client_name, d.client_email, d.client_phone, d.client_message]);
        res.redirect("/contact?msg=success");
    } catch (error) {
        console.error(error);
        res.redirect("/contact?msg=error");
    }
});

route.post("/book_appointment", isAuth, async function(req, res) {
    try {
        var d = req.body;
        const userId = req.session.user.id;
        
        await exe(`INSERT INTO appointments(client_name, client_phone, service_name, appointment_date, user_id, status) VALUES (?,?,?,?,?,?)`, 
        [d.client_name, d.client_phone, d.service_name, d.appointment_date, userId, 'Pending']);
        
        const service = await exe("SELECT * FROM facilities WHERE title = ?", [d.service_name]);
        
        res.render("user/booking_success", { 
            appointment: d, 
            serviceDetails: service[0] || {},
            date: d.appointment_date 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error booking appointment");
    }
});

module.exports = route;