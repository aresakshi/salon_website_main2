const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const path = require("path");

// --- 1. IMPORT ROUTES ---
const user_route = require("./Routes/user");
const admin_route = require("./Routes/admin");
const auth_route = require("./Routes/auth");

// --- 2. IMPORT DATABASE CONNECTION ---
// We import this to create tables automatically
const exe = require("./connection"); 

const app = express();

// --- 3. MIDDLEWARE SETUP ---
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

// --- 4. CREATE UPLOAD DIRECTORY IF IT DOESN'T EXIST ---
const fs = require('fs');
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// --- 5. ROUTE MOUNTING ---
app.use("/", auth_route.route); 
app.use("/", user_route);
app.use("/admin", admin_route);

// --- 6. DATABASE INITIALIZATION (ADDED FOR RENDER) ---
// This ensures all tables exist before the server starts listening
const initializeDatabase = async () => {
    console.log("Checking database tables...");

    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255),
            password VARCHAR(255),
            role VARCHAR(50) DEFAULT 'user'
        )`,
        // 1. Sliders
        `CREATE TABLE IF NOT EXISTS sliders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255),
            subtitle VARCHAR(255),
            image_path VARCHAR(255),
            status VARCHAR(50) DEFAULT 'active'
        )`,
        
        // 2. Facilities (Services)
        `CREATE TABLE IF NOT EXISTS facilities (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255),
            description TEXT,
            price DECIMAL(10,2),
            duration VARCHAR(100),
            image_path VARCHAR(255),
            category VARCHAR(100),
            status VARCHAR(50) DEFAULT 'active'
        )`,

        // 3. Team
        `CREATE TABLE IF NOT EXISTS team (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            role VARCHAR(255),
            image_path VARCHAR(255),
            status VARCHAR(50) DEFAULT 'active'
        )`,

        // 4. Testimonials
        `CREATE TABLE IF NOT EXISTS testimonials (
            id INT AUTO_INCREMENT PRIMARY KEY,
            client_name VARCHAR(255),
            review TEXT,
            rating INT
        )`,

        // 5. FAQs
        `CREATE TABLE IF NOT EXISTS faqs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question TEXT,
            answer TEXT,
            status VARCHAR(50) DEFAULT 'active',
            display_order INT DEFAULT 0
        )`,

        // 6. Site Content
        `CREATE TABLE IF NOT EXISTS site_content (
            id INT AUTO_INCREMENT PRIMARY KEY,
            section_name VARCHAR(255) UNIQUE,
            content TEXT
        )`,

        // 7. Site Settings
        `CREATE TABLE IF NOT EXISTS site_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(255) UNIQUE,
            setting_value TEXT
        )`,

        // 8. Gallery
        `CREATE TABLE IF NOT EXISTS gallery (
            id INT AUTO_INCREMENT PRIMARY KEY,
            image_title VARCHAR(255),
            image_path VARCHAR(255),
            category VARCHAR(100),
            status VARCHAR(50) DEFAULT 'active'
        )`,

        // 9. Contact Form Submissions
        `CREATE TABLE IF NOT EXISTS client_detail_contact_form (
            id INT AUTO_INCREMENT PRIMARY KEY,
            client_name VARCHAR(255),
            client_email VARCHAR(255),
            client_phone VARCHAR(50),
            client_message TEXT
        )`,

        // 10. Appointments
        `CREATE TABLE IF NOT EXISTS appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            client_name VARCHAR(255),
            client_phone VARCHAR(50),
            service_name VARCHAR(255),
            appointment_date DATE,
            user_id INT,
            status VARCHAR(50) DEFAULT 'Pending'
        )`
    ];

        try {
        for (const sql of tables) {
            await exe(sql);
        }
        console.log("✅ All database tables checked/created successfully.");

               // --- CHECK AND CREATE DEFAULT ADMIN USER ---
        // Check if an admin with email 'admin@salon.com' already exists
        const existingAdmin = await exe("SELECT * FROM users WHERE email = 'admin@salon.com'");
        
        if (existingAdmin.length === 0) {
            const bcrypt = require('bcrypt');
            // Hash the password 'admin123' securely
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            // Insert the admin user
            await exe("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", 
                ['Admin User', 'admin@salon.com', hashedPassword, 'admin']);
            
            console.log("🔐 Default Admin User Created!");
            console.log("   Email: admin@salon.com");
            console.log("   Password: admin123");
        } else {
            console.log("ℹ️ Admin user already exists.");
        }
        // -------------------------------------------

    } catch (error) {
        console.error("❌ Error creating tables:", error);
    }

// --- 7. START SERVER ---
// We call the init function before listening
initializeDatabase().then(() => {
    app.listen(1000, () => {
        console.log("Server running on port 1000");
    });
});
