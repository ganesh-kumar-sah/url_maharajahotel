const http=require('http');
const express=require('express');
const nodemailer=require('nodemailer');
const fs = require('fs');
const path = require('path');
const eventsRouter=require('./events');
const hotelsRouter=require('./hotels');
const foodRouter=require('./food');
const app=express();

// Middleware to parse form data (needed for POST requests)
app.use(express.urlencoded({ extended: true }));

// Middleware: Calculate Notification Counts for Admin Sidebar
app.use((req, res, next) => {
    let pendingFood = 0;
    if (req.app.locals.foodOrders) {
        pendingFood = req.app.locals.foodOrders.filter(o => o.status === 'Pending').length;
    }
    
    let activeHotels = 0;
    if (req.app.locals.hotelBookings) {
        activeHotels = req.app.locals.hotelBookings.filter(b => b.status === 'Active').length;
    }

    let activeEvents = 0;
    const bookingsFile = path.join(__dirname, 'bookings.json');
    if (fs.existsSync(bookingsFile)) {
        try {
            const events = JSON.parse(fs.readFileSync(bookingsFile, 'utf8'));
            activeEvents = events.filter(e => e.status === 'Active').length;
        } catch (e) {}
    }

    res.locals.counts = { food: pendingFood, hotel: activeHotels, event: activeEvents };
    next();
});

// Global setting for guest theme
app.locals.guestTheme = 'default';
app.locals.guestType = 'national'; // Set a default to bypass the selection screen

// Store data globally on the app
app.locals.feedbacks = [];
app.locals.foodOrders = [];
app.locals.hotelBookings = [];
app.locals.users = []; // Storage for registered members

// Store editable site content
const i18n = {
    en: {
        heroTitle: "The Grand Plaza",
        heroSubtitle: "Experience Elegance & Luxury",
        exploreBtn: "Explore Services",
        bookRoomBtn: "Book a Room",
        reserveTableBtn: "Reserve a Table",
        orderDiningBtn: "Order Dining",
        login: "Member Login",
        signup: "Sign Up",
        logout: "Logout",
        welcome: "Welcome",
        roomsNav: "Rooms & Suites",
        diningNav: "Dining",
        wellnessNav: "Wellness",
        expNav: "Experiences",
        bookNav: "Book A Stay"
    },
    hi: {
        heroTitle: "द ग्रैंड प्लाज़ा",
        heroSubtitle: "लालित्य और विलासिता का अनुभव करें",
        exploreBtn: "सेवाओं का अन्वेषण करें",
        bookRoomBtn: "कमरा बुक करें",
        reserveTableBtn: "टेबल बुक करें",
        orderDiningBtn: "खाना ऑर्डर करें",
        login: "सदस्य लॉगिन",
        signup: "साइन अप",
        logout: "लॉग आउट",
        welcome: "स्वागत है",
        roomsNav: "कमरे और सुइट्स",
        diningNav: "भोजन",
        wellnessNav: "कल्याण",
        expNav: "अनुभव",
        bookNav: "बुक करें"
    }
};

// Middleware: Parse Cookies, Setup Auth & Language state
app.use((req, res, next) => {
    const cookies = {};
    if (req.headers.cookie) {
        req.headers.cookie.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            if (parts.length >= 2) cookies[parts[0].trim()] = parts[1].trim();
        });
    }
    
    req.user = req.app.locals.users.find(u => u.email === cookies.grandplaza_user) || null;
    req.lang = cookies.guestLanguage || 'en';
    
    res.locals.user = req.user;
    res.locals.lang = req.lang;
    res.locals.t = i18n[req.lang] || i18n['en'];
    next();
});

app.locals.siteContent = {
    aboutTitle: "Our Story",
    aboutText: "Welcome to The Grand Plaza, where luxury meets comfort. Established in 1995, we have been the definition of opulence in the heart of the city. Our commitment to exceptional service and exquisite details ensures your stay is nothing short of perfection.<br><br>From our world-class dining experiences to our serene spa suites, every corner of The Grand Plaza is designed with you in mind. We invite you to indulge in a world of sophistication.",
    feedbackTitle: "Guest Feedback",
    feedbackText: "We value your experience. Let us know how we did.",
    replySubject: "Thank you for visiting The Grand Plaza",
    replyBody: "Dear {name},\n\nThank you for your valuable feedback!\n\n\"{message}\"\n\nWe hope to see you again soon.\n\nBest Regards,\nThe Grand Plaza Team",
};

// Configure Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'aryanmdbraj@gmail.com', // REPLACE WITH YOUR EMAIL
        pass: 'brsxulkqrnzhknbr'     // REPLACE WITH YOUR APP PASSWORD
    }
});

// --- I18N (LANGUAGE) ROUTES ---
app.post('/set-language', (req, res) => {
    res.cookie('guestLanguage', req.body.language, { maxAge: 90000000 });
    res.redirect(req.get('Referer') || '/');
});

