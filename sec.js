const http=require('http');
const express=require('express');
const nodemailer=require('nodemailer');
const fs = require('fs');
const path = require('path');
const eventsRouter=require('./events');
const hotelsRouter=require('./hotels');
const foodRouter=require('./food');
const galleryRouter=require('./gallery');
const offersRouter=require('./offers');
const attractionsRouter = require('./attractions');
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
app.locals.highlights = [
    {
        id: '1',
        image: 'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=1200&q=80',
        badge: 'Signature',
        subtitle: 'Unforgettable Moments',
        title: 'The Pinnacle of Luxury',
        text: 'Immerse yourself in a curated selection of our finest offerings. From personalized butler services to exclusive access to our private lounges, every detail is meticulously orchestrated to create memories that last a lifetime.',
        buttonText: 'Experience More',
        buttonLink: '/gallery'
    }
];
app.locals.hotelInfo = {
    title: "An Oasis of Tranquility",
    subtitle: "Discover Our Signature Amenities",
    description: "Every aspect of The Grand Plaza is crafted to provide an unparalleled experience. Our world-class facilities are designed to cater to your every need, ensuring a stay that is both memorable and rejuvenating.",
    features: [
        "24/7 Concierge Service",
        "Rooftop Infinity Pool",
        "Award-Winning Spa",
        "Gourmet In-Room Dining",
        "Valet & Limo Service",
        "High-Speed Wi-Fi"
    ],
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80"
};

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
            bookNav: "Book A Stay",
            galleryNav: "Gallery",
            feedbackNav: "Feedback",
            offersNav: "Offers",
            attractionsNav: "Local Attractions"
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
            bookNav: "बुक करें",
            galleryNav: "गैलरी",
            feedbackNav: "प्रतिक्रिया",
            offersNav: "ऑफ़र",
            attractionsNav: "स्थानीय आकर्षण"
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
                --primary-gold: #C5A059;
                --text-dark: #1A1A1A;
                --text-light: #FAF9F6;
                --bg-warm: #FAF9F6;
                --bg-beige: #F0EFEB;
                --serif-font: 'Playfair Display', serif;
                --sans-font: 'Montserrat', sans-serif;
                --glass-effect: rgba(255, 255, 255, 0.8);
            }
            h1, h2, h3, h4, h5, h6, .section-title { font-family: var(--serif-font); }

            body { margin: 0; padding: 0; font-family: var(--sans-font); color: var(--text-dark); background: var(--bg-warm); scroll-behavior: smooth; font-weight: 300; letter-spacing: 1px; }
            
            /* Override body themes as the new default is requested */
            body.theme-default, body.theme-romantic, body.theme-luxury { background: var(--bg-warm); color: var(--text-dark); }

            /* The "Glass" Navbar */
            .site-header {
                position: fixed;
                top: 25px;
                left: 50%;
                transform: translateX(-50%);
                width: calc(100% - 60px);
                max-width: 1200px;
                background: rgba(10, 10, 10, 0.25);
                backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 50px;
                z-index: 1000;
                transition: all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
                box-shadow: 0 15px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
            }
            .site-header.scrolled {
                top: 15px;
                background: rgba(255, 255, 255, 0.98);
                box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
                border-color: rgba(255, 255, 255, 1);
            }

            /* Utility Top-Bar (Transparent) */
            .top-bar {
                background: transparent;
                display: flex; justify-content: flex-end; align-items: center;
                padding: 12px 40px 8px; font-size: 0.7em; gap: 20px;
                font-family: var(--sans-font); text-transform: uppercase; letter-spacing: 2px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.4s ease;
            }
            .site-header.scrolled .top-bar {
                padding: 10px 40px 6px;
                border-bottom-color: rgba(0,0,0,0.06);
            }
            .top-bar a, .top-bar select {
                color: rgba(255, 255, 255, 0.8); text-decoration: none; background: transparent;
                border: none; font-size: inherit; cursor: pointer; outline: none; transition: color 0.3s ease;
                padding: 0;
            }
            .top-bar a:hover, .top-bar select:hover { color: var(--primary-gold); }
            .top-bar option { background: var(--text-dark); color: var(--text-light); }
            .top-bar span { color: rgba(255, 255, 255, 0.9); font-weight: 500; font-size: inherit; transition: color 0.3s ease; }
            .top-bar form { margin: 0; display: flex; align-items: center; }

            /* Main Navigation */
            nav {
                padding: 12px 40px 18px; display: flex; justify-content: space-between; align-items: center; 
                transition: padding 0.4s ease; box-sizing: border-box;
            }
            .site-header.scrolled nav { padding: 12px 40px; }
            nav .logo { 
                font-family: var(--serif-font); font-size: 1.8em; color: var(--text-light); 
                font-weight: 400; letter-spacing: 3px; text-transform: uppercase; text-decoration: none; 
                transition: color 0.4s ease, transform 0.4s ease; text-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }
            .site-header.scrolled nav .logo { text-shadow: none; transform: scale(0.95); }
            nav .menu { display: flex; align-items: center; gap: 40px; }
            nav .menu-links { display: flex; gap: 30px; align-items: center; }
            
            /* Enhanced Aesthetic Links */
            nav .menu-links a { 
                color: var(--text-light); text-decoration: none; font-size: 0.75em; text-transform: uppercase; 
                letter-spacing: 2px; font-weight: 500; position: relative; padding: 5px 0; 
                transition: all 0.4s ease; font-family: var(--sans-font); opacity: 0.9;
            }
            nav .menu-links a::after { 
                content: ''; position: absolute; width: 4px; height: 4px; bottom: -2px; left: 50%; 
                background-color: var(--primary-gold); border-radius: 50%; transform: translateX(-50%) scale(0); 
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); opacity: 0; box-shadow: 0 0 8px var(--primary-gold);
            }
            nav .menu-links a:hover { color: #fff; opacity: 1; letter-spacing: 3px; }
            nav .menu-links a:hover::after { transform: translateX(-50%) scale(1); opacity: 1; }
            
            /* Reveal Animations */
            .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out; }
            .reveal.show { opacity: 1; transform: translateY(0); }

            button, .btn-solid, .booking-btn { border-radius: 2px; transition: all 0.4s ease-in-out; }
            
            /* Button Transformation */
            .btn-book, .btn-solid {
                background: transparent; border: 1px solid #C5A059; color: #C5A059 !important;
                padding: 12px 30px; text-transform: uppercase; letter-spacing: 3px;
                transition: 0.5s all; text-decoration: none; font-weight: 400; border-radius: 0; display: inline-block;
            }
            .btn-book:hover, .btn-solid:hover {
                background: #C5A059; color: #fff !important;
                box-shadow: 0 10px 20px rgba(197, 160, 89, 0.2);
            }
            nav .btn-book {
                background: linear-gradient(135deg, var(--primary-gold), #a38244);
                color: #fff !important; border: none; padding: 12px 28px;
                border-radius: 30px; font-size: 0.75em; font-weight: 600;
                box-shadow: 0 10px 20px rgba(197, 160, 89, 0.3);
                letter-spacing: 2px;
            }
            nav .btn-book:hover {
                background: linear-gradient(135deg, #d8b46e, #C5A059);
                transform: translateY(-2px);
                box-shadow: 0 15px 25px rgba(197, 160, 89, 0.4);
            }
            .hamburger { display: none; flex-direction: column; cursor: pointer; gap: 5px; }
            .hamburger span { width: 25px; height: 2px; background: var(--text-light); transition: background 0.3s; }

            /* Scrolled State Text/Element Colors */
            .site-header.scrolled .top-bar a,
            .site-header.scrolled .top-bar select {
                color: #666;
            }
            .site-header.scrolled nav .logo {
                color: var(--text-dark);
            }
            .site-header.scrolled nav .menu-links a { color: var(--text-dark); opacity: 0.7; }
            .site-header.scrolled nav .menu-links a:hover { color: var(--primary-gold); opacity: 1; letter-spacing: 3px; }
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
                opacity: 0; transition: opacity 2s ease-in-out, transform 10s ease-out; transform: scale(1.1);
            }
            .carousel-item.active { opacity: 1; transform: scale(1); }
            .carousel-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.8) 100%); z-index: 2; pointer-events: none; }
            
            .hero-content { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 20px; margin-top: -8vh; }
            .hero-title { 
                font-family: var(--serif-font); font-size: clamp(3rem, 8vw, 6.5rem); letter-spacing: 6px; 
                color: var(--text-light); text-transform: uppercase; margin: 0 0 20px 0; font-weight: 400; 
                text-shadow: 0 15px 30px rgba(0,0,0,0.6); 
                opacity: 0; transform: translateY(40px); animation: fadeUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            }
            .hero-subtitle { 
                font-size: clamp(1rem, 2vw, 1.4rem); font-weight: 300; letter-spacing: 5px; margin: 0 0 40px 0; 
                text-transform: uppercase; color: rgba(255,255,255,0.9); text-shadow: 0 4px 10px rgba(0,0,0,0.5);
                opacity: 0; transform: translateY(30px); animation: fadeUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards 0.3s;
            }
            .hero-content .btn-solid {
                padding: 16px 45px; background: rgba(255,255,255,0.05); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
                opacity: 0; transform: translateY(30px); animation: fadeUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards 0.6s;
            }

            @keyframes fadeUp {
                to { opacity: 1; transform: translateY(0); }
            }

            /* Floating Booking Bar */
            .booking-bar {
                position: absolute; bottom: 6%; left: 50%; transform: translateX(-50%); z-index: 10;
                background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px);
                padding: 10px; border: 1px solid rgba(255,255,255,0.2);
                display: flex; gap: 10px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); width: max-content;
                border-radius: 100px;
                opacity: 0; animation: fadeUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards 0.9s;
            }
            .booking-btn {
                background-color: transparent; color: var(--text-light); padding: 14px 30px; border: 1px solid transparent;
                font-family: var(--sans-font); font-size: 0.85em; text-transform: uppercase; letter-spacing: 2px;
                cursor: pointer; transition: all 0.4s ease; text-decoration: none; font-weight: 500; border-radius: 50px;
            }
            .booking-btn:hover { background-color: var(--primary-gold); color: #fff; box-shadow: 0 8px 25px rgba(197, 160, 89, 0.4); }

            /* Scroll Indicator */
            .scroll-indicator { position: absolute; bottom: 120px; left: 50%; transform: translateX(-50%); z-index: 10; }
            .mouse { width: 26px; height: 40px; border: 2px solid var(--text-light); border-radius: 13px; position: relative; }
            .mouse::before { content: ''; position: absolute; top: 6px; left: 50%; transform: translateX(-50%); width: 4px; height: 8px; background: var(--text-light); border-radius: 2px; animation: scrollDownAnim 1.5s infinite; }
            @keyframes scrollDownAnim { 0% { transform: translate(-50%, 0); opacity: 1; } 100% { transform: translate(-50%, 15px); opacity: 0; } }

            /* About Section - Dynamic & Aesthetic */
            #about {
                background: var(--bg-beige);
                padding: 150px 20px;
                position: relative;
                overflow: hidden;
                display: flex;
                align-items: center;
            }
            .about-decorative-circle {
                position: absolute;
                top: -10%; left: -5%;
                width: 600px; height: 600px;
                border-radius: 50%;
                border: 1px solid rgba(197, 160, 89, 0.2);
                animation: rotateSlow 40s linear infinite;
                z-index: 0;
                pointer-events: none;
            }
            .about-decorative-circle::before {
                content: ''; position: absolute;
                top: 15%; left: 0px;
                width: 20px; height: 20px;
                background: var(--primary-gold);
                border-radius: 50%;
                box-shadow: 0 0 20px rgba(197, 160, 89, 0.5);
            }
            @keyframes rotateSlow { 100% { transform: rotate(360deg); } }
            
            .about-container {
                max-width: 1200px; margin: 0 auto; display: grid;
                grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
                position: relative; z-index: 2;
            }
            .about-image-group {
                position: relative;
                height: 600px;
                perspective: 1000px;
            }
            .about-img-main {
                position: absolute; top: 0; left: 0;
                width: 80%; height: 85%;
                border-radius: 20px 0 20px 0;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                transform: rotateY(5deg) translateZ(0);
                transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
            }
            .about-img-main img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s ease; }
            .about-image-group:hover .about-img-main { transform: rotateY(0deg) translateZ(20px); }
            .about-image-group:hover .about-img-main img { transform: scale(1.08); }

            .about-img-secondary {
                position: absolute; bottom: 0; right: 0;
                width: 55%; height: 60%;
                border-radius: 0 20px 0 20px;
                overflow: hidden;
                box-shadow: 0 30px 60px rgba(0,0,0,0.25);
                border: 8px solid var(--bg-beige);
                z-index: 2;
                transform: translateZ(30px);
                transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
            }
            .about-img-secondary img { width: 100%; height: 100%; object-fit: cover; transition: transform 1s ease; }
            .about-image-group:hover .about-img-secondary { transform: translateZ(50px) translateY(-10px); }
            
            .experience-badge {
                position: absolute; top: 40%; left: -30px;
                background: var(--primary-gold);
                color: #fff;
                padding: 30px;
                border-radius: 50%;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                box-shadow: 0 15px 30px rgba(197, 160, 89, 0.4);
                z-index: 3;
                animation: floatUpDown 4s ease-in-out infinite;
                transform-style: preserve-3d;
            }
            .experience-badge .years { font-family: var(--serif-font); font-size: 2.2em; font-weight: 600; line-height: 1; }
            .experience-badge .text { font-family: var(--sans-font); font-size: 0.65em; text-transform: uppercase; letter-spacing: 2px; text-align: center; margin-top: 5px; font-weight: 500; }
            
            @keyframes floatUpDown {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }

            .about-content-wrapper { padding: 20px 0; }
            .section-subtitle { font-family: var(--sans-font); color: var(--primary-gold); text-transform: uppercase; letter-spacing: 4px; font-size: 0.85em; margin-bottom: 15px; display: inline-block; position: relative; font-weight: 600;}
            .section-subtitle::before { content: ''; position: absolute; left: -60px; top: 50%; width: 45px; height: 2px; background: var(--primary-gold); }
            
            .about-content-wrapper .section-title { font-size: 3.5em; line-height: 1.1; margin-bottom: 30px; text-transform: none; letter-spacing: 1px; }
            .about-content-wrapper .section-title::after { display: none; }
            
            .about-content { font-size: 1.05em; color: #555; line-height: 1.8; }
            .about-features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 35px 0; }
            .feature-item { display: flex; align-items: center; gap: 12px; font-family: var(--sans-font); font-weight: 500; font-size: 0.9em; color: var(--text-dark); text-transform: uppercase; letter-spacing: 1px; transition: transform 0.3s ease; }
            .feature-item:hover { transform: translateX(5px); }
            .feature-icon { color: var(--primary-gold); font-size: 1.3em; }
            
            .btn-about { display: inline-block; margin-top: 15px; border: 1px solid var(--primary-gold); color: var(--primary-gold); background: transparent; padding: 14px 35px; text-transform: uppercase; letter-spacing: 2px; text-decoration: none; transition: all 0.4s; border-radius: 2px; font-weight: 500;}
            .btn-about:hover { background: var(--primary-gold); color: #fff !important; box-shadow: 0 10px 20px rgba(197, 160, 89, 0.3); transform: translateY(-3px); }

            /* Services */
            #services {
                background: linear-gradient(to bottom, var(--bg-beige) 0%, #dcd3c5 100%);
                padding: 120px 20px;
                text-align: center;
                overflow: hidden;
                position: relative;
            }
            .maharaja-subtitle { font-family: var(--sans-font); font-size: 1em; text-transform: uppercase; letter-spacing: 4px; color: #8c7851; font-weight: 400; display: block; margin-bottom: 10px; }
            .maharaja-title { font-family: var(--serif-font); font-size: 3.5em; color: var(--text-dark); margin: 0 0 20px 0; font-weight: 600; }
            .ornate-divider { width: 150px; height: 4px; background: var(--primary-gold); margin: 0 auto 60px auto; position: relative; }
            .ornate-divider::before, .ornate-divider::after { content: ''; position: absolute; width: 10px; height: 10px; background: var(--primary-gold); top: 50%; transform: translateY(-50%) rotate(45deg); }
            .ornate-divider::before { left: -20px; }
            .ornate-divider::after { right: -20px; }
            .maharaja-services-container { display: flex; justify-content: center; align-items: center; gap: 40px; max-width: 1300px; margin: 0 auto; perspective: 1500px; }
            .maharaja-card { width: 350px; height: 450px; position: relative; transition: transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1); transform-style: preserve-3d; }
            .maharaja-card.elevated { transform: translateY(-30px); }
            .maharaja-card-inner { position: absolute; width: 100%; height: 100%; box-shadow: 0 30px 60px rgba(0,0,0,0.2); border-radius: 10px; overflow: hidden; transform: translateZ(0); transition: box-shadow 0.5s ease; }
            .maharaja-card:hover .maharaja-card-inner { box-shadow: 0 40px 80px rgba(0,0,0,0.3); }
            .maharaja-img { position: absolute; width: 100%; height: 100%; background-size: cover; background-position: center; transition: transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1); }
            .maharaja-card:hover .maharaja-img { transform: scale(1.1); }
            .maharaja-info { position: absolute; bottom: 0; left: 0; width: 100%; padding: 30px; box-sizing: border-box; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%); color: var(--text-light); text-align: left; transform: translateY(30%); transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1); }
            .maharaja-card:hover .maharaja-info { transform: translateY(0); }
            .maharaja-info h3 { font-family: var(--serif-font); font-size: 2em; margin: 0 0 10px 0; font-weight: 400; color: #fff; text-shadow: 0 2px 5px rgba(0,0,0,0.5); }
            .maharaja-info p { font-size: 0.95em; line-height: 1.6; color: rgba(255,255,255,0.8); margin: 0 0 20px 0; opacity: 0; transition: opacity 0.5s ease 0.2s; }
            .maharaja-card:hover .maharaja-info p { opacity: 1; }
            .btn-maharaja {
                display: inline-block;
                background: transparent;
                border: 1px solid var(--primary-gold);
                color: var(--primary-gold);
                padding: 10px 25px;
                text-decoration: none;
                text-transform: uppercase;
                letter-spacing: 2px;
                font-size: 0.8em;
                font-weight: 500;
                border-radius: 50px;
                opacity: 0;
                transform: translateY(10px);
                transition: all 0.5s ease 0.3s;
            }
            .maharaja-card:hover .btn-maharaja { opacity: 1; transform: translateY(0); }
            .btn-maharaja:hover { background: var(--primary-gold); color: #111; box-shadow: 0 5px 15px rgba(197, 160, 89, 0.3); }

            /* Gallery Preview */
            #gallery { background: var(--bg-warm); padding: 120px 20px; overflow: hidden; position: relative; }
            .gallery-preview-container { max-width: 1400px; margin: 0 auto; }
            .gallery-preview-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); grid-auto-rows: 250px; gap: 30px; grid-auto-flow: dense; margin-top: 50px; }
            .gallery-item { position: relative; overflow: hidden; border-radius: 4px; border: 1px solid rgba(197, 160, 89, 0.3); background: #000; cursor: none; }
            .gallery-item.tall { grid-row: span 2; }
            .gallery-item.wide { grid-column: span 2; }
            @media (max-width: 768px) { .gallery-item.wide { grid-column: span 1; } }
            .gallery-link { display: block; width: 100%; height: 100%; text-decoration: none; }

            .parallax-wrapper { width: 100%; height: 120%; position: absolute; top: -10%; left: 0; will-change: transform; }
            .gallery-item-img { width: 100%; height: 100%; background-size: cover; background-position: center; transition: transform 0.8s cubic-bezier(0.2, 1, 0.3, 1); }
            .gallery-item:hover .gallery-item-img { transform: scale(1.05); }
            
            .gallery-item-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); opacity: 0; transition: opacity 0.5s; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
            .gallery-item:hover .gallery-item-overlay { opacity: 1; }
            .gallery-item-overlay span { color: #fff; font-family: var(--serif-font); font-size: 1.8em; font-weight: 400; text-transform: uppercase; letter-spacing: 2px; transform: translateY(15px); transition: transform 0.5s; }
            .gallery-item-overlay p { color: var(--primary-gold); font-family: var(--sans-font); font-size: 0.75em; text-transform: uppercase; letter-spacing: 2px; margin-top: 10px; transform: translateY(15px); transition: transform 0.5s 0.1s; }
            .gallery-item:hover .gallery-item-overlay span, .gallery-item:hover .gallery-item-overlay p { transform: translateY(0); }
            
            .item-details { position: absolute; bottom: 15px; right: 15px; font-size: 0.65em; text-transform: uppercase; letter-spacing: 1.5px; background: rgba(0,0,0,0.7); color: #fff; padding: 6px 12px; border-radius: 2px; border: 1px solid rgba(197, 160, 89, 0.4); z-index: 2; pointer-events: none; backdrop-filter: blur(5px); opacity: 0; transform: translateY(10px); transition: all 0.5s 0.2s; }
            .gallery-item:hover .item-details { opacity: 1; transform: translateY(0); }

            .custom-cursor { position: fixed; top: 0; left: 0; width: 80px; height: 80px; border-radius: 50%; background: rgba(197, 160, 89, 0.9); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.75em; font-family: var(--sans-font); text-transform: uppercase; letter-spacing: 2px; pointer-events: none; z-index: 9999; opacity: 0; transform: translate(-50%, -50%) scale(0.2); transition: transform 0.3s cubic-bezier(0.2, 1, 0.3, 1), opacity 0.3s; }
            .custom-cursor.active { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            @media (hover: none) and (pointer: coarse) { .custom-cursor { display: none !important; } .gallery-item { cursor: pointer; } }

            /* Offers Section - Home */
            #offers { background: var(--bg-warm); padding: 120px 20px; position: relative; overflow: hidden; text-align: center; }
            .offers-container-home { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; margin-top: 50px; perspective: 1000px; }
            .offer-card-home { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.05); transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1); position: relative; display: flex; flex-direction: column; border: 1px solid rgba(197, 160, 89, 0.1); text-align: left; transform-style: preserve-3d; }
            .offer-card-home:hover { transform: translateY(-15px) rotateX(2deg); box-shadow: 0 25px 50px rgba(197, 160, 89, 0.15); border-color: rgba(197, 160, 89, 0.5); z-index: 2; }
            .offer-img-wrapper-home { overflow: hidden; position: relative; height: 220px; }
            .offer-img-home { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1); }
            .offer-card-home:hover .offer-img-home { transform: scale(1.1); }
            .offer-badge { position: absolute; top: 20px; right: -10px; background: var(--primary-gold); color: #fff; padding: 8px 20px; font-family: var(--serif-font); font-size: 1.1em; font-weight: 600; box-shadow: 0 5px 15px rgba(0,0,0,0.2); z-index: 2; animation: floatBadge 3s ease-in-out infinite; }
            @keyframes floatBadge { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
            .offer-content-home { padding: 30px; flex-grow: 1; display: flex; flex-direction: column; background: #fff; position: relative; z-index: 1; border-top: 3px solid var(--primary-gold); }
            .offer-content-home h3 { font-family: var(--serif-font); font-size: 1.5em; margin: 0 0 10px 0; color: var(--text-dark); font-weight: 600; }
            .offer-content-home p { color: #666; font-size: 0.95em; line-height: 1.6; margin-bottom: 25px; flex-grow: 1; }
            .btn-offer { display: inline-block; background: transparent; border: 1px solid var(--primary-gold); color: var(--primary-gold); padding: 12px 25px; text-transform: uppercase; letter-spacing: 2px; text-decoration: none; transition: all 0.4s; border-radius: 2px; font-weight: 500; font-size: 0.8em; text-align: center; }
            .btn-offer:hover { background: var(--primary-gold); color: #fff !important; box-shadow: 0 10px 20px rgba(197, 160, 89, 0.3); transform: translateY(-2px); }

            /* Local Attractions Section - Home */
            #attractions { background: var(--bg-beige); padding: 120px 20px; position: relative; overflow: hidden; text-align: center; }
            .attractions-container-home { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; margin-top: 50px; perspective: 1000px; }
            .attraction-card-home { position: relative; height: 420px; border-radius: 12px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.1); transition: all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1); text-align: left; }
            .attraction-card-home:hover { transform: translateY(-15px) scale(1.02); box-shadow: 0 25px 50px rgba(197, 160, 89, 0.2); z-index: 2; border: 1px solid rgba(197, 160, 89, 0.5); }
            .attraction-img-home { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; transition: transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1); }
            .attraction-card-home:hover .attraction-img-home { transform: scale(1.1); }
            .attraction-overlay-home { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%); transition: background 0.6s ease; }
            .attraction-card-home:hover .attraction-overlay-home { background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, transparent 100%); }
            .attraction-content-home { position: absolute; bottom: 0; left: 0; width: 100%; padding: 30px; box-sizing: border-box; color: #fff; transform: translateY(calc(100% - 100px)); transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1); }
            .attraction-card-home:hover .attraction-content-home { transform: translateY(0); }
            .attraction-meta-home { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-size: 0.8em; text-transform: uppercase; letter-spacing: 1.5px; opacity: 1; }
            .attraction-meta-home .category { background: var(--primary-gold); color: #fff; padding: 4px 12px; border-radius: 20px; font-weight: 500; }
            .attraction-title-home { font-family: var(--serif-font); font-size: 1.6em; margin: 0; font-weight: 600; line-height: 1.3; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
            .attraction-desc-home { font-size: 0.95em; line-height: 1.6; margin-top: 15px; color: rgba(255,255,255,0.8); opacity: 0; transition: opacity 0.5s ease 0.2s; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
            .attraction-card-home:hover .attraction-desc-home { opacity: 1; }

            /* Highlight Section - Home */
            #highlight { padding: 150px 20px; background: var(--bg-warm); position: relative; overflow: hidden; }
            .highlight-container { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; position: relative; }
            .highlight-image-wrapper { width: 60%; position: relative; border-radius: 16px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.15); transform-style: preserve-3d; }
            .highlight-image-wrapper img { width: 100%; height: 600px; object-fit: cover; transition: transform 1.5s cubic-bezier(0.2, 1, 0.3, 1); display: block; }
            .highlight-container:hover .highlight-image-wrapper img { transform: scale(1.05); }
            .highlight-badge { position: absolute; top: 40px; left: -15px; background: var(--primary-gold); color: #fff; padding: 12px 30px; font-family: var(--serif-font); font-size: 1.3em; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 10px 20px rgba(0,0,0,0.2); z-index: 3; }
            .highlight-content { width: 50%; background: #fff; padding: 60px; margin-left: -10%; position: relative; z-index: 2; border-radius: 12px; box-shadow: 0 25px 50px rgba(0,0,0,0.1); border: 1px solid rgba(197, 160, 89, 0.2); }
            .highlight-content .section-subtitle { display: block; margin-bottom: 15px; }
            .highlight-content .section-subtitle::before { display: none; }
            .highlight-content .section-title { font-size: 3em; text-transform: none; line-height: 1.2; margin-top: 0; }
            .highlight-content p { color: #555; font-size: 1.05em; line-height: 1.8; margin-bottom: 30px; }

            /* Hotel Info Section */
            #hotel-info { padding: 120px 20px; background: var(--bg-warm); }
            .hotel-info-header { text-align: center; margin-bottom: 80px; }
            .hotel-info-header .gold-line { width: 60px; height: 2px; background: var(--primary-gold); margin: 0 auto 20px; }
            .hotel-info-header h2 { font-family: var(--serif-font); font-size: 3em; text-transform: uppercase; letter-spacing: 3px; margin: 0; color: var(--text-dark); }
            
            .hotel-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 60px; max-width: 1200px; margin: 0 auto; }
            .info-column { display: flex; flex-direction: column; }
            .info-item { padding: 30px 0; border-top: 1px solid #e0e0e0; display: flex; gap: 20px; align-items: flex-start; }
            .info-column .info-item:first-child { border-top: none; padding-top: 0; }
            
            .info-icon { width: 32px; height: 32px; flex-shrink: 0; stroke: var(--primary-gold); stroke-width: 1.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
            .info-content { flex: 1; }
            .info-label { font-family: var(--sans-font); font-size: 0.75em; color: #888; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; display: block; font-weight: 500; }
            .info-value { font-size: 1.05em; color: var(--text-dark); line-height: 1.7; font-weight: 400; }
            .info-value ul { margin: 10px 0 0 0; padding-left: 20px; color: #555; font-size: 0.95em; }
            .info-value a { color: var(--text-dark); text-decoration: none; transition: color 0.3s; display: block; margin-bottom: 5px; }
            .info-value a:hover { color: var(--primary-gold); }
            .info-value a.gold-link { color: var(--primary-gold); font-weight: 500; text-transform: uppercase; font-size: 0.85em; letter-spacing: 1px; display: inline-flex; align-items: center; gap: 5px; margin-top: 15px; text-decoration: none; }
            .info-value a.gold-link:hover { color: var(--text-dark); }
            .info-gstin { margin-top: 20px; font-size: 0.85em; color: #999; font-family: monospace; letter-spacing: 1px; }

            @media (max-width: 992px) { .hotel-info-grid { grid-template-columns: repeat(2, 1fr); gap: 40px; } }
            @media (max-width: 768px) { .hotel-info-grid { grid-template-columns: 1fr; gap: 20px; } .hotel-info-header h2 { font-size: 2.2em; } .info-item { padding: 25px 0; } }

            .reveal-up { opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease-out, transform 0.5s ease-out; }
            .reveal-up.show { opacity: 1; transform: translateY(0); }

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
                .site-header { width: calc(100% - 30px); top: 15px; border-radius: 30px; }
                .hero-title { font-size: 3em; } /* This is a duplicate, but let's keep it for context */
                .booking-bar { flex-direction: column; width: 85%; border-radius: 20px; padding: 15px; bottom: 8%; }
                #about { padding: 80px 20px; }
                .about-container { grid-template-columns: 1fr; gap: 50px; }
                .about-image-group { height: 450px; max-width: 500px; margin: 0 auto; width: 100%; }
                .about-img-secondary { width: 65%; height: 55%; }
                .experience-badge { padding: 20px; left: -15px; }
                .experience-badge .years { font-size: 1.6em; }
                .section-subtitle::before { display: none; }
                .about-content-wrapper .section-title { font-size: 2.5em; }
                .about-features { grid-template-columns: 1fr; gap: 15px; }
                .maharaja-title { font-size: 2.5em; }
                .maharaja-services-container { flex-direction: column; gap: 60px; }
                .maharaja-card { width: 90%; max-width: 350px; height: 420px; }
                .maharaja-card.elevated { transform: none; }
                .top-bar { justify-content: center; padding: 12px 20px; gap: 15px; }
                .site-header.scrolled .top-bar { padding: 10px 20px; }
                nav { padding: 15px 20px; }
                .site-header.scrolled nav { padding: 15px 20px; }
                .hamburger { display: flex; }
                nav .menu { gap: 15px; }
                nav .menu-links {
                    display: none; flex-direction: column; position: absolute; top: calc(100% + 20px); left: 5%; width: 90%; background: rgba(255, 255, 255, 0.95); padding: 40px 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); gap: 25px; border-radius: 20px; box-sizing: border-box; backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.5);
                }
                nav .menu-links a { color: var(--text-dark); font-size: 1em; letter-spacing: 3px; }
                nav .menu-links.active { display: flex; }
                nav .btn-book { display: none; }
                .mobile-cta { display: block; position: fixed; bottom: 0; left: 0; width: 100%; background: var(--primary-gold); color: #fff; text-align: center; padding: 15px; font-size: 0.9em; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; text-decoration: none; z-index: 1000; box-shadow: 0 -5px 15px rgba(0,0,0,0.1); }
                .highlight-container { flex-direction: column; }
                .highlight-image-wrapper { width: 100%; }
                .highlight-image-wrapper img { height: 400px; }
                .highlight-content { width: 90%; margin-left: 0; margin-top: -60px; padding: 40px 25px; text-align: center; }
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
                        <a href="#gallery">${res.locals.t.galleryNav}</a>
                        <a href="/food">${res.locals.t.diningNav}</a>
                        <a href="/events">${res.locals.t.wellnessNav}</a>
                        <a href="#feedback">${res.locals.t.feedbackNav}</a>
                        <a href="/offers">${res.locals.t.offersNav}</a>
                        <a href="/attractions">${res.locals.t.attractionsNav}</a>
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
                <p class="hero-subtitle">${res.locals.t.heroSubtitle}</p>
                <a href="#services" class="btn-solid" style="border: 1px solid var(--primary-gold);">${res.locals.t.exploreBtn}</a>
            </div>
            
            
            <div class="scroll-indicator" style="bottom: 15%; opacity: 0; animation: fadeUp 1.2s forwards 1.2s;">
                <div class="mouse"></div>
            </div>
        </section>

        <section id="about">
            <div class="about-decorative-circle"></div>
            <div class="about-container">
                <div class="about-image-group reveal">
                    <div class="about-img-main">
                        <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80" alt="Grand Plaza Heritage">
                    </div>
                    <div class="about-img-secondary">
                        <img src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=400&q=80" alt="Luxury Details">
                    </div>
                    <div class="experience-badge">
                        <span class="years">25+</span>
                        <span class="text">Years of<br>Excellence</span>
                    </div>
                </div>
                <div class="about-content-wrapper reveal" style="transition-delay: 0.3s;">
                    <div class="section-subtitle">Since 1995</div>
                    <h2 class="section-title">${req.app.locals.siteContent.aboutTitle}</h2>
                    <div class="about-content">
                        <p>${req.app.locals.siteContent.aboutText}</p>
                        <div class="about-features">
                            <div class="feature-item"><span class="feature-icon">✦</span> Luxury Suites</div>
                            <div class="feature-item"><span class="feature-icon">✦</span> Fine Dining</div>
                            <div class="feature-item"><span class="feature-icon">✦</span> Spa & Wellness</div>
                            <div class="feature-item"><span class="feature-icon">✦</span> Event Venues</div>
                        </div>
                        <a href="#services" class="btn-about">Discover Our Philosophy</a>
                    </div>
                </div>
            </div>
        </section>

        <section id="services">
            <div style="text-align:center;">
                <span class="maharaja-subtitle reveal">Step into a world of grandeur</span>
                <h2 class="maharaja-title reveal">Royal Experiences</h2>
                <div class="ornate-divider reveal"></div>
            </div>
            <div class="maharaja-services-container">
                <div class="maharaja-card reveal">
                    <div class="maharaja-card-inner">
                        <div class="maharaja-img" style="background-image: url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80');"></div>
                        <div class="maharaja-info">
                            <h3>Imperial Suites</h3>
                            <p>Rest in palatial chambers designed for royalty.</p>
                            <a href="/hotels" class="btn-maharaja">Explore</a>
                        </div>
                    </div>
                </div>
                <div class="maharaja-card elevated reveal" style="transition-delay: 0.2s;">
                    <div class="maharaja-card-inner">
                        <div class="maharaja-img" style="background-image: url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80');"></div>
                        <div class="maharaja-info">
                            <h3>Darbar Dining</h3>
                            <p>Savor royal feasts crafted by master chefs.</p>
                            <a href="/food" class="btn-maharaja">Indulge</a>
                        </div>
                    </div>
                </div>
                <div class="maharaja-card reveal" style="transition-delay: 0.4s;">
                    <div class="maharaja-card-inner">
                        <div class="maharaja-img" style="background-image: url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXA3Pe3myHVUTpi4j2UM2Ba7WafIIIbUBhsw&s');"></div>
                        <div class="maharaja-info">
                            <h3>Grand Events</h3>
                            <p>Host majestic events in our grand courtyards.</p>
                            <a href="/events" class="btn-maharaja">Reserve</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        ${req.app.locals.highlights.length > 0 ? `
        <section id="highlight">
            ${req.app.locals.highlights.map((hl, idx) => `
            <div class="highlight-container" style="margin-bottom: ${idx < req.app.locals.highlights.length - 1 ? '100px' : '0'};">
                <div class="highlight-image-wrapper reveal">
                    <img src="${hl.image}" alt="${hl.title}">
                    ${hl.badge ? `<div class="highlight-badge">${hl.badge}</div>` : ''}
                </div>
                <div class="highlight-content reveal" style="transition-delay: 0.3s;">
                    ${hl.subtitle ? `<span class="section-subtitle">${hl.subtitle}</span>` : ''}
                    <h2 class="section-title" style="margin-bottom: 20px;">${hl.title}</h2>
                    <p>${hl.text}</p>
                    ${hl.buttonText ? `<a href="${hl.buttonLink || '#'}" class="btn-solid" style="border: 1px solid var(--primary-gold); color: var(--primary-gold);">${hl.buttonText}</a>` : ''}
                </div>
            </div>
            `).join('')}
        </section>

        
        ` : ''}

        <section id="offers">
            <div style="text-align:center;">
                <span class="section-subtitle reveal">Exclusive Privileges</span>
                <h2 class="section-title reveal" style="text-transform: none; letter-spacing: 1px; font-size: 3.5em; margin-bottom: 20px;">Featured Offers</h2>
                <div class="ornate-divider reveal"></div>
            </div>
            <div class="offers-container-home">
                <div class="offer-card-home reveal" style="transition-delay: 0.1s;">
                    <div class="offer-img-wrapper-home">
                        <img src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80" alt="Staycation" class="offer-img-home">
                        <div class="offer-badge">20% OFF</div>
                    </div>
                    <div class="offer-content-home">
                        <h3>Weekend Staycation</h3>
                        <p>Enjoy a luxurious weekend with complimentary breakfast and spa access.</p>
                        <a href="/offers" class="btn-offer">Claim Offer</a>
                    </div>
                </div>
                <div class="offer-card-home reveal" style="transition-delay: 0.3s;">
                    <div class="offer-img-wrapper-home">
                        <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80" alt="Dining" class="offer-img-home">
                        <div class="offer-badge">15% OFF</div>
                    </div>
                    <div class="offer-content-home">
                        <h3>Fine Dining Experience</h3>
                        <p>Experience culinary excellence with a discount on our tasting menu.</p>
                        <a href="/offers" class="btn-offer">Claim Offer</a>
                    </div>
                </div>
                <div class="offer-card-home reveal" style="transition-delay: 0.5s;">
                    <div class="offer-img-wrapper-home">
                        <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80" alt="Spa" class="offer-img-home">
                        <div class="offer-badge">Buy 1 Get 1</div>
                    </div>
                    <div class="offer-content-home">
                        <h3>Holistic Spa Retreat</h3>
                        <p>Rejuvenate your senses with our signature spa therapies.</p>
                        <a href="/offers" class="btn-offer">Claim Offer</a>
                    </div>
                </div>
            </div>
            <div class="reveal" style="text-align: center; margin-top: 50px;">
                <a href="/offers" class="btn-solid" style="border: 1px solid var(--primary-gold); color: var(--primary-gold);">View All Offers</a>
            </div>
        </section>

        <section id="gallery">
            <div class="custom-cursor">View</div>
            <div style="text-align:center;">
                <span class="maharaja-subtitle reveal">A Glimpse of Grandeur</span>
                <h2 class="maharaja-title reveal">The Curated Canvas</h2>
                <div class="ornate-divider reveal"></div>
            </div>
            <div class="gallery-preview-container">
                <div class="gallery-preview-grid">
                    <div class="gallery-item wide reveal" style="transition-delay: 0ms;">
                        <a href="/gallery" class="gallery-link">
                            <div class="parallax-wrapper" data-speed="0.05"><div class="gallery-item-img" style="background-image: url('https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80');"></div></div>
                            <div class="gallery-item-overlay"><span>The Presidential Suite</span><p>Rooms</p></div>
                            <div class="item-details">1200 sq. ft. | Ocean View</div>
                        </a>
                    </div>
                    <div class="gallery-item tall reveal" style="transition-delay: 100ms;">
                        <a href="/gallery" class="gallery-link">
                            <div class="parallax-wrapper" data-speed="0.06"><div class="gallery-item-img" style="background-image: url('https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=800&q=80');"></div></div>
                            <div class="gallery-item-overlay"><span>Himalayan View Pool</span><p>Spa</p></div>
                            <div class="item-details">Infinity Edge | Heated</div>
                        </a>
                    </div>
                    <div class="gallery-item reveal" style="transition-delay: 200ms;">
                        <a href="/gallery" class="gallery-link">
                            <div class="parallax-wrapper" data-speed="0.04"><div class="gallery-item-img" style="background-image: url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80');"></div></div>
                            <div class="gallery-item-overlay"><span>Lobby Lounge</span><p>Dining</p></div>
                            <div class="item-details">24/7 Service</div>
                        </a>
                    </div>
                    <div class="gallery-item reveal" style="transition-delay: 300ms;">
                        <a href="/gallery" class="gallery-link">
                            <div class="parallax-wrapper" data-speed="0.07"><div class="gallery-item-img" style="background-image: url('https://images.unsplash.com/photo-1598539924402-54c114474f85?auto=format&fit=crop&w=800&q=80');"></div></div>
                            <div class="gallery-item-overlay"><span>Rejuvenation Spa</span><p>Spa</p></div>
                            <div class="item-details">Holistic Therapies</div>
                        </a>
                    </div>
                </div>
                <div class="reveal" style="text-align: center; margin-top: 50px;">
                    <a href="/gallery" class="btn-solid" style="border: 1px solid var(--primary-gold); color: var(--text-dark);">View Full Gallery</a>
                </div>
            </div>
        </section>

        <section id="attractions">
            <div style="text-align:center;">
                <span class="maharaja-subtitle reveal">Explore The Surroundings</span>
                <h2 class="maharaja-title reveal">Local Attractions</h2>
                <div class="ornate-divider reveal"></div>
            </div>
            <div class="attractions-container-home">
                <div class="attraction-card-home reveal" style="transition-delay: 0.1s;">
                    <div class="attraction-img-home" style="background-image: url('https://images.unsplash.com/photo-1599539831213-f4c397435736?auto=format&fit=crop&w=800&q=80')"></div>
                    <div class="attraction-overlay-home"></div>
                    <div class="attraction-content-home">
                        <div class="attraction-meta-home">
                            <span class="category">Historic</span>
                            <span>5 km away</span>
                        </div>
                        <h3 class="attraction-title-home">City Palace</h3>
                        <p class="attraction-desc-home">A stunning complex of palaces, courtyards and gardens, built over a period of nearly 400 years, giving a panoramic view of the city.</p>
                    </div>
                </div>
                <div class="attraction-card-home reveal" style="transition-delay: 0.3s;">
                    <div class="attraction-img-home" style="background-image: url('https://images.unsplash.com/photo-1617634667339-150432790b6a?auto=format&fit=crop&w=800&q=80')"></div>
                    <div class="attraction-overlay-home"></div>
                    <div class="attraction-content-home">
                        <div class="attraction-meta-home">
                            <span class="category">Nature</span>
                            <span>3 km away</span>
                        </div>
                        <h3 class="attraction-title-home">Lake Pichola</h3>
                        <p class="attraction-desc-home">An artificial fresh water lake, created in the year 1362 AD, it is one of the several contiguous lakes in the famous Udaipur city.</p>
                    </div>
                </div>
                <div class="attraction-card-home reveal" style="transition-delay: 0.5s;">
                    <div class="attraction-img-home" style="background-image: url('https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80')"></div>
                    <div class="attraction-overlay-home"></div>
                    <div class="attraction-content-home">
                        <div class="attraction-meta-home">
                            <span class="category">Museum</span>
                            <span>7 km away</span>
                        </div>
                        <h3 class="attraction-title-home">Vintage Car Museum</h3>
                        <p class="attraction-desc-home">A collection of classic and vintage cars owned by the royalty of Mewar, showcasing a rich automotive heritage in a luxurious setting.</p>
                    </div>
                </div>
            </div>
            <div class="reveal" style="text-align: center; margin-top: 50px;">
                <a href="/attractions" class="btn-solid" style="border: 1px solid var(--primary-gold); color: var(--primary-gold);">View All Attractions</a>
            </div>
        </section>

        <section id="feedback">
            <div class="feedback-header-wrapper">
                <div class="live-indicator"><span class="pulse-dot"></span> Live from our guests</div>
                <h2 class="section-title reveal">${req.app.locals.siteContent.feedbackTitle}</h2>
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
                    background: linear-gradient(135deg, #852929 0%, #eee9e9 100%);
                    background: radial-gradient(circle at center, rgba(241, 237, 237, 0.9) 0%, rgb(234, 226, 226) 100%);
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
                    color: #060101;
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
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.2);
                    background: rgba(20, 20, 20, 0.5);
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px 0 rgba(0,0,0,0.3);
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
                    box-shadow: 0 15px 40px rgba(0,0,0,0.5);
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
                    border: 2px solid var(--primary-gold);
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
                    background: linear-gradient(45deg, #d4af37, #c5a028);
                    color: #000;
                    border: none;
                    padding: 15px 35px;
                    font-size: 1em;
                    font-family: var(--sans-font);
                    text-transform: uppercase;
                    letter-spacing: 2px;
                    border-radius: 30px;
                    border-radius: 4px;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
                    font-weight: 600;
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
                    background: linear-gradient(45deg, #edc967, #d4af37);
                    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
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
                    background: rgba(0,0,0,0.4) !important;
                    border: 1px solid rgba(184, 134, 11, 0.4) !important;
                    color: white !important;
                    font-family: var(--sans-font);
                    font-size: 0.9em;
                    border-radius: 8px;
                    transition: border-color 0.3s ease;
                    backdrop-filter: blur(5px);
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                }
                .feedback-form input:focus, .feedback-form textarea:focus {
                    outline: none; border-color: var(--primary-gold);
                    outline: none; 
                    border-color: #d4af37 !important;
                    box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
                }
                .feedback-form button {
                    padding: 15px; background: var(--primary-gold); color: white; border: none; font-weight: 500; cursor: pointer; text-transform: uppercase; letter-spacing: 2px; transition: 0.3s; font-family: var(--sans-font); border-radius: 8px;
                    padding: 15px; background: linear-gradient(45deg, #d4af37, #c5a028); color: #000; border: none; font-weight: 600; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; transition: 0.3s; font-family: var(--sans-font); border-radius: 4px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);
                }
                .feedback-form button:hover { background: #9c8040; }
                .feedback-form button:hover { 
                    background: linear-gradient(45deg, #edc967, #d4af37);
                    box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4); 
                    transform: translateY(-2px); 
                }
            </style>
        </section>
        <section id="hotel-info">
            <div class="hotel-info-header reveal-up">
                <div class="gold-line"></div>
                <h2>Essential Information</h2>
            </div>
            <div class="hotel-info-grid">
                <!-- Column 1: Logistics -->
                <div class="info-column reveal-up" style="transition-delay: 0.1s;">
                    <div class="info-item">
                        <svg class="info-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <div class="info-content">
                            <span class="info-label">Check In – Check Out</span>
                            <div class="info-value">14:00 HRS – 12:00 HRS</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <svg class="info-icon" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        <div class="info-content">
                            <span class="info-label">Accommodation</span>
                            <div class="info-value">120 Rooms & Suites</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <svg class="info-icon" viewBox="0 0 24 24"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path></svg>
                        <div class="info-content">
                            <span class="info-label">Current Weather</span>
                            <div class="info-value">18.63°C <span style="color: #888; font-size: 0.85em; margin-left: 5px;">(Live)</span></div>
                        </div>
                    </div>
                </div>

                <!-- Column 2: Experience -->
                <div class="info-column reveal-up" style="transition-delay: 0.2s;">
                    <div class="info-item">
                        <svg class="info-icon" viewBox="0 0 24 24"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>
                        <div class="info-content">
                            <span class="info-label">Dining</span>
                            <div class="info-value">
                                The Grand Darbar (Multi-Cuisine)<br>
                                Oasis Lounge & Bar
                            </div>
                        </div>
                    </div>
                    <div class="info-item">
                        <svg class="info-icon" viewBox="0 0 24 24"><path d="M12 2.69l5.66 4.2c1.83 1.36 2.84 3.52 2.84 5.81 0 4.58-3.8 8.3-8.5 8.3S3.5 17.28 3.5 12.7c0-2.29 1.01-4.45 2.84-5.81L12 2.69z"></path></svg>
                        <div class="info-content">
                            <span class="info-label">Wellness</span>
                            <div class="info-value">Rejuvenation Spa, Infinity Edge Pool, 24/7 Fitness Center</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <svg class="info-icon" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                        <div class="info-content">
                            <span class="info-label">Notice / Medical</span>
                            <div class="info-value">
                                <ul>
                                    <li>On-call doctor available 24/7</li>
                                    <li>Nearest hospital is 5km away</li>
                                    <li>First-aid kits available at reception</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Column 3: Communication -->
                <div class="info-column reveal-up" style="transition-delay: 0.3s;">
                    <div class="info-item">
                        <svg class="info-icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <div class="info-content">
                            <span class="info-label">Address</span>
                            <div class="info-value">
                                123 Luxury Avenue,<br>
                                Heritage District, City 40001<br>
                                <a href="https://maps.google.com" target="_blank" class="gold-link">View Map <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg></a>
                            </div>
                        </div>
                    </div>
                    <div class="info-item">
                        <svg class="info-icon" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        <div class="info-content">
                            <span class="info-label">Contact</span>
                            <div class="info-value">
                                <a href="mailto:reservations@grandplaza.com">reservations@grandplaza.com</a>
                                <a href="tel:+919876543210">+91 98765 43210 (Reservations)</a>
                                <a href="tel:+911122334455">+91 11 2233 4455 (Front Desk)</a>
                                <div class="info-gstin">GSTIN: 22AAAAA0000A1Z5</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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

                // Soft Reveal Animation
                const observer = new IntersectionObserver((entries) => {
                  entries.forEach(entry => {
                    if (entry.isIntersecting) {
                      entry.target.classList.add('show');
                    }
                  });
                });
                document.querySelectorAll('.reveal, .reveal-up').forEach((el) => observer.observe(el));

                // Gallery Parallax & Cursor
                const cursor = document.querySelector('#gallery .custom-cursor');
                const galleryItems = document.querySelectorAll('#gallery .gallery-item');
                if(cursor && galleryItems.length > 0) {
                    document.addEventListener('mousemove', e => {
                        cursor.style.left = e.clientX + 'px';
                        cursor.style.top = e.clientY + 'px';
                    });
                    galleryItems.forEach(item => {
                        item.addEventListener('mouseenter', () => cursor.classList.add('active'));
                        item.addEventListener('mouseleave', () => cursor.classList.remove('active'));
                    });
                }
                window.addEventListener('scroll', () => {
                    document.querySelectorAll('#gallery .parallax-wrapper').forEach(wrapper => {
                        const rect = wrapper.parentElement.getBoundingClientRect();
                        if(rect.top < window.innerHeight && rect.bottom > 0) {
                            const speed = parseFloat(wrapper.dataset.speed) || 0.05;
                            const yPos = (window.innerHeight - rect.top) * speed - 25; // Move image down as it scrolls up
                            wrapper.style.transform = \`translateY(\${yPos}px)\`;
                        }
                    });
                });
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

    // Generate Highlights HTML
    const highlightsAdminHtml = req.app.locals.highlights.length > 0 ? req.app.locals.highlights.map(hl => `
        <div class="card" style="border-left: 5px solid #d4af37; margin-bottom: 15px; display: flex; gap: 20px; align-items: center; padding: 20px;">
            <img src="${hl.image}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
            <div style="flex-grow: 1;">
                <h3 style="margin: 0; color: #fff; font-size: 1.1em;">${hl.title} ${hl.badge ? `<span style="background: var(--primary-gold); color: #000; padding: 2px 8px; border-radius: 4px; font-size: 0.6em; vertical-align: middle; margin-left: 10px;">${hl.badge}</span>` : ''}</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.85em; opacity: 0.8;">${hl.subtitle}</p>
            </div>
            <form action="/admin/highlight/delete" method="POST" style="margin: 0;">
                <input type="hidden" name="id" value="${hl.id}">
                <button type="submit" class="btn btn-danger" style="padding: 8px 15px; font-size: 0.8em;" onclick="return confirm('Delete this highlight?')">Delete</button>
            </form>
        </div>
    `).join('') : '<p style="color: #bbb;">No highlights added yet.</p>';

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
                <a href="/gallery/admin">🖼️ Gallery</a>
                <a href="/offers/admin">🎁 Offers</a>
                <a href="/attractions/admin">📍 Attractions</a>
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

                <div class="card-header-floating" style="margin-top: 30px;">Digital Concierge Content</div>
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

            <h2 class="section-title">Manage Property Profile</h2>
            <div class="card">
                <div class="card-header-floating">Property Essentials</div>
                <form action="/admin/update-hotel-info" method="POST">
                    <div class="grid-container" style="gap: 20px;">
                        <div>
                            <label>Title</label>
                            <input type="text" name="title" value="${req.app.locals.hotelInfo.title}">
                        </div>
                        <div>
                            <label>Subtitle</label>
                            <input type="text" name="subtitle" value="${req.app.locals.hotelInfo.subtitle}">
                        </div>
                        <div style="grid-column: span 2;"><label>Image URL</label><input type="text" name="image" value="${req.app.locals.hotelInfo.image}"></div>
                        <div style="grid-column: span 2;"><label>Description</label><textarea name="description" rows="4" style="width:100%;">${req.app.locals.hotelInfo.description}</textarea></div>
                        <div style="grid-column: span 2;">
                            <label>Features (one per line)</label>
                            <textarea name="features" rows="6" style="width:100%;">${req.app.locals.hotelInfo.features.join('\n')}</textarea>
                        </div>
                    </div>
                    <button type="submit" class="btn" style="margin-top: 20px; float: right;">Update Information</button>
                </form>
            </div>

            <h2 class="section-title">Manage Signature Experiences</h2>
            <div class="card" style="margin-bottom: 30px;">
                <div class="card-header-floating">Add New Signature Experience</div>
                <form action="/admin/highlight/add" method="POST" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div><label>Title</label><input type="text" name="title" required style="width: 100%;"></div>
                    <div><label>Subtitle</label><input type="text" name="subtitle" style="width: 100%;"></div>
                    <div><label>Badge Text</label><input type="text" name="badge" placeholder="e.g. Signature" style="width: 100%;"></div>
                    <div><label>Image URL</label><input type="text" name="image" required style="width: 100%;"></div>
                    <div style="grid-column: span 2;"><label>Description</label><textarea name="text" rows="3" required style="width: 100%;"></textarea></div>
                    <div><label>Button Text</label><input type="text" name="buttonText" placeholder="e.g. Experience More" style="width: 100%;"></div>
                    <div><label>Button Link</label><input type="text" name="buttonLink" placeholder="e.g. /gallery" style="width: 100%;"></div>
                    <div style="grid-column: span 2; text-align: right;"><button type="submit" class="btn btn-success">Add Highlight</button></div>
                </form>
            </div>
            <div class="feedback-list" style="margin-bottom: 40px;">
                ${highlightsAdminHtml}
            </div>
            
            <h2 class="section-title">Guest Sentiment & Feedback</h2>
            <div class="feedback-list">
                ${feedbackHtml}
            </div>
            
            <h2 class="section-title">Elite Membership Directory</h2>
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
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        body{font-family:'Poppins',sans-serif; margin:0; display:flex; background: transparent !important; color: #fff; min-height: 100vh;} 
        .video-bg-container { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background: #050505; overflow: hidden; }
        .video-bg-container video { width: 100%; height: 100%; object-fit: cover; opacity: 0.35; filter: contrast(1.2) brightness(0.6) saturate(1.1); animation: slowPan 30s linear infinite alternate; }
        .video-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at center, rgba(10,11,16,0.6) 0%, rgba(5,6,10,0.95) 100%); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); }
        .video-overlay::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(212,175,55,0.08) 0%, transparent 50%, rgba(212,175,55,0.02) 100%); mix-blend-mode: color-dodge; pointer-events: none; }
        @keyframes slowPan { 0% { transform: scale(1); } 100% { transform: scale(1.05); } }
        
        .sidebar { width: 280px; color: #ecf0f1; display: flex; flex-direction: column; padding: 30px 20px; z-index: 100; flex-shrink: 0; background: rgba(10, 11, 16, 0.8); backdrop-filter: blur(25px); border-right: 1px solid rgba(255,255,255,0.05); box-shadow: 8px 0 30px rgba(0,0,0,0.8); }
        .sidebar-header { font-family: 'Playfair Display', serif; font-size: 1.8em; margin-bottom: 50px; text-align: center; color: #d4af37; text-transform: uppercase; letter-spacing: 3px; position: relative; text-shadow: 0 0 20px rgba(212,175,55,0.3); }
        .sidebar-header::after { content: ''; display: block; width: 50px; height: 2px; background: linear-gradient(90deg, transparent, #d4af37, transparent); margin: 20px auto 0; }
        .sidebar-header span { font-size: 0.35em; color: rgba(255,255,255,0.5); letter-spacing: 5px; display: block; margin-top: 10px; font-family: 'Poppins', sans-serif; }
        .nav-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .nav-links a { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; color: rgba(255,255,255,0.5); text-decoration: none; border-radius: 12px; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); font-weight: 500; font-size: 0.9em; border-left: 0px solid transparent; background: transparent; position: relative; overflow: hidden; }
        .nav-links a::before { content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 4px; background: linear-gradient(180deg, #d4af37, #b58d22); transform: scaleY(0); transition: transform 0.3s ease; transform-origin: center; border-radius: 0 4px 4px 0; }
        .nav-links a:hover { color: #fff; background: rgba(255,255,255,0.03); transform: translateX(5px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        .nav-links a.active { color: #d4af37; background: linear-gradient(90deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%); padding-left: 25px; text-shadow: 0 0 10px rgba(212,175,55,0.2); box-shadow: inset 0 0 20px rgba(212,175,55,0.05); border-radius: 8px; }
        .nav-links a.active::before { transform: scaleY(1); }
        .nav-links a span.nav-text { display: flex; align-items: center; gap: 12px; }
        .nav-links a span.nav-text i { font-style: normal; font-size: 1.2em; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); transition: transform 0.3s ease; }
        .nav-links a:hover span.nav-text i { transform: translateY(-3px) scale(1.1); }
        .pulse-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; background: #d4af37; color: #000; border-radius: 10px; font-size: 0.75em; font-weight: 700; box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.7); animation: pulse-gold 2s infinite cubic-bezier(0.66, 0, 0, 1); }
        
        .main{flex:1;padding:40px;overflow-y:auto; scroll-behavior: smooth; } 
        .card{background: rgba(15, 17, 26, 0.7) !important; backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.05) !important; box-shadow: 0 8px 32px 0 rgba(0,0,0,0.6) !important; padding:30px; margin-bottom:20px; border-radius:16px; position: relative; overflow: hidden; transition: transform 0.4s, box-shadow 0.4s; }
        .card::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent); opacity: 0.3; transition: opacity 0.4s; }
        .card:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.1) !important; border-color: rgba(212,175,55,0.2) !important; }
        .card:hover::before { opacity: 1; }
        label{font-size:0.8em; color:#bbb; font-weight:bold; display:block;} 
        input, select{width:100%; padding:14px; margin-top:5px; box-sizing:border-box; border-radius:8px; background: rgba(5, 5, 5, 0.6) !important; border: 1px solid rgba(255, 255, 255, 0.05) !important; color: white !important; backdrop-filter: blur(10px); box-shadow: inset 0 3px 6px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) !important; transition: all 0.3s ease; } 
        input:focus, select:focus { border-color: rgba(212, 175, 55, 0.6) !important; outline: none; box-shadow: inset 0 3px 6px rgba(0,0,0,0.8), 0 0 15px rgba(212, 175, 55, 0.2) !important; background: rgba(10, 10, 10, 0.8) !important; }
        input[readonly] { opacity: 0.8; }
        button{padding:12px 24px;border:none;border-radius:6px;cursor:pointer;color:#050505;background:linear-gradient(135deg, #d4af37, #b58d22);font-weight:600;text-transform:uppercase;letter-spacing:1px;transition:0.3s ease;} 
        button:hover { background: linear-gradient(135deg, #edc967, #d4af37); box-shadow: 0 8px 25px rgba(212, 175, 55, 0.5); transform: translateY(-2px); }
        .btn-danger{background:#be123c; color:#fff;} 
        .btn-danger:hover { background:#e11d48; box-shadow: 0 8px 25px rgba(225, 29, 72, 0.5); }
        .history-grid{display:grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap:20px;}
    </style>
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
                <a href="/admin"><span class="nav-text"><i>📊</i> Dashboard Overview</span></a>
                <a href="/food/admin"><span class="nav-text"><i>🍽️</i> Culinary Requests</span> ${counts.food > 0 ? `<span class="pulse-badge">${counts.food}</span>` : ''}</a>
                <a href="/hotels/admin"><span class="nav-text"><i>🏨</i> Guest Reservations</span> ${counts.hotel > 0 ? `<span class="pulse-badge">${counts.hotel}</span>` : ''}</a>
                <a href="/events/admin"><span class="nav-text"><i>📅</i> Event & Dining Logs</span> ${counts.event > 0 ? `<span class="pulse-badge">${counts.event}</span>` : ''}</a>
                <a href="/admin/history" class="active"><span class="nav-text"><i>📜</i> Order History</span></a>
                <a href="/gallery/admin"><span class="nav-text"><i>🖼️</i> Media Assets Manager</span></a>
                <a href="/offers/admin"><span class="nav-text"><i>🎁</i> Campaign Management</span></a>
                <a href="/attractions/admin"><span class="nav-text"><i>📍</i> Local Experiences</span></a>
                <a href="/" target="_blank" style="margin-top: 40px; border: 1px solid rgba(255,255,255,0.1); justify-content: center;"><span class="nav-text"><i>👀</i> View Guest Site</span></a>
            </div>
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

app.post('/admin/highlight/add', (req, res) => {
    const id = Date.now().toString();
    req.app.locals.highlights.push({ id, ...req.body });
    res.redirect('/admin');
});

app.post('/admin/highlight/delete', (req, res) => {
    const { id } = req.body;
    req.app.locals.highlights = req.app.locals.highlights.filter(h => h.id !== id);
    res.redirect('/admin');
});

app.post('/admin/update-hotel-info', (req, res) => {
    const { title, subtitle, description, image, features } = req.body;
    
    const featuresArray = features.split('\n').map(f => f.trim()).filter(f => f);

    req.app.locals.hotelInfo = {
        title,
        subtitle,
        description,
        image,
        features: featuresArray
    };
    
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
app.use("/gallery",galleryRouter);
app.use("/offers",offersRouter);
app.use("/attractions", attractionsRouter);

const server=http.createServer(app);
server.listen(4000,()=>console.log("Server is running on port 4000"));