const express = require("express");
const route = express.Router();
const exe = require("./../connection");
const fs = require('fs');
const path = require('path');

// --- SECURITY MIDDLEWARE ---
route.use((req, res, next) => {
    // 1. Check if user is logged in
    if (!req.session.user) {
        return res.redirect("/login?redirect=" + req.originalUrl);
    }
    
    // 2. Check if user is specifically an ADMIN
    if (req.session.user.role !== 'admin') {
        // If a normal user tries to access /admin, send them home
        return res.redirect("/?error=Unauthorized Access");
    }
    
    // 3. If both pass, proceed to dashboard
    next();
});
// -----------------------------

// 1. DASHBOARD
route.get("/", async (req, res) => {
    try {
        const clientsCount = await exe("SELECT COUNT(*) as total FROM users WHERE role='user'");
        const apptCount = await exe("SELECT COUNT(*) as total FROM appointments");
        const facCount = await exe("SELECT COUNT(*) as total FROM facilities");
        const galCount = await exe("SELECT COUNT(*) as total FROM gallery");
        const recent = await exe("SELECT * FROM appointments ORDER BY id DESC LIMIT 5");

        res.render("admin/index", {
            totalClients: clientsCount[0].total,
            totalAppointments: apptCount[0].total,
            totalFacilities: facCount[0].total,
            totalGallery: galCount[0].total,
            recentAppointments: recent,
            user: req.session.user
        });
    } catch (error) {
        console.error(error);
        res.send("Error loading dashboard");
    }
});

