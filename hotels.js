const express = require('express');
const router = express.Router();

// Mock Data for Rooms
let rooms = [
    { id: 1, name: 'Deluxe King Suite', price: 200, type: 'Suite', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80', available: true },
    { id: 2, name: 'Standard Double Room', price: 120, type: 'Standard', image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=800&q=80', available: true },
    { id: 3, name: 'Ocean View Penthouse', price: 450, type: 'Luxury', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80', available: true },
    { id: 4, name: 'Cozy Single Room', price: 80, type: 'Economy', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80', available: true }
];

// Helper for HTML
const renderPage = (content, isGuest = true, theme = 'default', counts = { food: 0, hotel: 0, event: 0 }, siteContent = null) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Hotel Booking</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Poppins', sans-serif; margin: 0; transition: background-color 0.3s, color 0.3s; }
        .container { max-width: 1200px; margin: 0 auto; padding: 40px; box-sizing: border-box; width: 100%; }

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
            --primary-gold: #b1944e;
            --text-dark: #1a1a1a;
            --text-light: #ffffff;
            --bg-warm: #f9f7f2;
            --bg-beige: #ebe4d6;
            --serif-font: 'Playfair Display', serif;
            --sans-font: 'Montserrat', sans-serif;
        }
        .guest { background: var(--bg-warm); color: var(--text-dark); font-family: var(--sans-font); }
        .guest .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid var(--primary-gold); padding-bottom: 20px; }
        .guest .header h1 { font-weight: 300; font-size: 2.5em; color: var(--text-dark); margin: 0; font-family: var(--serif-font); text-transform: uppercase; letter-spacing: 2px; }
        
        .rooms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; }
        
        .guest .card { padding: 0; border-radius: 0; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.3s; height: 100%; border: none; }
        .guest .card > div { padding: 30px; }
        .guest .card > div:first-child { padding-bottom: 0; }
        .guest .card img { border-radius: 0 !important; }
        .guest .card:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0,0,0,0.1); }
        
        .guest h1, .guest h3 { font-family: var(--serif-font); font-weight: 300; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dark) !important; }
        .guest h3 { margin: 0 0 10px 0; font-size: 1.5em; }
        .guest p { margin: 0; opacity: 0.7; font-size: 0.95em; line-height: 1.6; }
        .guest .price { font-size: 1.2em; color: var(--primary-gold); font-weight: 400; }
        
        .guest button { background: var(--primary-gold); color: white; border: none; padding: 12px 25px; border-radius: 0; cursor: pointer; font-size: 0.85em; transition: all 0.3s; font-weight: 400; width: 100%; margin-top: 20px; text-transform: uppercase; letter-spacing: 1.5px; font-family: var(--sans-font); }
        .guest button:hover { background: #9c8040; transform: none; }
        
        .guest .back-btn { background: var(--text-dark); text-decoration: none; padding: 10px 20px; color: white; border-radius: 0; font-size: 0.85em; text-transform: uppercase; letter-spacing: 1px; }
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
            <a href="/hotels/admin" class="active">🏨 Hotel Bookings ${counts && counts.hotel > 0 ? `<span class="badge">${counts.hotel}</span>` : ''}</a>
            <a href="/events/admin">📅 Table Reservations ${counts && counts.event > 0 ? `<span class="badge">${counts.event}</span>` : ''}</a>
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
</html>
`;

// --- GUEST VIEW ---
// 1. List Rooms for Guests
router.get('/', (req, res) => {
    const isNational = req.app.locals.guestType === 'national';
    const currency = isNational ? '₹' : '$';
    const rate = isNational ? 80 : 1;

    const roomsHtml = rooms.map(room => {
        const isBooked = req.app.locals.hotelBookings.some(b => b.roomName === room.name && b.status !== 'Completed');
        return `
        <div class="card">
            <div>
                ${room.image ? `<img src="${room.image}" style="width:100%; height:200px; object-fit:cover; border-radius:10px; margin-bottom:15px;" alt="${room.name}">` : `<div style="background: #f0f4f8; height: 150px; border-radius: 10px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; color: #cbd5e0; font-size: 3em;">🛏️</div>`}
                <h3>${room.name}</h3>
                <p>Experience the comfort of our <strong>${room.type}</strong> class rooms. Perfect for relaxation.</p>
            </div>
            <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                <div class="price">${currency}${room.price * rate} / night</div>
                ${isBooked ? 
                    `<button style="background: #95a5a6; cursor: not-allowed; width:100%;" disabled>Booked</button>` : 
                    `<a href="/hotels/book/${room.id}"><button>Book Now</button></a>`
                }
            </div>
        </div>
    `}).join('');

    res.send(renderPage(`
        <div class="header">
            <h1>Available Rooms</h1>
            <div style="display:flex; align-items:center; gap:15px;">
                <form action="/set-guest-type" method="POST" style="margin:0;">
                    <select name="type" onchange="this.form.submit()" style="padding: 8px 15px; border: 1px solid var(--primary-gold); background: transparent; color: var(--text-dark); font-family: var(--sans-font); cursor: pointer;">
                        <option value="national" ${req.app.locals.guestType === 'national' ? 'selected' : ''}>🇮🇳 INR</option>
                        <option value="international" ${req.app.locals.guestType === 'international' ? 'selected' : ''}>🌏 USD</option>
                    </select>
                </form>
                <a href="/" class="back-btn">Back to Home</a>
            </div>
        </div>
        <div class="rooms-grid">
            ${roomsHtml}
        </div>
    `, true, req.app.locals.guestTheme, null, req.app.locals.siteContent));
});

// 2. Booking Form
router.get('/book/:id', (req, res) => {
    const room = rooms.find(r => r.id == req.params.id);
    if (!room) return res.redirect('/hotels');

    const isNational = req.app.locals.guestType === 'national';
    const currency = isNational ? '₹' : '$';
    const rate = isNational ? 80 : 1;

    res.send(renderPage(`
        <div class="header">
            <h1>Book ${room.name}</h1>
            <a href="/hotels" class="back-btn">Cancel</a>
        </div>
        <div class="card" style="display: block;">
            ${room.image ? `
                <div style="text-align:center; margin-bottom:20px;">
                    <img src="${room.image}" style="width:100%; max-height:300px; object-fit:cover; border-radius:10px;">
                </div>` : ''}
            <form action="/hotels/confirm" method="POST">
                <input type="hidden" name="roomId" value="${room.id}">
                <label><strong>Full Name:</strong></label>
                <input type="text" name="name" required>
                
                <label><strong>Check-in Date:</strong></label>
                <input type="date" name="checkIn" required>
                
                <label><strong>Number of Nights:</strong></label>
                <input type="number" name="nights" min="1" value="1" required>
                
                <br><br>
                <button type="submit" style="width: 100%; background: #27ae60;">Confirm Booking (${currency}${room.price * rate}/night)</button>
            </form>
        </div>
    `, true, req.app.locals.guestTheme, null, req.app.locals.siteContent));
});

// 3. Confirm Booking
router.post('/confirm', (req, res) => {
    const { roomId, name, checkIn, nights } = req.body;
    const room = rooms.find(r => r.id == roomId);

    const isNational = req.app.locals.guestType === 'national';
    const currency = isNational ? '₹' : '$';
    const rate = isNational ? 80 : 1;

    const pricePerNight = room ? (room.price * rate) : 0;
    const total = pricePerNight * nights;
    const bookingId = 'HTL-' + Math.floor(Math.random() * 100000);

    // Save booking details for Admin
    req.app.locals.hotelBookings.push({
        id: bookingId,
        guestName: name,
        roomName: room ? room.name : 'Unknown Room',
        checkIn: checkIn,
        nights: parseInt(nights),
        pricePerNight: pricePerNight,
        total: total,
        currency: currency,
        status: 'Active',
        timestamp: new Date().toLocaleString()
    });

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
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
            <div style="text-align: center; border-bottom: 2px dashed #eee; padding-bottom: 20px; margin-bottom: 20px;">
                <h1 style="color: #2c3e50; margin: 0;">Grand Plaza Hotel</h1>
                <p style="color: #7f8c8d; margin: 5px 0;">Official Booking Receipt</p>
            </div>
            
            <div style="margin-bottom: 30px; font-size: 1.1em; line-height: 1.8;">
                <p><strong>Booking ID:</strong> <span style="float: right; font-family: monospace;">${bookingId}</span></p>
                <p><strong>Guest Name:</strong> <span style="float: right;">${name}</span></p>
                <p><strong>Room Type:</strong> <span style="float: right;">${room ? room.name : 'Room'}</span></p>
                <p><strong>Check-in Date:</strong> <span style="float: right;">${checkIn}</span></p>
                <p><strong>Duration:</strong> <span style="float: right;">${nights} Night(s)</span></p>
                <p><strong>Rate per Night:</strong> <span style="float: right;">${currency}${room ? room.price * rate : 0}</span></p>
            </div>

            <div style="border-top: 2px solid #eee; padding-top: 20px; margin-top: 20px;">
                <h2 style="color: #27ae60; display: flex; justify-content: space-between;">
                    <span>Total Paid:</span>
                    <span>${currency}${total}</span>
                </h2>
            </div>

            <div style="text-align: center; margin-top: 40px;">
                <button onclick="window.print()" style="background: #34495e; margin-right: 10px;">🖨️ Print Receipt</button>
                <a href="/hotels"><button>Book Another</button></a>
                <a href="/" class="back-btn" style="margin-left: 10px;">Home</a>
            </div>
        </div>
    `, true, req.app.locals.guestTheme, null, req.app.locals.siteContent));
});