// --- AUTHENTICATION ROUTES ---
app.get('/login', (req, res) => {
    const hasError = !!req.query.error;
    const errorMsg = hasError ? `<div class="error-msg">${req.query.error}</div>` : '';
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>The Golden Gateway | Grand Plaza</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Montserrat:wght@300;400;500&display=swap');
            :root { --primary-gold: #B39359; --text-dark: #1A1A1A; --text-light: #ffffff; }
            body { margin: 0; padding: 0; font-family: 'Montserrat', sans-serif; background: #050505; color: #fff; min-height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
            
            /* Luxury Video Background */
            .video-bg-container { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background: #050505; overflow: hidden; }
            .video-bg-container video { width: 100%; height: 100%; object-fit: cover; opacity: 0.5; filter: contrast(1.1) brightness(0.7); }
            .video-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at center, rgba(26,26,26,0.3) 0%, rgba(10,10,10,0.9) 100%); }
            
            .auth-wrapper { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px; z-index: 1; perspective: 1000px; }
            
            /* Glassmorphism Box */
            .auth-box { width: 100%; max-width: 420px; background: rgba(26, 26, 26, 0.45); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border: 1px solid rgba(179, 147, 89, 0.2); border-top: 4px solid var(--primary-gold); border-radius: 16px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); position: relative; overflow: hidden; transition: border-color 0.3s; }
            
            /* Error Shake Animation */
            @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-8px); } 40%, 80% { transform: translateX(8px); } }
            .shake-active .auth-box { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; border-top-color: #e74c3c; border-color: rgba(231, 76, 60, 0.4); box-shadow: 0 10px 30px rgba(231, 76, 60, 0.2); }
            
            /* Split-Focus Toggle Transitions */
            .form-container { padding: 40px; position: absolute; top: 0; left: 0; width: 100%; box-sizing: border-box; visibility: hidden; opacity: 0; transform: translateX(40px) scale(0.95); transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1); }
            .form-container.active { position: relative; visibility: visible; opacity: 1; transform: translateX(0) scale(1); }
            .form-container.slide-out { transform: translateX(-40px) scale(0.95); opacity: 0; visibility: hidden; position: absolute; }
            
            h2 { font-family: 'Playfair Display', serif; text-align: center; margin: 0 0 30px 0; font-weight: 600; color: var(--primary-gold); letter-spacing: 2px; text-transform: uppercase; font-size: 1.8em; }
            
            .error-msg { background: rgba(231, 76, 60, 0.1); color: #ff7675; padding: 10px; border-radius: 4px; border-left: 3px solid #e74c3c; font-size: 0.85em; text-align: center; margin-bottom: 20px; font-weight: 500; }
            
            /* Floating Labels & Input Glow */
            .input-group { position: relative; margin-bottom: 30px; }
            .input-group input { width: 100%; padding: 10px 0; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.3); color: #fff; font-family: inherit; font-size: 1em; outline: none; transition: all 0.3s ease; border-radius: 0; box-shadow: none; }
            .input-group label { position: absolute; top: 10px; left: 0; color: rgba(255,255,255,0.6); font-size: 1em; transition: all 0.3s ease; pointer-events: none; }
            .input-group input:focus, .input-group input:not(:placeholder-shown) { border-bottom-color: var(--primary-gold); box-shadow: 0 8px 10px -10px rgba(179,147,89,0.5); }
            .input-group input:focus + label, .input-group input:not(:placeholder-shown) + label { top: -15px; font-size: 0.75em; color: var(--primary-gold); letter-spacing: 1px; }
            
            /* Button Shine Beam */
            .btn { width: 100%; padding: 15px; background: var(--primary-gold); color: #111; border: none; border-radius: 4px; font-weight: 600; font-family: inherit; cursor: pointer; text-transform: uppercase; letter-spacing: 2px; transition: all 0.4s ease; position: relative; overflow: hidden; font-size: 0.9em; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
            .btn::after { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%); transform: rotate(45deg) translateX(-150%); animation: shine 5s infinite; }
            @keyframes shine { 0%, 10% { transform: rotate(45deg) translateX(-150%); } 90%, 100% { transform: rotate(45deg) translateX(150%); } }
            .btn:hover { background: #8e7343; color: #fff; box-shadow: 0 8px 25px rgba(179,147,89,0.4); transform: translateY(-2px); }
            
            /* Form Toggles */
            .toggle-text { text-align: center; margin-top: 25px; font-size: 0.85em; color: #aaa; }
            .toggle-text a { color: var(--primary-gold); text-decoration: none; font-weight: 600; transition: 0.3s; position: relative; }
            .toggle-text a::after { content: ''; position: absolute; width: 0; height: 1px; bottom: -2px; left: 0; background-color: var(--primary-gold); transition: width 0.3s ease; }
            .toggle-text a:hover::after { width: 100%; }
            .toggle-text a:hover { color: #fff; }
            
            /* Back to Home Hover */
            .back-link { display: inline-flex; align-items: center; gap: 8px; text-align: center; margin-top: 30px; color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.85em; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; transition: 0.3s; }
            .back-link span { transition: transform 0.3s ease; }
            .back-link:hover { color: var(--primary-gold); }
            .back-link:hover span { transform: translateX(-5px); }
        </style>
    </head>
    <body>
        <div class="video-bg-container">
            <video autoplay muted loop playsinline crossorigin="anonymous">
                <source src="https://videos.pexels.com/video-files/4022830/4022830-hd_1920_1080_30fps.mp4" type="video/mp4">
            </video>
            <div class="video-overlay"></div>
        </div>
        
        <div class="auth-wrapper ${hasError ? 'shake-active' : ''}">
            <div class="auth-box">
                
                <!-- Login Form -->
                <div class="form-container active" id="login-view">
                    <h2>Member Login</h2>
                    ${errorMsg}
                    <form action="/login" method="POST">
                        <div class="input-group">
                            <input type="email" name="email" id="log-email" placeholder=" " required>
                            <label for="log-email">Email Address</label>
                        </div>
                        <div class="input-group">
                            <input type="password" name="password" id="log-pass" placeholder=" " required>
                            <label for="log-pass">Password</label>
                        </div>
                        <button type="submit" class="btn">Login</button>
                    </form>
                    <p class="toggle-text">New to Grand Plaza? <a href="#" onclick="toggleView('signup')">Join the Circle</a></p>
                </div>
                
                <!-- Sign Up Form -->
                <div class="form-container" id="signup-view">
                    <h2>Sign Up</h2>
                    ${errorMsg}
                    <form action="/signup" method="POST">
                        <div class="input-group">
                            <input type="text" name="name" id="reg-name" placeholder=" " required>
                            <label for="reg-name">Full Name</label>
                        </div>
                        <div class="input-group">
                            <input type="email" name="email" id="reg-email" placeholder=" " required>
                            <label for="reg-email">Email Address</label>
                        </div>
                        <div class="input-group">
                            <input type="password" name="password" id="reg-pass" placeholder=" " required>
                            <label for="reg-pass">Password</label>
                        </div>
                        <button type="submit" class="btn">Create Account</button>
                    </form>
                    <p class="toggle-text">Already a member? <a href="#" onclick="toggleView('login')">Sign In</a></p>
                </div>
                
            </div>
            
            <a href="/" class="back-link"><span>←</span> Back to Home</a>
        </div>

        <script>
            // Split-Focus Toggle Logic
            function toggleView(target) {
                const loginView = document.getElementById('login-view');
                const signupView = document.getElementById('signup-view');
                
                if (target === 'signup') {
                    loginView.classList.remove('active');
                    loginView.classList.add('slide-out');
                    signupView.classList.remove('slide-out');
                    signupView.classList.add('active');
                } else {
                    signupView.classList.remove('active');
                    signupView.classList.add('slide-out');
                    loginView.classList.remove('slide-out');
                    loginView.classList.add('active');
                }

                // Stop shake animation & hide error block on toggle
                document.querySelector('.auth-wrapper').classList.remove('shake-active');
                document.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');
            }
            
            // Auto-open signup form if error implies email existence
            ${req.query.error && req.query.error.includes('exists') ? "window.onload = () => toggleView('signup');" : ""}

            // Clear shake class after animation finishes
            setTimeout(() => {
                const wrapper = document.querySelector('.auth-wrapper');
                if(wrapper && wrapper.classList.contains('shake-active')) {
                    wrapper.classList.remove('shake-active');
                }
            }, 600);
        </script>
    </body>
    </html>`);
});

app.post('/signup', (req, res) => {
    const { name, email, password } = req.body;
    if (req.app.locals.users.find(u => u.email === email)) return res.redirect('/login?error=Email already exists');
    req.app.locals.users.push({ name, email, password });
    res.cookie('grandplaza_user', email, { maxAge: 90000000 });
    res.redirect('/');
});

app.post('/login', (req, res) => {
    const user = req.app.locals.users.find(u => u.email === req.body.email && u.password === req.body.password);
    if (user) { res.cookie('grandplaza_user', user.email, { maxAge: 90000000 }); res.redirect('/'); } 
    else { res.redirect('/login?error=Invalid email or password'); }
});

app.get('/logout', (req, res) => {
    res.clearCookie('grandplaza_user');
    res.redirect('/');
});

app.get("/",(req,res)=>{
    res.send(`
    
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Grand Plaza Services</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@300;400;600&family=Montserrat:wght@300;400;500&display=swap');
            
            :root {
                --primary-gold: #B39359;
                --text-dark: #1A1A1A;
                --text-light: #ffffff;
                --bg-warm: #f9f7f2;
                --bg-beige: #ebe4d6;
                --serif-font: 'Playfair Display', serif;
                --sans-font: 'Montserrat', sans-serif;
                --glass-effect: rgba(255, 255, 255, 0.8);
            }

            body { margin: 0; padding: 0; font-family: var(--sans-font); color: var(--text-dark); background: var(--bg-warm); scroll-behavior: smooth; }
            
            /* Override body themes as the new default is requested */
            body.theme-default, body.theme-romantic, body.theme-luxury { background: var(--bg-warm); color: var(--text-dark); }

            /* Integrated Glassmorphism Header */
            .site-header {
                position: fixed; top: 0; left: 0; width: 100%; z-index: 1000;
                background: transparent;
                backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                transition: background 0.4s ease, box-shadow 0.4s ease;
                box-shadow: none;
            }
            .site-header.scrolled {
                background: rgba(255, 255, 255, 0.85);
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }

            /* Utility Top-Bar (Transparent) */
            .top-bar {
                background: transparent;
                display: flex; justify-content: flex-end; align-items: center;
                padding: 6px 50px; font-size: 0.75em; gap: 20px;
                font-family: var(--sans-font); text-transform: uppercase; letter-spacing: 1px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                transition: border-color 0.4s ease;
            }
            .site-header.scrolled .top-bar {
                border-bottom-color: rgba(0,0,0,0.05);
            }
            .top-bar a, .top-bar select {
                color: var(--text-light); text-decoration: none; background: transparent;
                border: none; font-size: inherit; cursor: pointer; outline: none; transition: color 0.3s ease;
            }
            .top-bar a:hover, .top-bar select:hover { color: var(--primary-gold); }
            .top-bar option { background: var(--text-dark); color: var(--text-light); }
            .top-bar span { color: var(--text-light); font-weight: 500; font-size: inherit; transition: color 0.3s ease; }
            .top-bar form { margin: 0; display: inline-block; }

            /* Main Navigation */
            nav {
                padding: 15px 50px; display: flex; justify-content: space-between; align-items: center; 
                transition: padding 0.4s ease; box-sizing: border-box;
            }
            .site-header.scrolled nav { padding: 10px 50px; }
            nav .logo { font-family: var(--serif-font); font-size: 1.8em; color: var(--text-light); font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; transition: color 0.4s ease; }
            nav .menu { display: flex; align-items: center; gap: 30px; }
            nav .menu-links { display: flex; gap: 25px; align-items: center; }
            
            /* The Gold Line Reveal */
            nav .menu-links a { color: var(--text-light); text-decoration: none; font-size: 0.85em; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 500; position: relative; padding-bottom: 4px; transition: color 0.3s ease; font-family: var(--sans-font); }
            nav .menu-links a::after { content: ''; position: absolute; width: 0; height: 2px; bottom: 0; left: 0; background-color: var(--primary-gold); transition: width 0.3s ease; }
            nav .menu-links a:hover { color: var(--primary-gold); }
            nav .menu-links a:hover::after { width: 100%; }
            
            /* Button Pulse & Glow */
            .btn-book {
                background-color: var(--primary-gold); color: #fff !important; padding: 12px 28px;
                text-decoration: none; text-transform: uppercase; font-size: 0.8em; letter-spacing: 2px; font-weight: 600;
                transition: all 0.4s ease; border-radius: 2px; border: none; font-family: var(--sans-font);
                box-shadow: 0 0 0 0 rgba(179, 147, 89, 0.7); animation: pulseGlow 3s infinite;
            }
            .btn-book:hover {
                transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                background-color: #967a49; animation: none;
            }
            @keyframes pulseGlow {
                0% { box-shadow: 0 0 0 0 rgba(179, 147, 89, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(179, 147, 89, 0); }
                100% { box-shadow: 0 0 0 0 rgba(179, 147, 89, 0); }
            }
            .hamburger { display: none; flex-direction: column; cursor: pointer; gap: 5px; }
            .hamburger span { width: 25px; height: 2px; background: var(--text-light); transition: background 0.3s; }

            /* Scrolled State Text/Element Colors */
            .site-header.scrolled .top-bar a, 
            .site-header.scrolled .top-bar select,
            .site-header.scrolled nav .logo, 
            .site-header.scrolled nav .menu-links a {
                color: var(--text-dark);
            }
            .site-header.scrolled .top-bar span { color: var(--text-dark); }
            .site-header.scrolled .hamburger span { background: var(--text-dark); }

            /* Sections */
            section { padding: 100px 20px; min-height: 80vh; box-sizing: border-box; }
            
            /* Home / Hero with Carousel */
            #home {
                position: relative; height: 100vh; display: flex; justify-content: center; align-items: center; text-align: center; color: var(--text-light); overflow: hidden; padding: 0;
            }
            .carousel { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
            .carousel-inner { width: 100%; height: 100%; position: relative; }
            .carousel-item {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center;
                opacity: 0; transition: opacity 1.5s ease-in-out;
            }
            .carousel-item.active { opacity: 1; }
            .carousel-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); z-index: 2; }
            
            .hero-content { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; }
            .hero-title { font-family: var(--serif-font); font-size: 4.5em; letter-spacing: 4px; color: var(--text-light); text-transform: uppercase; margin: 0 0 15px 0; font-weight: 300; text-shadow: 0 4px 10px rgba(0,0,0,0.3); }
            #home p { font-size: 1.2em; font-weight: 300; letter-spacing: 3px; margin: 0 0 30px 0; text-transform: uppercase; }

            /* Floating Booking Bar */
            .booking-bar {
                position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); z-index: 10;
                background: var(--glass-effect); backdrop-filter: blur(10px); padding: 15px 30px;
                display: flex; gap: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: max-content;
            }
            .booking-btn {
                background-color: transparent; color: var(--text-dark); padding: 12px 25px; border: 1px solid var(--primary-gold);
                font-family: var(--sans-font); font-size: 0.85em; text-transform: uppercase; letter-spacing: 1.5px;
                cursor: pointer; transition: 0.3s ease; text-decoration: none; font-weight: 500; display: block; text-align: center;
            }
            .booking-btn:hover { background-color: var(--primary-gold); color: var(--text-light); }

            /* About */
            #about { background: var(--bg-warm); text-align: center; display: flex; flex-direction: column; justify-content: center; }
            .section-title { font-family: var(--serif-font); font-size: 2.5em; color: var(--text-dark); margin-bottom: 20px; position: relative; display: inline-block; text-transform: uppercase; letter-spacing: 2px; font-weight: 300; }
            .section-title::after { content: ''; display: block; width: 40px; height: 1px; background: var(--primary-gold); margin: 20px auto 0; }
            .about-content { max-width: 800px; margin: 0 auto; line-height: 1.8; font-size: 1.05em; color: #555; font-weight: 400; }

            /* Services */
            #services { background: var(--bg-beige); }
            .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; max-width: 1200px; margin: 50px auto 0; }
            .service-card { position: relative; overflow: hidden; background: var(--bg-warm); display: flex; flex-direction: column; transition: 0.4s; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
            .service-card:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0,0,0,0.1); }
            .service-img { height: 250px; background-size: cover; background-position: center; }
            .service-info { padding: 40px 30px; text-align: center; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between; }
            .service-info h3 { font-family: var(--serif-font); font-size: 1.5em; margin: 0 0 15px; color: var(--text-dark); text-transform: uppercase; letter-spacing: 1px; font-weight: 400; }
            .service-info p { color: #555; line-height: 1.6; font-size: 0.95em; }
            .btn-solid { 
                display: inline-block; padding: 12px 30px; background: var(--primary-gold); color: white; text-decoration: none; 
                text-transform: uppercase; font-size: 0.8em; letter-spacing: 2px; transition: 0.3s; margin-top: 25px; border: none; font-family: var(--sans-font); font-weight: 500;
            }
            .btn-solid:hover { background: #9c8040; }

            /* Feedback */
            #feedback { background: var(--text-dark); color: var(--text-light); text-align: center; display: flex; flex-direction: column; justify-content: center; }
            #feedback .section-title { color: var(--text-light); }
            .feedback-form { max-width: 600px; margin: 40px auto; display: flex; flex-direction: column; gap: 20px; }
            .feedback-form input, .feedback-form textarea { padding: 15px; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: var(--text-light); font-family: var(--sans-font); font-size: 0.9em; border-radius: 0; }
            .feedback-form input:focus, .feedback-form textarea:focus { outline: none; border-color: var(--primary-gold); }
            .feedback-form button { padding: 15px; background: var(--primary-gold); color: white; border: none; font-weight: 500; cursor: pointer; text-transform: uppercase; letter-spacing: 2px; transition: 0.3s; font-family: var(--sans-font); }
            .feedback-form button:hover { background: #9c8040; }

            select {
                padding: 10px 20px; cursor: pointer; font-size: 0.85em; font-family: var(--sans-font); text-transform: uppercase; letter-spacing: 1px;
                background: transparent; border: 1px solid rgba(255,255,255,0.4); color: white;
                backdrop-filter: blur(5px); transition: background 0.3s; border-radius: 0; outline: none;
            }
            select:hover { background: rgba(255,255,255,0.1); }
            select option { background: var(--text-dark); color: white; }
            
            @media (max-width: 768px) {
                .hero-title { font-size: 3em; }
                .booking-bar { flex-direction: column; width: 80%; }
                .top-bar { justify-content: center; padding: 8px 20px; gap: 15px; }
                nav { padding: 15px 20px; }
                .site-header.scrolled nav { padding: 15px 20px; }
                .hamburger { display: flex; }
                nav .menu { gap: 15px; }
                nav .menu-links {
                    display: none; flex-direction: column; position: absolute; top: 100%; left: 0; width: 100%; background: rgba(255, 255, 255, 0.98); padding: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); gap: 15px;
                }
                nav .menu-links.active { display: flex; }
                nav .btn-book { display: none; }
                .mobile-cta { display: block; position: fixed; bottom: 0; left: 0; width: 100%; background: var(--primary-gold); color: #fff; text-align: center; padding: 15px; font-size: 0.9em; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; text-decoration: none; z-index: 1000; box-shadow: 0 -5px 15px rgba(0,0,0,0.1); }
            }
            @media (min-width: 769px) {
                .mobile-cta { display: none; }
            }
        </style>
    </head>
    <body class="theme-${req.app.locals.guestTheme}">
        <header class="site-header">
            <div class="top-bar">
                <form action="/set-language" method="POST">
                    <select name="language" onchange="this.form.submit()">
                        <option value="en" ${res.locals.lang === 'en' ? 'selected' : ''}>ENG</option>
                        <option value="hi" ${res.locals.lang === 'hi' ? 'selected' : ''}>HIN</option>
                    </select>
                </form>
                <form action="/set-guest-type" method="POST">
                    <select name="type" onchange="this.form.submit()">
                        <option value="national" ${req.app.locals.guestType === 'national' ? 'selected' : ''}>INR</option>
                        <option value="international" ${req.app.locals.guestType === 'international' ? 'selected' : ''}>USD</option>
                    </select>
                </form>
                ${res.locals.user 
                    ? `<span>${res.locals.t.welcome}, ${res.locals.user.name}</span> <a href="/logout" style="margin-left: 10px;">${res.locals.t.logout}</a>`
                    : `<a href="/login">${res.locals.t.login}</a>`
                }
            </div>
            <nav>
                <a href="/" class="logo">Grand Plaza</a>
                <div class="hamburger" onclick="document.querySelector('.menu-links').classList.toggle('active')">
                    <span></span><span></span><span></span>
                </div>
                <div class="menu">
                    <div class="menu-links">
                        <a href="/hotels">${res.locals.t.roomsNav}</a>
                        <a href="/food">${res.locals.t.diningNav}</a>
                        <a href="/events">${res.locals.t.wellnessNav}</a>
                        <a href="/events">${res.locals.t.expNav}</a>
                    </div>
                    <a href="/hotels" class="btn-book">${res.locals.t.bookNav}</a>
                </div>
            </nav>
        </header>
        
        <a href="/hotels" class="mobile-cta">${res.locals.t.bookNav}</a>

        <section id="home">
            <div class="carousel">
                <div class="carousel-inner">
                    <div class="carousel-item active" style="background-image: url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80')"></div>
                    <div class="carousel-item" style="background-image: url('https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1920&q=80')"></div>
                    <div class="carousel-item" style="background-image: url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80')"></div>
                </div>
                <div class="carousel-overlay"></div>
            </div>
            <div class="hero-content">
                <h1 class="hero-title">${res.locals.t.heroTitle}</h1>
                <p>${res.locals.t.heroSubtitle}</p>
                <a href="#services" class="btn-solid" style="background: transparent; border: 1px solid var(--primary-gold);">${res.locals.t.exploreBtn}</a>
            </div>
            
            <div class="booking-bar">
                <a href="/hotels" class="booking-btn">${res.locals.t.bookRoomBtn}</a>
                <a href="/events" class="booking-btn">${res.locals.t.reserveTableBtn}</a>
                <a href="/food" class="booking-btn">${res.locals.t.orderDiningBtn}</a>
            </div>
        </section>

        <section id="about">
            <h2 class="section-title">${req.app.locals.siteContent.aboutTitle}</h2>
            <div class="about-content">
                <p>${req.app.locals.siteContent.aboutText}</p>
            </div>
        </section>

        <section id="services">
            <div style="text-align:center;"><h2 class="section-title">Our Services</h2></div>
            <div class="services-grid">
                <div class="service-card">
                    <div class="service-img" style="background-image: url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80');"></div>
                    <div class="service-info">
                        <h3>Luxury Rooms</h3>
                        <p>Relax in our spacious suites with breathtaking views.</p>
                        <a href="/hotels" class="btn-solid">Book Room</a>
                    </div>
                </div>
                <div class="service-card">
                    <div class="service-img" style="background-image: url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80');"></div>
                    <div class="service-info">
                        <h3>Fine Dining</h3>
                        <p>Savor gourmet dishes crafted by top chefs.</p>
                        <a href="/food" class="btn-solid">Order Food</a>
                    </div>
                </div>
                <div class="service-card">
                    <div class="service-img" style="background-image: url('https://images.unsplash.com/photo-1514362545857-3bc16549766b?auto=format&fit=crop&w=800&q=80');"></div>
                    <div class="service-info">
                        <h3>Events & Tables</h3>
                        <p>Reserve the perfect spot for your special moments.</p>
                        <a href="/events" class="btn-solid">Book Table</a>
                    </div>
                </div>
            </div>
        </section>

        <section id="feedback">
            <div class="feedback-header-wrapper">
                <div class="live-indicator"><span class="pulse-dot"></span> Live from our guests</div>
                <h2 class="section-title">${req.app.locals.siteContent.feedbackTitle}</h2>
                <p class="counter-text">Join <span id="review-counter" data-target="4281">0</span> happy travelers</p>
                <p style="color: #999; font-size: 0.95em; max-width: 600px; margin: 15px auto;">${req.app.locals.siteContent.feedbackText}</p>
            </div>

            <div class="feedback-marquee-container">
                <div class="feedback-marquee-track">
                    <!-- Card 1 -->
                    <div class="feedback-glass-card" style="--bg-img: url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80')">
                        <div class="card-bg-hover"></div>
                        <div class="reaction-bubbles"><span>❤️</span><span>🥂</span></div>
                        <div class="card-header">
                            <div class="avatar-wrapper"><img src="https://i.pravatar.cc/100?img=1" class="avatar-glow" alt="Guest"></div>
                            <div class="guest-info">
                                <h4>Sarah Jenkins</h4>
                                <div class="star-rating" data-rating="5">☆☆☆☆☆</div>
                            </div>
                        </div>
                        <div class="context-tags"><span class="context-tag honeymoon">Honeymoon</span></div>
                        <p class="review-text">"Absolutely breathtaking experience. The attention to detail is unmatched!"</p>
                    </div>
                    <!-- Card 2 -->
                    <div class="feedback-glass-card staggered" style="--bg-img: url('https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=400&q=80')">
                        <div class="card-bg-hover"></div>
                        <div class="reaction-bubbles"><span>🌴</span><span>✨</span></div>
                        <div class="card-header">
                            <div class="avatar-wrapper"><img src="https://i.pravatar.cc/100?img=2" class="avatar-glow" alt="Guest"></div>
                            <div class="guest-info">
                                <h4>Michael Chen</h4>
                                <div class="star-rating" data-rating="5">☆☆☆☆☆</div>
                            </div>
                        </div>
                        <div class="context-tags"><span class="context-tag business">Business</span></div>
                        <p class="review-text">"The perfect blend of luxury and productivity. Will definitely return."</p>
                    </div>
                    <!-- Card 3 -->
                    <div class="feedback-glass-card" style="--bg-img: url('https://images.unsplash.com/photo-1514362545857-3bc16549766b?auto=format&fit=crop&w=400&q=80')">
                        <div class="card-bg-hover"></div>
                        <div class="reaction-bubbles"><span>🍹</span><span>🌟</span></div>
                        <div class="card-header">
                            <div class="avatar-wrapper"><img src="https://i.pravatar.cc/100?img=3" class="avatar-glow" alt="Guest"></div>
                            <div class="guest-info">
                                <h4>Emma Thompson</h4>
                                <div class="star-rating" data-rating="5">☆☆☆☆☆</div>
                            </div>
                        </div>
                        <div class="context-tags"><span class="context-tag family">Family Stay</span></div>
                        <p class="review-text">"Our kids loved the pool, and we loved the spa. A flawless weekend getaway."</p>
                    </div>
                    <!-- Card 4 -->
                    <div class="feedback-glass-card staggered" style="--bg-img: url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80')">
                        <div class="card-bg-hover"></div>
                        <div class="reaction-bubbles"><span>💎</span><span>🥂</span></div>
                        <div class="card-header">
                            <div class="avatar-wrapper"><img src="https://i.pravatar.cc/100?img=4" class="avatar-glow" alt="Guest"></div>
                            <div class="guest-info">
                                <h4>David Miller</h4>
                                <div class="star-rating" data-rating="5">☆☆☆☆☆</div>
                            </div>
                        </div>
                        <div class="context-tags"><span class="context-tag leisure">Leisure</span></div>
                        <p class="review-text">"Five-star dining and incredible room service. The staff is wonderful."</p>
                    </div>
                    
                    <!-- Duplicates for seamless loop -->
                    <div class="feedback-glass-card" style="--bg-img: url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80')">
                        <div class="card-bg-hover"></div>
                        <div class="reaction-bubbles"><span>❤️</span><span>🥂</span></div>
                        <div class="card-header">
                            <div class="avatar-wrapper"><img src="https://i.pravatar.cc/100?img=1" class="avatar-glow" alt="Guest"></div>
                            <div class="guest-info">
                                <h4>Sarah Jenkins</h4>
                                <div class="star-rating" data-rating="5">☆☆☆☆☆</div>
                            </div>
                        </div>
                        <div class="context-tags"><span class="context-tag honeymoon">Honeymoon</span></div>
                        <p class="review-text">"Absolutely breathtaking experience. The attention to detail is unmatched!"</p>
                    </div>
                    <div class="feedback-glass-card staggered" style="--bg-img: url('https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=400&q=80')">
                        <div class="card-bg-hover"></div>
                        <div class="reaction-bubbles"><span>🌴</span><span>✨</span></div>
                        <div class="card-header">
                            <div class="avatar-wrapper"><img src="https://i.pravatar.cc/100?img=2" class="avatar-glow" alt="Guest"></div>
                            <div class="guest-info">
                                <h4>Michael Chen</h4>
                                <div class="star-rating" data-rating="5">☆☆☆☆☆</div>
                            </div>
                        </div>
                        <div class="context-tags"><span class="context-tag business">Business</span></div>
                        <p class="review-text">"The perfect blend of luxury and productivity. Will definitely return."</p>
                    </div>
                </div>
            </div>
            
            <div class="scroll-progress-bar"><div class="scroll-progress-fill"></div></div>

            <div class="feedback-cta-wrapper">
                <button class="write-memory-btn" onclick="document.getElementById('feedback-form-container').classList.toggle('show')">Write a Memory ✨</button>
            </div>

            <div id="feedback-form-container" class="feedback-form-container">
                <form class="feedback-form" action="/feedback" method="POST">
                    <input type="text" name="name" placeholder="Your Name" required>
                    <input type="email" name="email" placeholder="Your Email" required>
                    <textarea name="message" rows="5" placeholder="Your Feedback or Suggestion" required></textarea>
                    <button type="submit">Submit Feedback</button>
                </form>
            </div>

            <style>
                #feedback {
                    position: relative;
                    background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
                    color: var(--text-light);
                    overflow: hidden;
                    padding: 100px 0;
                }
                #feedback .section-title {
                    color: var(--text-light);
                    border: none;
                    margin-bottom: 10px;
                }
                .feedback-header-wrapper {
                    text-align: center;
                    margin-bottom: 50px;
                    padding: 0 20px;
                    position: relative;
                }
                .live-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-family: var(--sans-font);
                    font-size: 0.85em;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    color: #2ecc71;
                    margin-bottom: 15px;
                    background: rgba(46, 204, 113, 0.1);
                    padding: 6px 15px;
                    border-radius: 20px;
                    border: 1px solid rgba(46, 204, 113, 0.3);
                }
                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    background-color: #2ecc71;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #2ecc71;
                    animation: pulseLive 1.5s infinite;
                }
                @keyframes pulseLive {
                    0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(46, 204, 113, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
                }
                .counter-text {
                    font-size: 1.2em;
                    color: #aaa;
                    font-family: var(--sans-font);
                    margin: 10px 0;
                }
                #review-counter {
                    color: var(--primary-gold);
                    font-weight: 600;
                    font-size: 1.4em;
                }

                .feedback-marquee-container {
                    width: 100%;
                    overflow: hidden;
                    position: relative;
                    padding: 40px 0;
                    perspective: 1000px;
                }
                .feedback-marquee-container::before, .feedback-marquee-container::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    width: 150px;
                    height: 100%;
                    z-index: 2;
                    pointer-events: none;
                }
                .feedback-marquee-container::before {
                    left: 0;
                    background: linear-gradient(to right, #1a1a1a 0%, transparent 100%);
                }
                .feedback-marquee-container::after {
                    right: 0;
                    background: linear-gradient(to left, #0a0a0a 0%, transparent 100%);
                }
                .feedback-marquee-track {
                    display: flex;
                    gap: 30px;
                    width: max-content;
                    animation: drift 30s linear infinite;
                    will-change: transform;
                }
                .feedback-marquee-container:hover .feedback-marquee-track {
                    animation-play-state: paused;
                }
                @keyframes drift {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-50% - 15px)); }
                }

                .feedback-glass-card {
                    position: relative;
                    width: 350px;
                    padding: 30px;
                    border-radius: 16px;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
                    color: #fff;
                    transform: translateZ(0);
                    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, border-color 0.4s ease;
                    overflow: hidden;
                    opacity: 0;
                    transform: translateY(40px);
                }
                .feedback-glass-card.in-view {
                    opacity: 1;
                    transform: translateY(0);
                }
                .feedback-glass-card.staggered {
                    margin-top: 40px;
                }
                .card-bg-hover {
                    position: absolute;
                    top: 0; left: 0; width: 100%; height: 100%;
                    background-image: var(--bg-img);
                    background-size: cover;
                    background-position: center;
                    opacity: 0;
                    z-index: 0;
                    transition: opacity 0.5s ease, filter 0.5s ease;
                    filter: brightness(0.4) blur(2px);
                }
                .feedback-glass-card:hover {
                    transform: translateY(-10px) translateZ(20px);
                    box-shadow: 0 25px 50px rgba(0,0,0,0.5);
                    border-color: rgba(212, 175, 55, 0.4);
                }
                .feedback-glass-card:hover .card-bg-hover {
                    opacity: 0.15;
                }
                .feedback-glass-card.highlight-gold {
                    border-color: var(--primary-gold);
                    box-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
                }
                
                .card-header, .context-tags, .review-text {
                    position: relative;
                    z-index: 1;
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 15px;
                }
                .avatar-wrapper {
                    position: relative;
                }
                .avatar-glow {
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid transparent;
                    animation: avatarPulse 3s infinite alternate;
                }
                @keyframes avatarPulse {
                    0% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4); border-color: rgba(212, 175, 55, 0.2); }
                    100% { box-shadow: 0 0 0 6px rgba(212, 175, 55, 0); border-color: rgba(212, 175, 55, 0.8); }
                }
                .guest-info h4 {
                    margin: 0 0 5px 0;
                    font-family: var(--serif-font);
                    font-size: 1.2em;
                    font-weight: 400;
                    letter-spacing: 1px;
                }
                .star-rating {
                    color: transparent;
                    -webkit-text-stroke: 1px var(--primary-gold);
                    font-size: 1.1em;
                    letter-spacing: 2px;
                    position: relative;
                    display: inline-block;
                }
                .star-rating::before {
                    content: '★★★★★';
                    position: absolute;
                    left: 0;
                    top: 0;
                    color: var(--primary-gold);
                    width: 0;
                    overflow: hidden;
                    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .star-rating.filled::before {
                    width: 100%;
                }
                .context-tag {
                    display: inline-block;
                    font-size: 0.7em;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    padding: 4px 10px;
                    border-radius: 20px;
                    margin-bottom: 15px;
                    font-weight: 600;
                    animation: colorShift 4s infinite alternate;
                }
                .context-tag.honeymoon { background: rgba(231, 76, 60, 0.15); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.3); }
                .context-tag.business { background: rgba(52, 152, 219, 0.15); color: #3498db; border: 1px solid rgba(52, 152, 219, 0.3); }
                .context-tag.family { background: rgba(46, 204, 113, 0.15); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.3); }
                .context-tag.leisure { background: rgba(155, 89, 182, 0.15); color: #9b59b6; border: 1px solid rgba(155, 89, 182, 0.3); }
                @keyframes colorShift {
                    0% { filter: brightness(1); }
                    100% { filter: brightness(1.3); }
                }
                .review-text {
                    font-style: italic;
                    line-height: 1.6;
                    color: #ddd;
                    font-size: 0.95em;
                }

                .reaction-bubbles {
                    position: absolute;
                    right: 20px;
                    bottom: 20px;
                    z-index: 0;
                    opacity: 0;
                    transition: opacity 0.3s;
                    pointer-events: none;
                }
                .feedback-glass-card:hover .reaction-bubbles {
                    opacity: 1;
                }
                .reaction-bubbles span {
                    display: inline-block;
                    font-size: 1.2em;
                    animation: floatUp 2s ease-in-out infinite;
                    opacity: 0;
                }
                .reaction-bubbles span:nth-child(2) {
                    animation-delay: 0.5s;
                    margin-left: 10px;
                }
                @keyframes floatUp {
                    0% { transform: translateY(10px) scale(0.8); opacity: 0; }
                    50% { opacity: 0.6; }
                    100% { transform: translateY(-30px) scale(1.2); opacity: 0; }
                }

                .scroll-progress-bar {
                    width: 200px;
                    height: 2px;
                    background: rgba(255,255,255,0.1);
                    margin: 20px auto;
                    border-radius: 2px;
                    position: relative;
                    overflow: hidden;
                }
                .scroll-progress-fill {
                    position: absolute;
                    top: 0; left: 0; height: 100%;
                    background: var(--primary-gold);
                    width: 30%;
                    animation: scrollProgress 30s linear infinite;
                }
                @keyframes scrollProgress {
                    0% { left: -30%; }
                    100% { left: 100%; }
                }

                .feedback-cta-wrapper {
                    text-align: center;
                    margin-top: 40px;
                }
                .write-memory-btn {
                    background: linear-gradient(45deg, #111, #222);
                    color: var(--primary-gold);
                    border: 1px solid var(--primary-gold);
                    padding: 15px 35px;
                    font-size: 1em;
                    font-family: var(--sans-font);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    border-radius: 30px;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                }
                .write-memory-btn::after {
                    content: '';
                    position: absolute;
                    top: -50%; left: -50%; width: 200%; height: 200%;
                    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%);
                    transform: rotate(45deg);
                    animation: shimmer 3s infinite;
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%) rotate(45deg); }
                    100% { transform: translateX(100%) rotate(45deg); }
                }
                .write-memory-btn:hover {
                    background: var(--primary-gold);
                    color: #111;
                    box-shadow: 0 15px 30px rgba(212, 175, 55, 0.4);
                    transform: translateY(-2px);
                }

                .feedback-form-container {
                    display: none;
                    margin-top: 40px;
                    animation: fadeIn 0.5s ease-out forwards;
                }
                .feedback-form-container.show {
                    display: block;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .feedback-form {
                    max-width: 600px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .feedback-form input,
                .feedback-form textarea {
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: var(--text-light);
                    font-family: var(--sans-font);
                    font-size: 0.9em;
                    border-radius: 8px;
                    transition: border-color 0.3s ease;
                }
                .feedback-form input:focus, .feedback-form textarea:focus {
                    outline: none; border-color: var(--primary-gold);
                }
                .feedback-form button {
                    padding: 15px; background: var(--primary-gold); color: white; border: none; font-weight: 500; cursor: pointer; text-transform: uppercase; letter-spacing: 2px; transition: 0.3s; font-family: var(--sans-font); border-radius: 8px;
                }
                .feedback-form button:hover { background: #9c8040; }
            </style>
        </section>

        <footer style="background:#111; color:#555; text-align:center; padding: 40px; font-family: var(--sans-font); font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px;">
            <p>&copy; 2024 The Grand Plaza.</p>
        </footer>
        <script>
            // Carousel Logic
            const items = document.querySelectorAll('.carousel-item');
            let currentItem = 0;
            if(items.length > 0) {
                setInterval(() => {
                    items[currentItem].classList.remove('active');
                    currentItem = (currentItem + 1) % items.length;
                    items[currentItem].classList.add('active');
                }, 5000);
            }

            // Header Scroll Effect
            window.addEventListener('scroll', () => {
                const header = document.querySelector('.site-header');
                header.classList.toggle('scrolled', window.scrollY > 50);
            });

            // Pulse of Hospitality Interactions
            document.addEventListener('DOMContentLoaded', () => {
                // Dynamic Counter
                const counterElement = document.getElementById('review-counter');
                if(counterElement) {
                    const target = parseInt(counterElement.getAttribute('data-target'));
                    let count = 0;
                    const duration = 2000;
                    const increment = target / (duration / 16);
                    
                    const observer = new IntersectionObserver((entries) => {
                        if(entries[0].isIntersecting) {
                            const updateCounter = () => {
                                count += increment;
                                if(count < target) {
                                    counterElement.innerText = Math.ceil(count).toLocaleString();
                                    requestAnimationFrame(updateCounter);
                                } else {
                                    counterElement.innerText = target.toLocaleString();
                                }
                            };
                            requestAnimationFrame(updateCounter);
                            observer.disconnect();
                        }
                    });
                    observer.observe(document.getElementById('feedback'));
                }

                // Staggered Entrance & Star Fill
                const cards = document.querySelectorAll('.feedback-glass-card');
                const cardObserver = new IntersectionObserver((entries) => {
                    entries.forEach((entry, index) => {
                        if(entry.isIntersecting) {
                            setTimeout(() => {
                                entry.target.classList.add('in-view');
                                const star = entry.target.querySelector('.star-rating');
                                if(star) setTimeout(() => star.classList.add('filled'), 300);
                            }, index * 200);
                            cardObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1 });
                cards.forEach(card => cardObserver.observe(card));

                // Highlight Loop
                if (cards.length > 0) {
                    setInterval(() => {
                        cards.forEach(c => c.classList.remove('highlight-gold'));
                        const randomCard = cards[Math.floor(Math.random() * cards.length)];
                        randomCard.classList.add('highlight-gold');
                    }, 5000);
                }
            });
        </script>
    </body>
    </html>
    `);
});

app.get("/admin",(req,res)=>{
    // Generate Feedback HTML
    const feedbackHtml = req.app.locals.feedbacks.length > 0 ? req.app.locals.feedbacks.map(f => `
        <div class="card" style="width: auto; text-align: left; margin-bottom: 20px; border-left: 5px solid ${f.replied ? '#2ecc71' : '#d4af37'};">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <h3 style="color: #333; margin-bottom: 5px;">${f.name}</h3>
                    <p style="margin:0; font-size:0.85em; color:#777;">${f.email}</p>
                    <p style="margin:0; font-size:0.85em; color:#777;">Type: ${f.type || 'N/A'}</p>
                    <p style="margin:5px 0 0 0; font-size: 0.8em; color: #999;">${f.date}</p>
                </div>
                ${f.replied ? '<span style="background:#2ecc71; color:white; padding:3px 8px; border-radius:4px; font-size:0.7em;">Replied</span>' : '<span style="background:#f1c40f; color:white; padding:3px 8px; border-radius:4px; font-size:0.7em;">Pending</span>'}
            </div>
            <p style="background: rgba(0,0,0,0.05); padding: 15px; border-radius: 5px; font-style: italic; margin: 15px 0; color:#555;">"${f.message}"</p>
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                ${!f.replied ? `<form action="/admin/feedback/reply" method="POST"><input type="hidden" name="id" value="${f.id}"><button type="submit" class="btn" style="background: #3498db; margin: 0; font-size: 0.8em; padding: 8px 15px;">Send Auto Reply</button></form>` : ''}
                <a href="mailto:${f.email}" class="btn" style="background: #95a5a6; margin: 0; text-align: center; font-size: 0.8em; padding: 8px 15px;">Manual Email</a>
                <form action="/admin/feedback/delete" method="POST"><input type="hidden" name="id" value="${f.id}"><button type="submit" class="btn" style="background: #e74c3c; margin: 0; font-size: 0.8em; padding: 8px 15px;">Delete</button></form>
            </div>
        </div>
    `).join('') : '<p style="color: #bbb;">No feedback received yet.</p>';

    // Generate Users HTML
    const usersHtml = req.app.locals.users.length > 0 ? req.app.locals.users.map((u, index) => `
        <div class="card" style="border-left: 5px solid #8e44ad; padding: 20px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; font-size:1.1em; color: #fff;">${u.name}</h3>
                <span style="background:#8e44ad; color:white; padding:3px 8px; border-radius:4px; font-size:0.7em;">Member</span>
            </div>
            <p style="margin:5px 0 0 0; font-size:0.85em; opacity:0.8;">${u.email}</p>
        </div>
    `).join('') : '<p style="color: #bbb;">No members registered yet.</p>';

    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Dashboard</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
        <style>
            :root {
                --bg-dark: #121212; --card-dark: #1e1e1e; --text-dark: #e0e0e0; --accent-dark: #d4af37;
                --bg-light: #f9fafb; --card-light: #ffffff; --text-light: #111827; --accent-light: #3b82f6;
                --bg-blue: #1e3c72; --card-blue: rgba(255,255,255,0.1); --text-blue: #ffffff; --accent-blue: #2563eb;
            }
            body { font-family: 'Poppins', sans-serif; margin: 0; background: transparent !important; color: #fff; }
            
            /* Dynamic Video Background */
            .video-bg-container { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background: #050505; overflow: hidden; }
            .video-bg-container video { width: 100%; height: 100%; object-fit: cover; opacity: 0.65; filter: contrast(1.15) brightness(0.85) saturate(1.1); animation: slowPan 30s linear infinite alternate; }
            .video-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at center, rgba(15,15,15,0.6) 0%, rgba(0,0,0,0.9) 100%); }
            .video-overlay::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(212,175,55,0.15) 0%, transparent 50%, rgba(212,175,55,0.05) 100%); mix-blend-mode: color-dodge; pointer-events: none; }
            @keyframes slowPan { 0% { transform: scale(1); } 100% { transform: scale(1.05); } }

            .header { display: flex; justify-content: space-between; align-items: center; padding: 25px 40px; margin: 30px 40px; border-radius: 16px; background: rgba(20,20,20,0.5); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 32px 0 rgba(0,0,0,0.3); }

            .header h1 { font-size: 1.5em; margin: 0; font-weight: 600; }
            .main-container { padding: 40px; }
            .grid-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; }

            .card { border-radius: 16px; padding: 30px; transition: transform 0.3s, box-shadow 0.3s; background: rgba(20, 20, 20, 0.5) !important; backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1) !important; box-shadow: 0 8px 32px 0 rgba(0,0,0,0.3) !important; }
            .card:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(0,0,0,0.5) !important; }

            .card h2 { margin-top: 0; font-size: 1.2em; font-weight: 600; }
            
            .btn, button { border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.85em; transition: 0.3s; text-decoration: none; display: inline-block; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
            
            .dark .btn, .dark button { background: linear-gradient(45deg, #d4af37, #c5a028); color: #000; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2); }
            .dark .btn:hover, .dark button:hover { background: linear-gradient(45deg, #edc967, #d4af37); box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4); transform: translateY(-1px); }
            
            .light .btn, .light button { background-color: var(--accent-light); color: white; }
            .light .btn:hover, .light button:hover { background-color: #2563eb; }
            .blue .btn, .blue button { background-color: var(--accent-blue); color: white; }
            .blue .btn:hover, .blue button:hover { background-color: #1d4ed8; }

            .btn-secondary { background-color: #6b7280 !important; color: white !important; }
            .btn-danger { background-color: #ef4444 !important; color: white !important; }
            
            h2.section-title { font-size: 1.8em; font-weight: 600; margin: 40px 0 20px; padding-bottom: 15px; border-bottom: 1px solid; }
            h2.section-title { border-bottom-color: rgba(255,255,255,0.2) !important; color: #d4af37; }
            
            h1, h2, h3, .section-title { font-family: 'Playfair Display', serif; letter-spacing: 0.5px; }

            .feedback-list { display: flex; flex-direction: column; gap: 20px; }
            .feedback-list .card { text-align: left; }
            .feedback-list h3 { color: inherit !important; }
            .feedback-list p { color: inherit !important; opacity: 0.8; }
            .feedback-list .btn { font-size: 0.8em !important; padding: 8px 15px !important; margin: 0 !important; }

            select, input, textarea { padding: 12px; border-radius: 8px; font-family: 'Poppins', sans-serif; font-weight: 500; box-sizing: border-box; background: rgba(0,0,0,0.4) !important; border: 1px solid rgba(184, 134, 11, 0.4) !important; color: white !important; backdrop-filter: blur(5px); }
            input:focus, select:focus, textarea:focus { border-color: #d4af37 !important; outline: none; box-shadow: 0 0 10px rgba(212, 175, 55, 0.3); }
            
            label { display: block; margin-top: 10px; margin-bottom: 5px; font-size: 0.9em; opacity: 0.8; }

            /* --- LUXURY SIDEBAR NAVIGATION --- */
            body { display: flex; min-height: 100vh; margin: 0; }
            .sidebar { width: 260px; color: #ecf0f1; display: flex; flex-direction: column; padding: 30px 20px; z-index: 100; flex-shrink: 0; background: rgba(10, 10, 10, 0.65); backdrop-filter: blur(20px); border-right: 1px solid rgba(255,255,255,0.1); box-shadow: 5px 0 30px rgba(0,0,0,0.5); }
            .sidebar-header { font-family: 'Playfair Display', serif; font-size: 1.6em; margin-bottom: 50px; text-align: center; color: #d4af37; text-transform: uppercase; letter-spacing: 2px; position: relative; }
            .sidebar-header::after { content: ''; display: block; width: 40px; height: 2px; background: #d4af37; margin: 15px auto 0; }
            .sidebar-header span { font-size: 0.4em; color: #777; letter-spacing: 4px; display: block; margin-top: 8px; font-family: 'Poppins', sans-serif; }
            .nav-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 15px; }
            .nav-links a { display: flex; align-items: center; padding: 15px 20px; color: rgba(255,255,255,0.6); text-decoration: none; border-radius: 8px; transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); font-weight: 500; font-size: 0.95em; border-left: 3px solid transparent; background: linear-gradient(90deg, transparent 0%, transparent 100%); }
            .nav-links a:hover, .nav-links a.active { color: #fff; background: linear-gradient(90deg, rgba(212, 175, 55, 0.15) 0%, transparent 100%); border-left: 3px solid #d4af37; padding-left: 28px; transform: translateX(5px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
            .nav-links a i { width: 25px; margin-right: 10px; opacity: 0.8; }
            .main-content-wrapper { flex-grow: 1; height: 100vh; overflow-y: auto; background: inherit; }
            .badge { background: #e74c3c; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.75em; margin-left: 8px; vertical-align: middle; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="video-bg-container">
            <video autoplay muted loop playsinline crossorigin="anonymous" poster="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80">
                <!-- High-end luxury hotel/architecture background -->
                <source src="https://videos.pexels.com/video-files/4022830/4022830-hd_1920_1080_30fps.mp4" type="video/mp4">
            </video>
            <div class="video-overlay"></div>
        </div>
        <nav class="sidebar">
            <div class="sidebar-header">Grand Plaza<br><span>Admin Panel</span></div>
            <div class="nav-links">
                <a href="/admin" class="active">📊 Dashboard</a>
                <a href="/food/admin">🍔 Food Orders ${res.locals.counts.food > 0 ? `<span class="badge">${res.locals.counts.food}</span>` : ''}</a>
                <a href="/hotels/admin">🏨 Hotel Bookings ${res.locals.counts.hotel > 0 ? `<span class="badge">${res.locals.counts.hotel}</span>` : ''}</a>
                <a href="/events/admin">📅 Table Reservations ${res.locals.counts.event > 0 ? `<span class="badge">${res.locals.counts.event}</span>` : ''}</a>
                <a href="/admin/history">📜 Order History</a>
                <a href="/" target="_blank" style="margin-top: 40px; border: 1px solid rgba(255,255,255,0.1);">👀 Guest View</a>
            </div>
        </nav>

        <div class="main-content-wrapper">
        <div class="header">
            <h1>Dashboard Overview</h1>
            <div>
                <label for="themeSelect" style="display:inline; font-weight: 500; margin-right: 10px;">Admin Theme:</label>
                <select id="themeSelect" onchange="changeTheme(this.value)">
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light</option>
                    <option value="blue">Blue</option>
                </select>
            </div>
        </div>
        <div class="main-container">
            <!-- Quick Stats Row (Optional placeholder for future stats) -->
            <div class="grid-container" style="margin-bottom: 40px;">
                <div class="card" style="border-left: 4px solid #3498db;">
                    <h3 style="margin:0; font-size:1em; opacity:0.7;">Quick Action</h3>
                    <p>Navigate to specific modules using the sidebar.</p>
                </div>
            </div>
            
            <h2 class="section-title">Guest Interface Settings</h2>
            <div class="card">
                <form action="/admin/set-theme" method="POST" style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid rgba(128,128,128,0.2);">
                    <label><strong>Guest Page Theme:</strong></label>
                    <div style="display: flex; gap: 10px;">
                        <select name="theme" style="flex-grow: 1;">
                            <option value="default" ${req.app.locals.guestTheme === 'default' ? 'selected' : ''}>Default (Light/Clean)</option>
                            <option value="romantic" ${req.app.locals.guestTheme === 'romantic' ? 'selected' : ''}>Romantic (Pink/Gradient)</option>
                            <option value="luxury" ${req.app.locals.guestTheme === 'luxury' ? 'selected' : ''}>Luxury (Dark/Gold)</option>
                        </select>
                        <button type="submit" class="btn">Apply Theme</button>
                    </div>
                </form>

                <h3>Update Site Content</h3>
                <form action="/admin/update-content" method="POST">
                    <div class="grid-container" style="gap: 20px; margin-top: 10px;">
                        <div>
                            <label>About Section Title</label>
                            <input type="text" name="aboutTitle" value="${req.app.locals.siteContent.aboutTitle}" style="width: 100%;">
                            
                            <label>About Text (HTML allowed)</label>
                            <textarea name="aboutText" rows="6" style="width: 100%;">${req.app.locals.siteContent.aboutText}</textarea>
                        </div>
                        <div>
                            <label>Feedback Section Title</label>
                            <input type="text" name="feedbackTitle" value="${req.app.locals.siteContent.feedbackTitle}" style="width: 100%;">
                            
                            <label>Feedback Intro Text</label>
                            <input type="text" name="feedbackText" value="${req.app.locals.siteContent.feedbackText}" style="width: 100%;">
                        </div>
                    </div>

                    <h3 style="margin-top: 20px;">Auto-Reply Email Settings</h3>
                    <div class="grid-container" style="gap: 20px; margin-top: 10px;">
                        <div>
                            <label>Email Subject</label>
                            <input type="text" name="replySubject" value="${req.app.locals.siteContent.replySubject}" style="width: 100%;">
                        </div>
                        <div>
                            <label>Email Body (Use {name} and {message} as placeholders)</label>
                            <textarea name="replyBody" rows="6" style="width: 100%;">${req.app.locals.siteContent.replyBody}</textarea>
                        </div>
                    </div>
                    <button type="submit" class="btn" style="margin-top: 15px;">Save Content</button>
                </form>
            </div>

            <h2 class="section-title">Guest Feedback</h2>
            <div class="feedback-list">
                ${feedbackHtml}
            </div>
            
            <h2 class="section-title">Registered Members</h2>
            <div class="grid-container" style="gap: 20px; margin-bottom: 40px;">
                ${usersHtml}
            </div>
        </div>
        </div> <!-- End main-content-wrapper -->

        <script>
            const savedTheme = localStorage.getItem('adminTheme') || 'dark';
            document.body.className = savedTheme;
            document.getElementById('themeSelect').value = savedTheme;

            function changeTheme(theme) {
                document.body.className = theme;
                localStorage.setItem('adminTheme', theme);
            }
        </script>
    </body>
    </html>
    `);
});

// NEW: Unified History Page
app.get('/admin/history', (req, res) => {
    const searchQuery = req.query.q ? req.query.q.toLowerCase() : '';
    const searchType = req.query.type || 'all';
    
    const counts = res.locals.counts || { food: 0, hotel: 0, event: 0 };

    // 1. Get Hotel History
    const hotelHistory = (searchType === 'all' || searchType === 'hotel') ? req.app.locals.hotelBookings.filter(b => {
        return b.status === 'Completed' && (!searchQuery || b.guestName.toLowerCase().includes(searchQuery) || b.id.toLowerCase().includes(searchQuery));
    }).map(b => {
        let checkOutDate = new Date(b.checkIn);
        checkOutDate.setDate(checkOutDate.getDate() + b.nights);
        let checkOutStr = checkOutDate.toISOString().split('T')[0];
        return `
        <div class="card history-form">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #bdc3c7; padding-bottom: 10px; margin-bottom: 15px;">🏨 Hotel: ${b.guestName}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left;">
                <div><label>Booking ID</label><input type="text" value="${b.id}" readonly></div>
                <div><label>Room Name</label><input type="text" value="${b.roomName}" readonly></div>
                <div><label>Check-In</label><input type="text" value="${b.checkIn}" readonly></div>
                <div><label>Check-Out</label><input type="text" value="${checkOutStr}" readonly></div>
                <div><label>Total Paid</label><input type="text" value="${b.currency}${b.total}" readonly></div>
                <div><label>Status</label><input type="text" value="${b.status}" readonly style="background: rgba(40, 167, 69, 0.2) !important; color: #2ecc71 !important; border: 1px solid #2ecc71 !important; font-weight: bold;"></div>
            </div>
            <div style="margin-top: 15px; text-align: right; display:flex; justify-content:flex-end; gap:10px;">
                 <a href="/hotels/admin/bill/${b.id}" style="text-decoration:none;"><button style="width: auto; padding: 8px 15px; font-size: 0.8em; background: #95a5a6;">Archive Bill</button></a>
                 <form action="/hotels/admin/delete-booking" method="POST" style="margin:0;">
                    <input type="hidden" name="id" value="${b.id}">
                    <button type="submit" class="btn-danger" style="width: auto; padding: 8px 15px; font-size: 0.8em;" onclick="return confirm('Delete this history record?')">Delete</button>
                 </form>
            </div>
        </div>`;
    }).join('') : '';

    // 2. Get Event History
    let eventHistory = '';
    if (searchType === 'all' || searchType === 'event') {
        const bookingsFile = path.join(__dirname, 'bookings.json');
        if (fs.existsSync(bookingsFile)) {
            try {
                const allEvents = JSON.parse(fs.readFileSync(bookingsFile, 'utf8'));
                eventHistory = allEvents.filter(b => {
                    return b.status === 'Completed' && (!searchQuery || b.guest.toLowerCase().includes(searchQuery) || b.bookingId.toLowerCase().includes(searchQuery));
                }).map(b => `
            <div class="card history-form">
                <h3 style="color: #2c3e50; border-bottom: 2px solid #bdc3c7; padding-bottom: 10px; margin-bottom: 15px;">📅 Event: ${b.guest}</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left;">
                    <div><label>Booking ID</label><input type="text" value="${b.bookingId}" readonly></div>
                    <div><label>Table</label><input type="text" value="${b.tableName}" readonly></div>
                    <div><label>Date</label><input type="text" value="${b.date}" readonly></div>
                    <div><label>Status</label><input type="text" value="${b.status}" readonly style="background: rgba(40, 167, 69, 0.2) !important; color: #2ecc71 !important; border: 1px solid #2ecc71 !important; font-weight: bold;"></div>
                </div>
                <div style="margin-top: 15px; text-align: right;">
                    <form action="/events/admin/delete-booking" method="POST">
                        <input type="hidden" name="bookingId" value="${b.bookingId}">
                        <button type="submit" class="btn-danger" style="font-size:0.8em; padding:8px 15px;" onclick="return confirm('Delete this history record?')">Delete</button>
                    </form>
                </div>
            </div>`).join('');
            } catch(e) {}
        }
    }

    // 3. Get Food History
    const foodHistory = (searchType === 'all' || searchType === 'food') ? req.app.locals.foodOrders.filter(o => {
        return o.status === 'Complete' && (!searchQuery || o.customerName.toLowerCase().includes(searchQuery) || o.id.toLowerCase().includes(searchQuery));
    }).map(order => `
        <div class="card history-form">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #bdc3c7; padding-bottom: 10px; margin-bottom: 15px;">🍔 Order: ${order.customerName}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left;">
                <div><label>Order ID</label><input type="text" value="${order.id}" readonly></div>
                <div><label>Item</label><input type="text" value="${order.item}" readonly></div>
                <div><label>Total</label><input type="text" value="${order.currency}${order.price * order.rate}" readonly></div>
                <div><label>Date</label><input type="text" value="${order.date}" readonly></div>
            </div>
            <div style="margin-top:15px; text-align:right; display:flex; justify-content:flex-end; gap:10px;">
                <form action="/food/admin/status" method="POST" style="margin:0;">
                    <input type="hidden" name="id" value="${order.id}">
                    <button type="submit" name="status" value="Pending" class="btn-secondary" style="background-color:#f39c12; font-size:0.8em; padding:8px 15px; width:auto;">Revert</button>
                </form>
                <form action="/food/admin/delete-order" method="POST" style="margin:0;">
                    <input type="hidden" name="id" value="${order.id}">
                    <button type="submit" class="btn-danger" style="font-size:0.8em; padding:8px 15px; width:auto;" onclick="return confirm('Delete this order history?')">Delete</button>
                </form>
            </div>
        </div>`).join('') : '';

    // Re-use the styles from the main admin page by rendering a simplified page
    // Note: We need to inject the CSS here because this route is in sec.js, not using the renderPage helper from modules.
    // Since sec.js uses `app.get('/admin')` styles inline, we will apply the same styles via class names assuming the layout wrapper.
    // However, sec.js doesn't have a global `renderPage` function available in this scope easily without duplicating code.
    // I will use the `app.get('/admin')` structure to maintain consistency.

    const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>History</title>
    <style>
        body{font-family:'Poppins',sans-serif; margin:0; display:flex; background: transparent !important; color: #fff; min-height: 100vh;} 
        .video-bg-container { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background: #050505; overflow: hidden; }
        .video-bg-container video { width: 100%; height: 100%; object-fit: cover; opacity: 0.65; filter: contrast(1.15) brightness(0.85) saturate(1.1); animation: slowPan 30s linear infinite alternate; }
        .video-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at center, rgba(15,15,15,0.6) 0%, rgba(0,0,0,0.9) 100%); }
        .video-overlay::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(212,175,55,0.15) 0%, transparent 50%, rgba(212,175,55,0.05) 100%); mix-blend-mode: color-dodge; pointer-events: none; }
        @keyframes slowPan { 0% { transform: scale(1); } 100% { transform: scale(1.05); } }
        .sidebar{width:260px; color:#ecf0f1; padding:30px 20px; z-index: 100; flex-shrink: 0; background: rgba(10, 10, 10, 0.65); backdrop-filter: blur(20px); border-right: 1px solid rgba(255,255,255,0.1); box-shadow: 5px 0 30px rgba(0,0,0,0.5);} 
        .main{flex:1;padding:40px;overflow-y:auto;} 
        .card{background: rgba(20, 20, 20, 0.5) !important; backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1) !important; box-shadow: 0 8px 32px 0 rgba(0,0,0,0.3) !important; padding:30px; margin-bottom:20px; border-radius:16px;} 
        label{font-size:0.8em; color:#bbb; font-weight:bold; display:block;} 
        input, select{width:100%; padding:12px; margin-top:5px; box-sizing:border-box; border-radius:8px; background: rgba(0,0,0,0.4) !important; border: 1px solid rgba(184, 134, 11, 0.4) !important; color: white !important; backdrop-filter: blur(5px);} 
        input[readonly] { opacity: 0.8; }
        button{padding:10px 20px;border:none;border-radius:4px;cursor:pointer;color:white;background:#d4af37;} 
        .btn-danger{background:#e74c3c;} .nav-links a{display:block;padding:15px;color:#ccc;text-decoration:none;transition: 0.3s;border-radius:8px;} .nav-links a.active{color:white;background: linear-gradient(90deg, rgba(212, 175, 55, 0.15) 0%, transparent 100%); border-left:3px solid #d4af37;padding-left:12px;} .history-grid{display:grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap:20px;}
    </style>
    <style>.badge { background: #e74c3c; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.75em; margin-left: 8px; vertical-align: middle; font-weight: bold; }</style></head>
    <body>
        <div class="video-bg-container">
            <video autoplay muted loop playsinline crossorigin="anonymous" poster="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80">
                <!-- High-end luxury hotel/architecture background -->
                <source src="https://videos.pexels.com/video-files/4022830/4022830-hd_1920_1080_30fps.mp4" type="video/mp4">
            </video>
            <div class="video-overlay"></div>
        </div>
        <nav class="sidebar">
            <div style="font-size:1.6em;color:#d4af37;text-align:center;margin-bottom:50px;">Grand Plaza<br><span style="font-size:0.4em;color:#777;">Admin Panel</span></div>
            <div class="nav-links"><a href="/admin">📊 Dashboard</a><a href="/food/admin">🍔 Food Orders ${counts.food > 0 ? `<span class="badge">${counts.food}</span>` : ''}</a><a href="/hotels/admin">🏨 Hotel Bookings ${counts.hotel > 0 ? `<span class="badge">${counts.hotel}</span>` : ''}</a><a href="/events/admin">📅 Table Reservations ${counts.event > 0 ? `<span class="badge">${counts.event}</span>` : ''}</a><a href="/admin/history" class="active">📜 Order History</a></div>
        </nav>
        <div class="main">
            <h1>Consolidated Order History</h1>
            <form action="/admin/history" method="GET" style="margin-bottom: 30px; background: rgba(20,20,20,0.5); backdrop-filter: blur(15px); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); display: flex; gap: 10px; align-items: center; box-shadow: 0 8px 32px 0 rgba(0,0,0,0.3);">
                <input type="text" name="q" placeholder="Search Guest Name or ID..." value="${searchQuery}" style="flex: 1;">
                <select name="type" style="width: auto;">
                    <option value="all" ${searchType === 'all' ? 'selected' : ''}>All Modules</option>
                    <option value="hotel" ${searchType === 'hotel' ? 'selected' : ''}>Hotel</option>
                    <option value="food" ${searchType === 'food' ? 'selected' : ''}>Food</option>
                    <option value="event" ${searchType === 'event' ? 'selected' : ''}>Events</option>
                </select>
                <button type="submit">Search</button>
                ${searchQuery || searchType !== 'all' ? '<a href="/admin/history"><button type="button" class="btn-secondary" style="background:#95a5a6;">Clear</button></a>' : ''}
            </form>
            <div class="history-grid">
                ${hotelHistory || ''} ${eventHistory || ''} ${foodHistory || ''}
                ${(!hotelHistory && !eventHistory && !foodHistory) ? '<p>No history found.</p>' : ''}
            </div>
        </div>
    </body></html>`;
    res.send(fullHtml);

});

app.post('/admin/set-theme', (req, res) => {
    const { theme } = req.body;
    app.locals.guestTheme = theme; // Update the global theme
    res.redirect('/admin');
});

app.post('/admin/update-content', (req, res) => {
    req.app.locals.siteContent.aboutTitle = req.body.aboutTitle;
    req.app.locals.siteContent.aboutText = req.body.aboutText;
    req.app.locals.siteContent.feedbackTitle = req.body.feedbackTitle;
    req.app.locals.siteContent.feedbackText = req.body.feedbackText;
    req.app.locals.siteContent.replySubject = req.body.replySubject;
    req.app.locals.siteContent.replyBody = req.body.replyBody;
    res.redirect('/admin');
});

app.post('/set-guest-type', (req, res) => {
    const { type } = req.body;
    app.locals.guestType = type; // Update the global guest type
    res.redirect(req.get('Referer') || '/');
});

// Handle Feedback Submission
app.post('/feedback', (req, res) => {
    const { name, email, message } = req.body;
    const id = Date.now().toString();
    const type = req.app.locals.guestType || 'General';
    req.app.locals.feedbacks.push({ id, name, email, message, date: new Date().toLocaleString(), type, replied: false });
    res.redirect('/#feedback');
});

// Auto Reply to Feedback
app.post('/admin/feedback/reply', (req, res) => {
    const { id } = req.body;
    const feedback = req.app.locals.feedbacks.find(f => f.id === id);
    if (feedback) {
        const bodyText = req.app.locals.siteContent.replyBody
            .replace(/{name}/g, feedback.name)
            .replace(/{message}/g, feedback.message);

        // Send actual email using Nodemailer
        const mailOptions = {
            from: 'aryanmdbraj@gmail.com',
            to: feedback.email,
            subject: req.app.locals.siteContent.replySubject,
            text: bodyText
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log('Error sending email:', error);
            else console.log('Email sent: ' + info.response);
        });
        feedback.replied = true;
    }
    res.redirect('/admin');
});

// Delete Feedback
app.post('/admin/feedback/delete', (req, res) => {
    const { id } = req.body;
    req.app.locals.feedbacks = req.app.locals.feedbacks.filter(f => f.id !== id);
    res.redirect('/admin');
});





app.use("/events",eventsRouter);
app.use("/hotels",hotelsRouter);
app.use("/food",foodRouter);

const server=http.createServer(app);
server.listen(4000,()=>console.log("Server is running on port 4000"));