// 2. SLIDER MANAGEMENT
route.get("/manage_slider", async (req, res) => {
    try {
        const sliders = await exe("SELECT * FROM sliders ORDER BY id DESC");
        res.render("admin/manage_slider", { sliders, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.send("Error loading sliders");
    }
});

route.post("/save_slider", async (req, res) => {
    try {
        let imagePath = "/uploads/default-slider.jpg";
        if(req.files && req.files.image) {
            const image = req.files.image;
            const imageName = Date.now() + image.name;
            const uploadPath = path.join(__dirname, '../public/uploads/', imageName);
            image.mv(uploadPath);
            imagePath = "/uploads/" + imageName;
        }
        await exe("INSERT INTO sliders (title, subtitle, image_path, status) VALUES (?, ?, ?, 'active')", [req.body.title, req.body.subtitle, imagePath]);
        res.redirect("/admin/manage_slider");
    } catch (error) {
        res.send(error.message);
    }
});

route.get("/delete_slider/:id", async (req, res) => {
    try {
        await exe("DELETE FROM sliders WHERE id = ?", [req.params.id]);
        res.redirect("/admin/manage_slider");
    } catch (error) {
        console.error(error);
        res.redirect("/admin/manage_slider");
    }
});

// 3. CONTENT MANAGEMENT
route.get("/manage_content", async (req, res) => {
    try {
        const content = await exe("SELECT * FROM site_content");
        res.render("admin/manage_content", { content, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.send("Error loading content");
    }
});

route.post("/update_content", async (req, res) => {
    const { vision, mission, about_home } = req.body;
    try {
        const update = async (section, text) => {
            await exe("INSERT INTO site_content (section_name, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = ?", [section, text, text]);
        };
        await update('vision', vision);
        await update('mission', mission);
        await update('about_home', about_home);
        res.redirect("/admin/manage_content?msg=Content Updated");
    } catch (error) {
        console.log(error); 
        res.send(error.message);
    }
});

// 4. SETTINGS MANAGEMENT
route.get("/manage_settings", async (req, res) => {
    try {
        const settings = await exe("SELECT * FROM site_settings");
        const settingsObj = {};
        settings.forEach(s => settingsObj[s.setting_key] = s.setting_value);
        res.render("admin/manage_settings", { settings: settingsObj, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.send("Error loading settings");
    }
});

route.post("/update_settings", async (req, res) => {
    const data = req.body;
    try {
        for (const [key, value] of Object.entries(data)) {
            await exe("INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?", [key, value, value]);
        }
        res.redirect("/admin/manage_settings?msg=Settings Updated");
    } catch (error) {
        console.log(error); 
        res.send(error.message);
    }
});

// 5. FACILITIES (SERVICES)
route.get("/manage_facilities", async (req, res) => {
    try {
        const data = await exe("SELECT * FROM facilities ORDER BY id DESC");
        res.render("admin/manage_facilities", { facilities: data, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.send("Error loading facilities");
    }
});

route.post("/save_facility", async (req, res) => {
    try {
        let imagePath = "/uploads/default.jpg";
        if(req.files && req.files.image) {
            const image = req.files.image;
            const imageName = Date.now() + image.name;
            const uploadPath = path.join(__dirname, '../public/uploads/', imageName);
            image.mv(uploadPath);
            imagePath = "/uploads/" + imageName;
        }
        await exe("INSERT INTO facilities (title, description, price, duration, image_path, category, status) VALUES (?, ?, ?, ?, ?, ?, 'active')", 
        [req.body.title, req.body.description, req.body.price, req.body.duration, imagePath, req.body.category]);
        res.redirect("/admin/manage_facilities");
    } catch (error) {
        res.send(error.message);
    }
});

route.get("/delete_facility/:id", async (req, res) => {
    try {
        await exe("DELETE FROM facilities WHERE id = ?", [req.params.id]);
        res.redirect("/admin/manage_facilities");
    } catch (error) {
        res.redirect("/admin/manage_facilities");
    }
});

// 6. TEAM MANAGEMENT
route.get("/manage_team", async (req, res) => {
    try {
        const team = await exe("SELECT * FROM team ORDER BY id DESC");
        res.render("admin/manage_team", { team, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.send("Error loading team");
    }
});

route.post("/save_team", async (req, res) => {
    try {
        let imagePath = "/uploads/default.jpg";
        if(req.files && req.files.image) {
            const image = req.files.image;
            const imageName = Date.now() + image.name;
            const uploadPath = path.join(__dirname, '../public/uploads/', imageName);
            image.mv(uploadPath);
            imagePath = "/uploads/" + imageName;
        }
        await exe("INSERT INTO team (name, role, image_path, status) VALUES (?, ?, ?, 'active')", [req.body.name, req.body.role, imagePath]);
        res.redirect("/admin/manage_team");
    } catch (error) {
        res.send(error.message);
    }
});

route.get("/delete_team/:id", async (req, res) => {
    try {
        await exe("DELETE FROM team WHERE id = ?", [req.params.id]);
        res.redirect("/admin/manage_team");
    } catch (error) {
        res.redirect("/admin/manage_team");
    }
});

// 7. TESTIMONIALS
route.get("/manage_testimonials", async (req, res) => {
    try {
        const testimonials = await exe("SELECT * FROM testimonials ORDER BY id DESC");
        res.render("admin/manage_testimonials", { testimonials, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.send("Error loading testimonials");
    }
});

route.post("/save_testimonial", async (req, res) => {
    try {
        const { client_name, review, rating } = req.body;
        await exe("INSERT INTO testimonials (client_name, review, rating) VALUES (?, ?, ?)", [client_name, review, rating]);
        res.redirect("/admin/manage_testimonials");
    } catch (error) {
        console.error(error);
        res.send(error.message);
    }
});

route.get("/delete_testimonial/:id", async (req, res) => {
    try {
        await exe("DELETE FROM testimonials WHERE id = ?", [req.params.id]);
        res.redirect("/admin/manage_testimonials");
    } catch (error) {
        res.redirect("/admin/manage_testimonials");
    }
});

// 8. FAQ
route.get("/manage_faq", async (req, res) => {
    try {
        const faqs = await exe("SELECT * FROM faqs ORDER BY id DESC");
        res.render("admin/manage_faq", { faqs, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.send("Error loading FAQ");
    }
});

route.post("/save_faq", async (req, res) => {
    try {
        const { question, answer } = req.body;
        await exe("INSERT INTO faqs (question, answer, status, display_order) VALUES (?, ?, 'active', 0)", [question, answer]);
        res.redirect("/admin/manage_faq");
    } catch (error) {
        console.error(error);
        res.send(error.message);
    }
});

route.get("/delete_faq/:id", async (req, res) => {
    try {
        await exe("DELETE FROM faqs WHERE id = ?", [req.params.id]);
        res.redirect("/admin/manage_faq");
    } catch (error) {
        res.redirect("/admin/manage_faq");
    }
});

// 9. GALLERY
route.get("/manage_gallery", async (req, res) => {
    try {
        const data = await exe("SELECT * FROM gallery ORDER BY id DESC");
        res.render("admin/manage_gallery", { gallery: data, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.send("Error loading gallery");
    }
});

route.post("/save_gallery", async (req, res) => {
    if(req.files && req.files.image) {
        const image = req.files.image;
        const imageName = Date.now() + image.name;
        const uploadPath = path.join(__dirname, '../public/uploads/', imageName);
        image.mv(uploadPath, async (err) => {
            if (err) return res.status(500).send(err);
            try {
                await exe("INSERT INTO gallery (image_title, image_path, category, status) VALUES (?, ?, ?, 'active')", [req.body.title, '/uploads/'+imageName, req.body.category]);
                res.redirect("/admin/manage_gallery");
            } catch (dbError) {
                console.error(dbError);
                res.send("Database Error saving gallery");
            }
        });
    }
});

route.get("/delete_gallery/:id", async (req, res) => {
    try {
        await exe("DELETE FROM gallery WHERE id = ?", [req.params.id]);
        res.redirect("/admin/manage_gallery");
    } catch (error) {
        res.redirect("/admin/manage_gallery");
    }
});

// 10. CLIENT LIST (CONTACT FORM ENTRIES)
route.get("/client_list", async (req, res) => {
    try {
        const data = await exe("SELECT * FROM client_detail_contact_form ORDER BY id DESC");
        res.render("admin/client_list", { client: data, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.send("Error loading clients");
    }
});

// 11. APPOINTMENT LIST
route.get("/appointment_list", async (req, res) => {
    try {
        const data = await exe("SELECT * FROM appointments ORDER BY id DESC");
        res.render("admin/appointment_list", { appointments: data, user: req.session.user });
    } catch (error) {
        console.error(error);
        res.send("Error loading appointments");
    }
});

route.get("/update_status/:id/:status", async (req, res) => {
    try {
        await exe("UPDATE appointments SET status = ? WHERE id = ?", [req.params.status, req.params.id]);
        res.redirect("/admin/appointment_list");
    } catch (error) {
        console.error(error);
        res.redirect("/admin/appointment_list");
    }
});

module.exports = route;