// --- ADMIN/OWNER VIEW ---

// 1. Admin: List all rooms with management options
router.get('/admin', (req, res) => {
    const roomsHtml = rooms.map(room => `
        <div class="card" style="flex-direction: row; align-items: center; gap: 20px;">
            <div style="flex: 0 0 100px;">
                ${room.image ? `<img src="${room.image}" style="width:100px; height:100px; object-fit:cover; border-radius:8px;">` : `<div style="width:100px; height:100px; background:#ddd; border-radius:8px; display:flex; align-items:center; justify-content:center;">No Img</div>`}
            </div>
            <div style="flex: 1;">
                <h3>${room.name}</h3>
                <p>Type: ${room.type} | Price: $${room.price}</p>
                ${room.image ? `<p style="font-size:0.8em; opacity:0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${room.image}</p>` : ''}
            </div>
            <div style="text-align: right;">
                <a href="/hotels/admin/edit/${room.id}"><button>Edit</button></a>
                <form action="/hotels/admin/delete" method="POST" style="display:inline; margin-left: 5px;">
                    <input type="hidden" name="id" value="${room.id}">
                    <button type="submit" class="btn-danger" onclick="return confirm('Delete this room?')">Delete</button>
                </form>
            </div>
        </div>
    `).join('');

    // Filter Bookings
    const searchQuery = req.query.q ? req.query.q.toLowerCase() : null;
    const filteredBookings = searchQuery ? req.app.locals.hotelBookings.filter(b => b.guestName.toLowerCase().includes(searchQuery) || b.id.toLowerCase().includes(searchQuery)) : req.app.locals.hotelBookings;

    // Helper to generate ACTIVE booking card HTML
    const generateActiveBookingHtml = (b) => {
        // Calculate checkout date
        let checkOutDate = new Date(b.checkIn);
        checkOutDate.setDate(checkOutDate.getDate() + b.nights);
        let checkOutStr = checkOutDate.toISOString().split('T')[0];

        const statusColor = '#f1c40f';

        return `
        <div class="card" style="border-left: 5px solid ${statusColor};">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin-bottom: 10px;">${b.guestName}</h3>
                <span style="background:${statusColor}; color:white; padding:4px 8px; border-radius:4px; font-size:0.8em; font-weight:bold;">${b.status || 'Active'}</span>
            </div>
            <p style="margin: 5px 0; font-size: 0.9em; opacity: 0.8;">ID: ${b.id}</p>
            <p style="margin: 5px 0;"><strong>Room:</strong> ${b.roomName}</p>
            <div style="margin: 15px 0; border-top: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1); padding: 10px 0;">
                <p style="margin: 5px 0;"><strong>Check-in:</strong> ${b.checkIn}</p>
                <p style="margin: 5px 0;"><strong>Check-out:</strong> ${checkOutStr}</p>
                <p style="margin: 5px 0;"><strong>Duration:</strong> ${b.nights} Nights</p>
                
                <form action="/hotels/admin/extend" method="POST" style="background: rgba(0,0,0,0.1); padding: 10px; border-radius: 5px; margin-top: 10px;">
                    <input type="hidden" name="id" value="${b.id}">
                    <label style="font-size: 0.85em; color: #ddd;">Extend Stay (Nights):</label>
                    <div style="display:flex; gap:10px;">
                        <input type="number" name="extraNights" value="1" min="1" style="margin:0; padding:5px; flex:1;">
                        <button type="submit" style="font-size: 0.8em; padding: 5px 15px; width: auto; margin:0; background: #3498db;">Add</button>
                    </div>
                </form>

                <form action="/hotels/admin/update-times" method="POST" style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px; margin-top: 10px;">
                    <input type="hidden" name="id" value="${b.id}">
                    <label style="font-size: 0.85em; color: #ddd;">Time In:</label>
                    <input type="time" name="checkInTime" value="${b.checkInTime || ''}" style="margin: 5px 0; padding: 5px;">
                    <label style="font-size: 0.85em; color: #ddd;">Time Out:</label>
                    <input type="time" name="checkOutTime" value="${b.checkOutTime || ''}" style="margin: 5px 0; padding: 5px;">
                    <button type="submit" style="font-size: 0.8em; padding: 5px 15px; width: auto; margin-top: 5px;">Update Times</button>
                </form>
            </div>
            <p style="margin: 5px 0;"><strong>Total Bill:</strong> ${b.currency}${b.total}</p>
            <small style="opacity: 0.6;">Booked: ${b.timestamp}</small>
            
            <div style="margin-top: 15px; display: flex; gap: 10px;">
                <form action="/hotels/admin/complete" method="POST" style="flex:1;">
                    <input type="hidden" name="id" value="${b.id}">
                    <button type="submit" style="background: #27ae60; width:100%;">Mark Complete</button>
                </form>
                <a href="/hotels/admin/bill/${b.id}" style="flex:1;"><button style="background: #8e44ad; width:100%;">View Bill</button></a>
            </div>
        </div>
        `;
    };

    const activeBookings = filteredBookings.filter(b => b.status !== 'Completed');

    const activeHtml = activeBookings.map(generateActiveBookingHtml).join('');

    res.send(renderPage(`
        <div class="header">
            <h1>Manage Hotel & Bookings</h1>
            <div>
                <a href="/hotels/admin/add" class="btn btn-success">+ Add New Room</a>
            </div>
        </div>
        
        <h2>Guest Bookings</h2>
        
        <form action="/hotels/admin" method="GET" style="margin-bottom: 20px;">
            <input type="text" name="q" placeholder="Search by Guest Name or Booking ID..." value="${req.query.q || ''}" style="max-width:400px; display:inline-block;">
            <button type="submit">Search</button>
            ${req.query.q ? '<a href="/hotels/admin" class="btn btn-danger" style="margin-left:5px;">Clear</a>' : ''}
        </form>

        <div class="rooms-grid" style="margin-bottom: 50px;">
            ${activeHtml.length > 0 ? activeHtml : '<p style="color: #bdc3c7;">No active bookings found.</p>'}
        </div>

        <h2>Room Management</h2>
        ${roomsHtml}
    `, false, 'default', res.locals.counts));
});

// 2. Admin: Show 'Add Room' form
router.get('/admin/add', (req, res) => {
    res.send(renderPage(`
        <div class="header"><h1>Add New Room</h1></div>
        <div class="card" style="display: block;">
            <form action="/hotels/admin/add" method="POST">
                <label><strong>Room Name:</strong></label>
                <input type="text" name="name" placeholder="e.g., Deluxe King Suite" required>
                
                <label><strong>Room Type:</strong></label>
                <input type="text" name="type" placeholder="e.g., Suite, Standard" required>

                <label><strong>Price per Night ($):</strong></label>
                <input type="number" name="price" min="1" required>
                
                <br><br>
                <button type="submit" style="width: 100%; background: #27ae60;">Save Room</button>
            </form>
        </div>
    `, false));
});

// 3. Admin: Process 'Add Room' form
router.post('/admin/add', (req, res) => {
    const { name, type, price, image } = req.body;
    const newId = rooms.length > 0 ? Math.max(...rooms.map(r => r.id)) + 1 : 1;
    rooms.push({ id: newId, name, type, price: parseInt(price), image, available: true });
    res.redirect('/hotels/admin');
});

// 4. Admin: Show 'Edit Room' form
router.get('/admin/edit/:id', (req, res) => {
    const room = rooms.find(r => r.id == req.params.id);
    if (!room) return res.redirect('/hotels/admin');

    res.send(renderPage(`
        <div class="header"><h1>Edit ${room.name}</h1></div>
        <div class="card" style="display: block;">
            <form action="/hotels/admin/edit" method="POST">
                <input type="hidden" name="id" value="${room.id}">
                <label><strong>Room Name:</strong></label>
                <input type="text" name="name" value="${room.name}" required>
                
                <label><strong>Room Type:</strong></label>
                <input type="text" name="type" value="${room.type}" required>

                <label><strong>Price per Night ($):</strong></label>
                <input type="number" name="price" value="${room.price}" min="1" required>
                
                <label><strong>Image URL:</strong></label>
                <input type="text" name="image" value="${room.image || ''}">

                <br><br>
                <button type="submit" style="width: 100%;">Update Room</button>
            </form>
        </div>
    `, false));
});

// 5. Admin: Process 'Edit Room' form
router.post('/admin/edit', (req, res) => {
    const { id, name, type, price, image } = req.body;
    const index = rooms.findIndex(r => r.id == id);
    if (index !== -1) {
        rooms[index] = { ...rooms[index], name, type, price: parseInt(price), image };
    }
    res.redirect('/hotels/admin');
});

// 6. Admin: Process 'Delete Room'
router.post('/admin/delete', (req, res) => {
    const { id } = req.body;
    rooms = rooms.filter(r => r.id != id);
    res.redirect('/hotels/admin');
});

// 7. Admin: Update Check-in/out Times
router.post('/admin/update-times', (req, res) => {
    const { id, checkInTime, checkOutTime } = req.body;
    const booking = req.app.locals.hotelBookings.find(b => b.id === id);
    if (booking) {
        booking.checkInTime = checkInTime;
        booking.checkOutTime = checkOutTime;
    }
    res.redirect('/hotels/admin');
});

// 8. Admin: Extend Booking
router.post('/admin/extend', (req, res) => {
    const { id, extraNights } = req.body;
    const booking = req.app.locals.hotelBookings.find(b => b.id === id);
    if (booking && booking.status !== 'Completed') {
        const extra = parseInt(extraNights) || 0;
        booking.nights += extra;
        // Recalculate total if pricePerNight is available
        if (booking.pricePerNight) {
            booking.total = booking.nights * booking.pricePerNight;
        }
    }
    res.redirect('/hotels/admin');
});

// 9. Admin: Complete Booking
router.post('/admin/complete', (req, res) => {
    const { id } = req.body;
    const booking = req.app.locals.hotelBookings.find(b => b.id === id);
    if (booking) {
        booking.status = 'Completed';
    }
    res.redirect('/hotels/admin');
});

// 10. Admin: Generate Bill
router.get('/admin/bill/:id', (req, res) => {
    const booking = req.app.locals.hotelBookings.find(b => b.id === req.params.id);
    if (!booking) return res.redirect('/hotels/admin');

    res.send(renderPage(`
        <div style="max-width: 800px; margin: 0 auto; padding: 40px; background: white; color: #333; font-family: 'Helvetica Neue', sans-serif;">
            <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px;">
                <h1 style="margin: 0; text-transform: uppercase; letter-spacing: 2px;">Invoice</h1>
                <p>Grand Plaza Hotel</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                <div>
                    <strong>Bill To:</strong><br>
                    ${booking.guestName}<br>
                    Booking ID: ${booking.id}
                </div>
                <div style="text-align: right;">
                    <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
                    <strong>Status:</strong> ${booking.status || 'Active'}
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
                <thead style="background: #f4f4f4;">
                    <tr>
                        <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Description</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Nights</th>
                        <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Rate</th>
                        <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #eee;">Room Charges: ${booking.roomName}<br><small>Check-in: ${booking.checkIn}</small></td>
                        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${booking.nights}</td>
                        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${booking.currency}${booking.pricePerNight}</td>
                        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${booking.currency}${booking.total}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="padding: 15px; text-align: right;"><strong>Total:</strong></td>
                        <td style="padding: 15px; text-align: right; font-size: 1.2em; color: #27ae60;"><strong>${booking.currency}${booking.total}</strong></td>
                    </tr>
                </tfoot>
            </table>

            <div style="text-align: center; margin-top: 60px;">
                <button onclick="window.print()" style="background: #333; color: white; padding: 10px 30px; border: none; border-radius: 4px; cursor: pointer;">Print Invoice</button>
                <a href="/hotels/admin" style="display: block; margin-top: 15px; color: #666; text-decoration: none;">Back to Dashboard</a>
            </div>
        </div>
    `, false)); 
});

// 11. Admin: Delete History Booking
router.post('/admin/delete-booking', (req, res) => {
    const { id } = req.body;
    req.app.locals.hotelBookings = req.app.locals.hotelBookings.filter(b => b.id !== id);
    res.redirect(req.get('Referer') || '/hotels/admin');
});

module.exports = router;