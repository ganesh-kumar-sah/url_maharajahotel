const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Mock Data for Restaurant Tables
let tables = [
    { id: 1, name: 'Romantic Dinner (2 Pax)', date: '2024-11-15', price: 20, image: 'https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?auto=format&fit=crop&w=800&q=80' },
    { id: 2, name: 'Family Booth (6 Pax)', date: '2024-12-20', price: 50, image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80' },
    { id: 3, name: 'VIP Private Room', date: '2024-10-05', price: 100, image: 'https://images.unsplash.com/photo-1522336572468-97b06e8ef143?auto=format&fit=crop&w=800&q=80' }
];

const bookingsFile = path.join(__dirname, 'bookings.json');

// Helper for HTML with Styles (Live Background & Animations)
const renderPage = (content, isGuest = true, theme = 'default', counts = { food: 0, hotel: 0, event: 0 }, siteContent = null) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isGuest ? 'Restaurant Table Booking' : 'Admin: Manage Tables'}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0; font-family: 'Poppins', sans-serif;
            transition: background-color 0.3s, color 0.3s;
        }
        .container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 40px; box-sizing: border-box; width: 100%; }

        /* Admin Styles */
        :root { 
            --bg-dark: #121212; --card-dark: #1e1e1e; --text-dark: #e0e0e0; --accent-dark: #d4af37;
            --bg-light: #f5f5f5; --card-light: #ffffff; --text-light: #333333; --accent-light: #2c3e50;
            --bg-blue: #0f172a; --card-blue: #1e293b; --text-blue: #f8fafc; --accent-blue: #38bdf8;
        }
        
        /* Dynamic Live Video Background & Glassmorphism */
        body.admin { display: flex; min-height: 100vh; background: transparent !important; color: #fff; }
        .video-bg-container { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; background: #050505; overflow: hidden; }
        .video-bg-container video { width: 100%; height: 100%; object-fit: cover; opacity: 0.65; filter: contrast(1.15) brightness(0.85) saturate(1.1); animation: slowPan 30s linear infinite alternate; }
        .video-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at center, rgba(15,15,15,0.6) 0%, rgba(0,0,0,0.9) 100%); }
        .video-overlay::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(212,175,55,0.15) 0%, transparent 50%, rgba(212,175,55,0.05) 100%); mix-blend-mode: color-dodge; pointer-events: none; }
        @keyframes slowPan { 0% { transform: scale(1); } 100% { transform: scale(1.05); } }
        
        .admin .header { display: flex; justify-content: space-between; align-items: center; padding: 25px 40px; margin-bottom: 30px; border-radius: 16px; background: rgba(20,20,20,0.5); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 32px 0 rgba(0,0,0,0.3); }
        .admin .header h1 { font-size: 1.8em; font-weight: 600; margin: 0; }
        
        .admin h2 { font-size: 1.5em; font-weight: 500; margin: 40px 0 20px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.2) !important; color: #d4af37; }
        
        .admin h1, .admin h2, .admin h3 { font-family: 'Playfair Display', serif; letter-spacing: 0.5px; }

        .admin .card { border-radius: 16px; padding: 30px; margin-bottom: 25px; transition: all 0.3s; background: rgba(20, 20, 20, 0.5) !important; backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1) !important; box-shadow: 0 8px 32px 0 rgba(0,0,0,0.3) !important; color: white; }
        .admin .card:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(0,0,0,0.5) !important; }

        .admin button, .admin .btn { border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.85em; transition: 0.3s; text-decoration: none; display: inline-block; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
        .dark .btn, .dark button { background: linear-gradient(45deg, #d4af37, #c5a028); color: #000; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2); } 
        .dark .btn:hover, .dark button:hover { background: linear-gradient(45deg, #edc967, #d4af37); box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4); transform: translateY(-1px); }
        
        .light .btn, .light button { background-color: var(--accent-light); color: white; } 
        .blue .btn, .blue button { background-color: var(--accent-blue); color: white; }
        
        .admin .btn-secondary { background-color: #6b7280 !important; color: white !important; }
        .admin .btn-danger { background-color: #ef4444 !important; color: white !important; }
        .admin .btn-success { background-color: #22c55e !important; color: white !important; }
        .admin input, .admin select, .admin textarea { width: 100%; padding: 12px; margin: 8px 0 16px; box-sizing: border-box; border-radius: 8px; font-size: 1em; font-family: 'Poppins', sans-serif; background: rgba(0,0,0,0.4) !important; border: 1px solid rgba(184, 134, 11, 0.4) !important; color: white !important; backdrop-filter: blur(5px); transition: 0.3s; }
        .admin input:focus, .admin select:focus, .admin textarea:focus { border-color: #d4af37 !important; outline: none; box-shadow: 0 0 10px rgba(212, 175, 55, 0.3); }
        .admin label { font-weight: 500; font-size: 0.9em; margin-bottom: 4px; display: block; color: #ccc; }

        /* Sidebar Styles for Admin */
        .sidebar { width: 260px; color: #ecf0f1; display: flex; flex-direction: column; padding: 30px 20px; z-index: 100; flex-shrink: 0; background: rgba(10, 10, 10, 0.65); backdrop-filter: blur(20px); border-right: 1px solid rgba(255,255,255,0.1); box-shadow: 5px 0 30px rgba(0,0,0,0.5); }
        .sidebar-header { font-family: 'Playfair Display', serif; font-size: 1.6em; margin-bottom: 50px; text-align: center; color: #d4af37; text-transform: uppercase; letter-spacing: 2px; position: relative; }
        .sidebar-header::after { content: ''; display: block; width: 40px; height: 2px; background: #d4af37; margin: 15px auto 0; }
        .sidebar-header span { font-size: 0.4em; color: #777; letter-spacing: 4px; display: block; margin-top: 8px; font-family: 'Poppins', sans-serif; }
        .nav-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 15px; }
        .nav-links a { display: flex; align-items: center; padding: 15px 20px; color: rgba(255,255,255,0.6); text-decoration: none; border-radius: 8px; transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); font-weight: 500; font-size: 0.95em; border-left: 3px solid transparent; background: linear-gradient(90deg, transparent 0%, transparent 100%); }
        .nav-links a:hover, .nav-links a.active { color: #fff; background: linear-gradient(90deg, rgba(212, 175, 55, 0.15) 0%, transparent 100%); border-left: 3px solid #d4af37; padding-left: 28px; transform: translateX(5px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
        .main-content-wrapper { flex-grow: 1; height: 100vh; overflow-y: auto; background: inherit; }
        .badge { background: #e74c3c; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.75em; margin-left: 8px; vertical-align: middle; font-weight: bold; }
        /* Override container for admin */
        body.admin .container { max-width: 100%; padding: 40px; }

        /* Guest Styles */
        :root {
            --primary-gold: #C5A059;
            --text-dark: #2C2C2C;
            --text-light: #FAF9F6;
            --bg-warm: #f9f7f2;
            --bg-beige: #ebe4d6;
            --serif-font: 'Playfair Display', serif;
            --sans-font: 'Montserrat', sans-serif;
        }
        h1, h2, h3, h4, h5, h6 { font-family: var(--serif-font); }
        .guest { background: var(--bg-warm); color: var(--text-dark); font-family: var(--sans-font); }
        .guest .header { text-align: center; margin-bottom: 40px; border-bottom: 1px solid var(--primary-gold); padding-bottom: 20px; }
        .guest .header h1 { font-weight: 300; font-size: 2.5em; color: var(--text-dark); margin: 0 0 15px 0; font-family: var(--serif-font); text-transform: uppercase; letter-spacing: 2px; }
        .guest .card { background: white; border-radius: 0; padding: 35px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); transition: transform 0.3s; border: none; }
        .guest .card img { border-radius: 0 !important; }
        .guest .card:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0,0,0,0.1); }
        .guest h1, .guest h2, .guest h3 { font-family: var(--serif-font); font-weight: 300; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dark); }
        .guest h3 { margin-top: 0; }
        .guest span { color: var(--primary-gold) !important; background: transparent !important; font-size: 1.2em; font-weight: bold; }
        .guest button { border-radius: 2px; background: var(--primary-gold); color: var(--text-light); border: none; padding: 12px 25px; cursor: pointer; font-weight: 500; transition: all 0.4s ease-in-out; margin-right: 5px; text-transform: uppercase; letter-spacing: 1px; font-family: var(--sans-font); font-size: 0.85em; }
        .guest button:hover { background: #ab8b4b; transform: none; }
        .guest .btn-secondary { background: var(--text-dark); }
        .guest a { text-decoration: none; color: inherit; }
        .guest input { border-radius: 0 !important; font-family: var(--sans-font); padding: 10px; border: 1px solid #ccc; width: 100%; box-sizing: border-box; }
        
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out; }
        .reveal.active { opacity: 1; transform: translateY(0); }

        /* Ticket Styles */

        .ticket-wrapper {
            margin: 20px auto;
            max-width: 750px;
            perspective: 1000px;
        }
        .ticket {
            display: flex;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            overflow: hidden;
            animation: flipIn 0.8s ease-out;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .ticket:hover { transform: translateY(-5px); box-shadow: 0 25px 50px rgba(0,0,0,0.3); }
        @keyframes flipIn {
            from { transform: rotateX(30deg) opacity(0); }
            to { transform: rotateX(0) opacity(1); }
        }
        .ticket-main {
            flex: 1;
            padding: 30px;
            border-right: 2px dashed #ccc;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
        .ticket-stub {
            width: 200px;
            padding: 20px;
            background: #f8f9fa;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .event-title { font-size: 2em; font-weight: 800; color: #2c3e50; margin: 0; line-height: 1.1; text-transform: uppercase; }
        .event-meta { color: #7f8c8d; font-size: 0.85em; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
        .ticket-details {
            display: flex;
            justify-content: space-between;
            margin-top: 25px;
        }
        .detail-group { display: flex; flex-direction: column; }
        .detail-label { font-size: 0.7em; color: #95a5a6; text-transform: uppercase; font-weight: 600; }
        .detail-value { font-size: 1.1em; font-weight: 700; color: #34495e; }
        .ticket-stub img { width: 130px; height: 130px; border: 4px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border-radius: 8px; }
        .stub-id { margin-top: 10px; font-family: 'Courier New', monospace; font-size: 0.85em; color: #7f8c8d; word-break: break-all; }
    </style>
</head>
<body class="${isGuest ? `guest theme-${theme}` : 'admin'}">
    ${!isGuest ? `
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
            <a href="/admin">📊 Dashboard</a>
            <a href="/food/admin">🍔 Food Orders ${counts && counts.food > 0 ? `<span class="badge">${counts.food}</span>` : ''}</a>
            <a href="/hotels/admin">🏨 Hotel Bookings ${counts && counts.hotel > 0 ? `<span class="badge">${counts.hotel}</span>` : ''}</a>
            <a href="/events/admin" class="active">📅 Table Reservations ${counts && counts.event > 0 ? `<span class="badge">${counts.event}</span>` : ''}</a>
            <a href="/admin/history">📜 Order History</a>
            <a href="/gallery/admin">🖼️ Gallery</a>
            <a href="/offers/admin">🎁 Offers</a>
            <a href="/attractions/admin">📍 Attractions</a>
            <a href="/" target="_blank" style="margin-top: 40px; border: 1px solid rgba(255,255,255,0.1);">👀 Guest View</a>
        </div>
    </nav>
    <div class="main-content-wrapper">
    ` : ''}
    <div class="container">
        ${content}
    </div>
    ${!isGuest ? `</div>` : ''}
    ${!isGuest ? `
    <script>
        const savedTheme = localStorage.getItem('adminTheme') || 'dark';
        document.body.classList.add(savedTheme);
    </script>` : ''}
    ${isGuest ? `
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if(entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        });
    </script>` : ''}
</html>
`;

// --- GUEST VIEW ---
// 1. List Available Tables for Guests
router.get('/', (req, res) => {
    const isNational = req.app.locals.guestType === 'national';
    const currency = isNational ? '₹' : '$';
    const rate = isNational ? 80 : 1;

    // Load bookings to check availability
    let currentBookings = [];
    if (fs.existsSync(bookingsFile)) {
        try {
            currentBookings = JSON.parse(fs.readFileSync(bookingsFile, 'utf8'));
        } catch (err) {}
    }

    const tablesHtml = tables.map(table => {
        const isBooked = currentBookings.some(b => b.tableName === table.name && b.date === table.date && b.status !== 'Completed');
        return `
        <div class="card reveal">
            ${table.image ? `<img src="${table.image}" style="width:100%; height:180px; object-fit:cover; border-radius:10px 10px 0 0; margin: -35px -35px 20px -35px; width: calc(100% + 70px);">` : ''}
            <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3>${table.name}</h3>
                <span style="background:#23d5ab; color:white; padding:5px 10px; border-radius:10px;">${currency}${table.price * rate}</span>
            </div>
            <p>Date: ${table.date}</p>
            <div style="margin-top: 15px;">
                ${isBooked ? 
                    `<button style="background: #95a5a6; cursor: not-allowed;" disabled>Booked</button>` : 
                    `<a href="/events/book/${table.id}"><button>Book Table</button></a>`
                }
            </div>
        </div>
    `}).join('');

    res.send(renderPage(`
        <div class="header" style="display: flex; justify-content: space-between; align-items: center; text-align: left;">
            <h1 style="margin: 0;">Restaurant Table Booking</h1>
            <div style="display: flex; gap: 15px; align-items: center;">
                <form action="/set-guest-type" method="POST" style="margin: 0;">
                    <select name="type" onchange="this.form.submit()" style="padding: 8px 15px; border: 1px solid var(--primary-gold); background: transparent; color: var(--text-dark); font-family: var(--sans-font); cursor: pointer;">
                        <option value="national" ${req.app.locals.guestType === 'national' ? 'selected' : ''}>🇮🇳 INR</option>
                        <option value="international" ${req.app.locals.guestType === 'international' ? 'selected' : ''}>🌏 USD</option>
                    </select>
                </form>
                <a href="/"><button class="btn-secondary" style="margin: 0;">Back to Home</button></a>
            </div>
        </div>
        ${tablesHtml}
    `, true, req.app.locals.guestTheme, null, req.app.locals.siteContent));
});

// --- ADMIN/OWNER VIEW ---

/* Note: The add, edit, delete routes are already defined below and are used by this admin panel. */

// 1. Admin: List all tables with management options
router.get('/admin', (req, res) => {
    // Load bookings
    let currentBookings = [];
    if (fs.existsSync(bookingsFile)) {
        try {
            currentBookings = JSON.parse(fs.readFileSync(bookingsFile, 'utf8'));
        } catch (err) {}
    }

    // Filter Bookings by Search Query
    const searchQuery = req.query.q ? req.query.q.toLowerCase() : null;
    if (searchQuery) {
        currentBookings = currentBookings.filter(b => b.guest.toLowerCase().includes(searchQuery) || b.bookingId.toLowerCase().includes(searchQuery));
    }

    // Helper to generate ACTIVE booking card HTML
    const generateActiveBookingHtml = (b) => {
        return `
        <div class="card" style="border-left: 5px solid #e73c7e;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3>${b.tableName}</h3>
                <span style="background:#e73c7e; color:white; padding:4px 8px; border-radius:4px; font-size:0.8em;">${b.status || 'Active'}</span>
            </div>
            <p><strong>Guest:</strong> ${b.guest}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                <form action="/events/admin/complete" method="POST">
                    <input type="hidden" name="bookingId" value="${b.bookingId}">
                    <button type="submit" class="btn-success" style="font-size:0.8em; padding:5px 15px;">Mark Complete</button>
                </form>
            </div>
            <p style="margin-top:5px; font-size:0.8em; color:#777;">ID: ${b.bookingId}</p>
        </div>
    `};

    const activeBookings = currentBookings.filter(b => b.status !== 'Completed');

    const activeHtml = activeBookings.map(generateActiveBookingHtml).join('');

    const tablesHtml = tables.map(table => `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3>${table.name}</h3>
                ${table.image ? `<img src="${table.image}" style="width:50px; height:50px; border-radius:5px; object-fit:cover; margin-right:auto; margin-left:15px;">` : ''}
                <span style="background:#23d5ab; color:white; padding:5px 10px; border-radius:10px;">$${table.price}</span>
            </div>
            <p>Date: ${table.date}</p>
            <div style="margin-top: 15px;">
                <a href="/events/book/${table.id}"><button>Book Table</button></a>
                <a href="/events/edit/${table.id}"><button class="btn-secondary">Edit</button></a>
                <form action="/events/delete" method="POST" style="display:inline;">
                    <input type="hidden" name="id" value="${table.id}">
                    <button type="submit" class="btn-danger" onclick="return confirm('Delete this table?')">Delete</button>
                </form>
            </div>
        </div>
    `).join('');

    res.send(renderPage(`
        <div class="header">
            <h1>Manage Restaurant Tables</h1>
            <div>
                <a href="/events/add" class="btn btn-success">+ Add New Table</a>
            </div>
        </div>

        <h2>Guest Reservations</h2>
        
        <form action="/events/admin" method="GET" style="margin-bottom: 20px;">
            <input type="text" name="q" placeholder="Search by Guest Name or ID..." value="${req.query.q || ''}" style="max-width:400px; display:inline-block;">
            <button type="submit">Search</button>
            ${req.query.q ? '<a href="/events/admin" class="btn btn-secondary" style="margin-left:5px;">Clear</a>' : ''}
        </form>

        ${activeHtml.length ? activeHtml : '<p style="color:white; opacity:0.7;">No active reservations.</p>'}

        <h2>Manage Tables</h2>
        ${tablesHtml}
    `, false, 'default', res.locals.counts));
});

// 2. Admin: Add/Edit/Delete Routes
router.get('/add', (req, res) => {
    res.send(renderPage(`
        <div class="card">
            <h2>Add New Table</h2>
            <form action="/events/add" method="POST">
                <label>Table Name/Type:</label>
                <input type="text" name="name" required>
                <label>Date:</label>
                <input type="date" name="date" required>
                <label>Reservation Fee ($):</label>
                <input type="number" name="price" required>
                
                <label>Image URL:</label>
                <input type="text" name="image" placeholder="https://...">

                <br><br>
                <button type="submit">Add Table</button>
                <a href="/events/admin"><button type="button" class="btn-secondary">Cancel</button></a>
            </form>
        </div>
    `, false));
});

router.post('/add', (req, res) => {
    const { name, date, price, image } = req.body;
    const newId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
    tables.push({ id: newId, name, date, price: parseInt(price), image });
    res.redirect('/events/admin');
});

router.get('/edit/:id', (req, res) => {
    const table = tables.find(t => t.id === parseInt(req.params.id));
    if (!table) return res.redirect('/events');
    
    res.send(renderPage(`
        <div class="card">
            <h2>Edit Table</h2>
            <form action="/events/edit" method="POST">
                <input type="hidden" name="id" value="${table.id}">
                <label>Table Name/Type:</label>
                <input type="text" name="name" value="${table.name}" required>
                <label>Date:</label>
                <input type="date" name="date" value="${table.date}" required>
                <label>Reservation Fee ($):</label>
                <input type="number" name="price" value="${table.price}" required>

                <label>Image URL:</label>
                <input type="text" name="image" value="${table.image || ''}">

                <br><br>
                <button type="submit">Update Table</button>
                <a href="/events/admin"><button type="button" class="btn-secondary">Cancel</button></a>
            </form>
        </div>
    `, false));
});

router.post('/edit', (req, res) => {
    const { id, name, date, price, image } = req.body;
    const index = tables.findIndex(t => t.id === parseInt(id));
    if (index !== -1) {
        tables[index] = { id: parseInt(id), name, date, price: parseInt(price), image };
    }
    res.redirect('/events/admin');
});

router.post('/delete', (req, res) => {
    const { id } = req.body;
    tables = tables.filter(t => t.id !== parseInt(id));
    res.redirect('/events/admin');
});

// --- SHARED ROUTES (for Guest Booking) ---
// 1. Booking Form
router.get('/book/:id', (req, res) => {
    const tableId = parseInt(req.params.id);
    const table = tables.find(t => t.id === tableId);

    const isNational = req.app.locals.guestType === 'national';
    const currency = isNational ? '₹' : '$';
    const rate = isNational ? 80 : 1;

    if (!table) return res.send('<h3>Table not found</h3><a href="/events">Back</a>');

    res.send(renderPage(`
        <div class="card">
        <h1>Reserve ${table.name} (${currency}${table.price * rate})</h1>
        <form action="/events/confirm" method="POST">
            <input type="hidden" name="tableId" value="${table.id}">
            <label>Guest Name:</label><br>
            <input type="text" name="name" required><br><br>
            <label>Email:</label><br>
            <input type="email" name="email" required><br><br>
            <button type="submit">Confirm Reservation</button>
            <a href="/events"><button type="button" class="btn-secondary">Cancel</button></a>
        </form>
        </div>
    `, true, req.app.locals.guestTheme, null, req.app.locals.siteContent));
});

// 2. Confirm Booking & Generate QR Code
router.post('/confirm', async (req, res) => {
    const { tableId, name, email } = req.body;
    const table = tables.find(t => t.id === parseInt(tableId));

    if (!table) return res.send('Table not found');

    const isNational = req.app.locals.guestType === 'national';
    const currency = isNational ? '₹' : '$';
    const rate = isNational ? 80 : 1;

    // Create a unique booking ID
    const bookingId = 'BK-' + Date.now();
    
    const bookingDetails = {
        bookingId,
        tableName: table.name,
        guest: name,
        email: email,
        date: table.date,
        status: 'Active'
    };

    // Read existing bookings from file
    let currentBookings = [];
    if (fs.existsSync(bookingsFile)) {
        try {
            const fileData = fs.readFileSync(bookingsFile, 'utf8');
            currentBookings = JSON.parse(fileData);
        } catch (err) {
            console.error("Error parsing bookings file, starting with empty list.");
        }
    }

    currentBookings.push(bookingDetails);
    fs.writeFileSync(bookingsFile, JSON.stringify(currentBookings, null, 2));

    // Generate QR Code Data
    const qrData = JSON.stringify(bookingDetails);
    
    try {
        const qrImage = await QRCode.toDataURL(qrData);
        
        res.send(renderPage(`
            <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
            <script>
                window.onload = function() {
                    confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 }
                    });
                };
            </script>
            <div class="ticket-wrapper">
                <h1 style="text-align:center; color:white; text-shadow: 0 2px 4px rgba(0,0,0,0.2); margin-bottom: 20px;">Reservation Confirmed!</h1>
                <div class="ticket">
                    <div class="ticket-main">
                        <div>
                            <div class="event-meta">Table Reservation</div>
                            <h2 class="event-title">${table.name}</h2>
                        </div>
                        <div class="ticket-details">
                            <div class="detail-group">
                                <span class="detail-label">Guest</span>
                                <span class="detail-value">${name}</span>
                            </div>
                            <div class="detail-group">
                                <span class="detail-label">Date</span>
                                <span class="detail-value">${table.date}</span>
                            </div>
                            <div class="detail-group">
                                <span class="detail-label">Fee</span>
                                <span class="detail-value">${currency}${table.price * rate}</span>
                            </div>
                        </div>
                    </div>
                    <div class="ticket-stub">
                        <img src="${qrImage}" alt="QR Code">
                        <div class="stub-id">${bookingId}</div>
                    </div>
                </div>
                <div style="text-align:center; margin-top:30px;">
                    <button onclick="window.print()">Print Ticket</button>
                    <a href="/events"><button type="button" class="btn-secondary">Book Another</button></a>
                </div>
            </div>
        `, true, req.app.locals.guestTheme, null, req.app.locals.siteContent));
    } catch (err) {
        console.error(err);
        res.status(500).send('Error generating QR code');
    }
});

// 3. Admin: Mark Booking Complete
router.post('/admin/complete', (req, res) => {
    const { bookingId } = req.body;
    if (fs.existsSync(bookingsFile)) {
        let currentBookings = JSON.parse(fs.readFileSync(bookingsFile, 'utf8'));
        const booking = currentBookings.find(b => b.bookingId === bookingId);
        if (booking) {
            booking.status = 'Completed';
            fs.writeFileSync(bookingsFile, JSON.stringify(currentBookings, null, 2));
        }
    }
    res.redirect('/events/admin');
});

// 4. Admin: Delete History Booking
router.post('/admin/delete-booking', (req, res) => {
    const { bookingId } = req.body;
    if (fs.existsSync(bookingsFile)) {
        let currentBookings = JSON.parse(fs.readFileSync(bookingsFile, 'utf8'));
        currentBookings = currentBookings.filter(b => b.bookingId !== bookingId);
        fs.writeFileSync(bookingsFile, JSON.stringify(currentBookings, null, 2));
    }
    res.redirect(req.get('Referer') || '/events/admin');
});

module.exports = router;