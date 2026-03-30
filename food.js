const express = require('express');
const router = express.Router();

// Mock Menu Data
let menu = [
    { id: 1, name: 'Classic Cheese Burger', price: 12, category: 'Main', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60' },
    { id: 2, name: 'Pepperoni Pizza', price: 15, category: 'Main', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=60' },
    { id: 3, name: 'Caesar Salad', price: 10, category: 'Starter', image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=500&q=60' },
    { id: 4, name: 'Chocolate Lava Cake', price: 8, category: 'Dessert', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=500&q=60' },
    { id: 5, name: 'Fresh Orange Juice', price: 5, category: 'Drinks', image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=500&q=60' }
];

// Helper for HTML
const renderPage = (content, isGuest = true, theme = 'default', counts = { food: 0, hotel: 0, event: 0 }, siteContent = null) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Food Ordering</title>
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

        .admin .menu-item { border-radius: 16px; padding: 30px; margin-bottom: 20px; transition: all 0.3s; display: flex; justify-content: space-between; align-items: center; background: rgba(20, 20, 20, 0.5) !important; backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.1) !important; box-shadow: 0 8px 32px 0 rgba(0,0,0,0.3) !important; color: white; }
        .admin .menu-item:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(0,0,0,0.5) !important; }

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
        .guest .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid var(--primary-gold); padding-bottom: 20px; }
        .guest .header h1 { font-weight: 300; font-size: 2.5em; color: var(--text-dark); margin: 0; font-family: var(--serif-font); text-transform: uppercase; letter-spacing: 2px; }
        
        .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
        .guest .menu-item { padding: 25px; border-radius: 0; background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--primary-gold); transition: all 0.3s; }
        .guest .menu-item:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); }
        .guest .menu-item img { border-radius: 0 !important; }
        
        .guest h1, .guest h3 { font-family: var(--serif-font); font-weight: 300; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dark); }
        .guest h3 { margin: 0 0 5px 0; font-size: 1.3em; }
        .guest .category { font-size: 0.75em; opacity: 0.6; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 400; color: #555; }
        .guest .price { font-weight: 400; color: var(--primary-gold); font-size: 1.1em; margin-right: 15px; }
        .guest button { border-radius: 2px; background: var(--primary-gold); color: var(--text-light); border: none; padding: 10px 20px; cursor: pointer; font-weight: 500; transition: all 0.4s ease-in-out; text-transform: uppercase; letter-spacing: 1px; font-size: 0.8em; font-family: var(--sans-font); }
        .guest button:hover { background: #ab8b4b; transform: none; }
        .guest .back-btn { background: var(--text-dark); text-decoration: none; padding: 10px 20px; color: white; border-radius: 0; font-size: 0.85em; text-transform: uppercase; letter-spacing: 1px; }
        .guest input[type="text"] { border-radius: 0 !important; font-family: var(--sans-font); }
        
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out; }
        .reveal.active { opacity: 1; transform: translateY(0); }
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
            <a href="/food/admin" class="active">🍔 Food Orders ${counts && counts.food > 0 ? `<span class="badge">${counts.food}</span>` : ''}</a>
            <a href="/hotels/admin">🏨 Hotel Bookings ${counts && counts.hotel > 0 ? `<span class="badge">${counts.hotel}</span>` : ''}</a>
            <a href="/events/admin">📅 Table Reservations ${counts && counts.event > 0 ? `<span class="badge">${counts.event}</span>` : ''}</a>
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
// 1. Show Menu for Guests
router.get('/', (req, res) => {
    const isNational = req.app.locals.guestType === 'national';
    const currency = isNational ? '₹' : '$';
    const rate = isNational ? 80 : 1;

    const menuHtml = menu.map(item => `
        <div class="menu-item reveal">
            <div style="display:flex; align-items:center; gap:15px;">
                ${item.image ? `<img src="${item.image}" style="width:70px; height:70px; border-radius:10px; object-fit:cover;">` : ''}
                <div>
                    <span class="category">${item.category}</span>
                    <h3>${item.name}</h3>
                </div>
            </div>
            <div style="display:flex; align-items:center;">
                <span class="price">${currency}${item.price * rate}</span>
                <form action="/food/order" method="POST" style="margin:0; display:flex; gap: 5px;">
                    <input type="hidden" name="itemId" value="${item.id}">
                    <input type="text" name="customerName" placeholder="Guest Name" required style="padding: 10px; border: 1px solid #ddd; border-radius: 20px; width: 120px; font-size: 14px;">
                    <button type="submit" style="padding: 10px 20px;">Order</button>
                </form>
            </div>
        </div>
    `).join('');

    res.send(renderPage(`
        <div class="header">
            <h1>🍔 Restaurant Menu</h1>
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
        <div class="menu-grid">
            ${menuHtml}
        </div>
    `, true, req.app.locals.guestTheme, null, req.app.locals.siteContent));
});

// 2. Process Order
router.post('/order', (req, res) => {
    const { itemId, customerName } = req.body;
    const item = menu.find(i => i.id == itemId);

    if (!item) return res.redirect('/food');
    
    const isNational = req.app.locals.guestType === 'national';
    const currency = isNational ? '₹' : '$';
    const rate = isNational ? 80 : 1;

    const orderId = 'ORD-' + Math.floor(Math.random() * 10000);
    const date = new Date().toLocaleString();

    // Save order
    req.app.locals.foodOrders.push({
        id: orderId,
        item: item.name,
        price: item.price,
        customerName: customerName || 'Guest',
        currency: currency,
        rate: rate,
        date: date,
        status: 'Pending'
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
        <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-top: 5px solid #e74c3c;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #c0392b; margin: 0;">Grand Plaza Dining</h1>
                <p style="color: #95a5a6; font-size: 0.9em;">Customer Receipt</p>
            </div>

            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
                <p style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span style="color: #7f8c8d;">Order #:</span>
                    <strong>${orderId}</strong>
                </p>
                <p style="display: flex; justify-content: space-between; margin: 5px 0; font-size: 0.9em;">
                    <span style="color: #7f8c8d;">Time:</span>
                    <span>${date}</span>
                </p>
                <hr style="border: 0; border-top: 1px dashed #ddd; margin: 15px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div>
                        <strong style="font-size: 1.1em;">${item.name}</strong>
                        <div style="font-size: 0.8em; color: #7f8c8d;">${item.category}</div>
                    </div>
                    <div style="font-weight: bold; color: #333;">${currency}${item.price * rate}</div>
                </div>
            </div>

            <div style="margin-top: 20px; text-align: right;">
                <span style="font-size: 1.2em; color: #7f8c8d; margin-right: 10px;">Total Due:</span>
                <span style="font-size: 1.5em; color: #e74c3c; font-weight: bold;">${currency}${item.price * rate}</span>
            </div>

            <div style="text-align: center; margin-top: 40px;">
                <button onclick="window.print()" style="background: #333; margin-right: 10px;">🖨️ Print Receipt</button>
                <a href="/food"><button>Order More</button></a>
                <a href="/" class="back-btn" style="margin-left: 10px;">Home</a>
            </div>
        </div>
    `, true, req.app.locals.guestTheme, null, req.app.locals.siteContent));
});

// --- ADMIN/OWNER VIEW ---
// 1. List all menu items with management options
router.get('/admin', (req, res) => {
    const searchQuery = req.query.q ? req.query.q.toLowerCase() : null;
    const filteredOrders = searchQuery 
        ? req.app.locals.foodOrders.filter(o => (o.customerName && o.customerName.toLowerCase().includes(searchQuery)) || o.item.toLowerCase().includes(searchQuery) || o.id.toLowerCase().includes(searchQuery))
        : req.app.locals.foodOrders;

    // Generate ACTIVE Order HTML
    const generateActiveOrderHtml = (order) => `
        <div class="menu-item" style="border-left: 5px solid #f1c40f;">
            <div>
                <span class="category">${order.date}</span>
                <h3>${order.item} <span style="font-size:0.6em; color:#7f8c8d; font-weight:normal;">(${order.customerName})</span></h3>
                <p style="margin:0; font-size:0.9em;">ID: ${order.id} - Status: <strong>${order.status}</strong></p>
            </div>
            <div style="text-align:right;">
                <span class="price">${order.currency}${order.price * order.rate}</span>
                <form action="/food/admin/status" method="POST" style="margin-top:5px;">
                    <input type="hidden" name="id" value="${order.id}">
                    <button type="submit" name="status" value="Complete" class="btn-success" style="font-size:0.8em; padding:8px 15px;">Mark Complete</button>
                </form>
            </div>
        </div>
    `;

    const activeOrders = filteredOrders.filter(o => o.status !== 'Complete');

    const activeHtml = activeOrders.map(generateActiveOrderHtml).join('');

    const menuHtml = menu.map(item => `
        <div class="menu-item">
            <div style="display:flex; align-items:center; gap:15px;">
                ${item.image ? `<img src="${item.image}" style="width:50px; height:50px; border-radius:50%; object-fit:cover;">` : ''}
                <div>
                    <span class="category">${item.category}</span>
                    <h3>${item.name}</h3>
                </div>
            </div>
            <div style="display:flex; align-items:center;">
                <span class="price">$${item.price}</span>
                <a href="/food/admin/edit/${item.id}"><button>Edit</button></a>
                <form action="/food/admin/delete" method="POST" style="display:inline; margin: 0 0 0 5px;">
                    <input type="hidden" name="id" value="${item.id}">
                    <button type="submit" class="btn-danger" onclick="return confirm('Delete this item?')">Delete</button>
                </form>
            </div>
        </div>
    `).join('');

    res.send(renderPage(`
        <div class="header">
            <h1>Manage Food Menu</h1>
            <div>
                <a href="/food/admin/add" class="btn btn-success">+ Add New Item</a>
            </div>
        </div>
        <h2>Recent Orders</h2>
        
        <form action="/food/admin" method="GET" style="margin-bottom: 20px;">
            <input type="text" name="q" placeholder="Search by Guest Name or Food Item..." value="${req.query.q || ''}" style="max-width:400px; display:inline-block;">
            <button type="submit">Search</button>
            ${req.query.q ? '<a href="/food/admin" class="btn btn-danger" style="margin-left:5px;">Clear</a>' : ''}
        </form>
        
        ${activeHtml.length ? activeHtml : '<p style="opacity:0.6;">No active orders.</p>'}

        <h2>Menu Management</h2>
        ${menuHtml}
    `, false, 'default', res.locals.counts));
});

// 2. Admin: Show 'Add Item' form
router.get('/admin/add', (req, res) => {
    res.send(renderPage(`
        <div class="header"><h1>Add New Menu Item</h1></div>
        <div style="background: white; padding: 20px; border-radius: 10px;">
            <form action="/food/admin/add" method="POST">
                <label><strong>Item Name:</strong></label>
                <input type="text" name="name" placeholder="e.g., Pasta Carbonara" required style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                
                <label><strong>Category:</strong></label>
                <input type="text" name="category" placeholder="e.g., Main, Starter, Dessert" required style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">

                <label><strong>Price ($):</strong></label>
                <input type="number" name="price" min="1" required style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                
                <label><strong>Image URL:</strong></label>
                <input type="text" name="image" placeholder="https://..." style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">

                <br><br>
                <button type="submit" style="width: 100%;">Save Item</button>
            </form>
        </div>
    `, false));
});

// 3. Admin: Process 'Add Item' form
router.post('/admin/add', (req, res) => {
    const { name, category, price, image } = req.body;
    const newId = menu.length > 0 ? Math.max(...menu.map(i => i.id)) + 1 : 1;
    menu.push({ id: newId, name, category, price: parseInt(price), image });
    res.redirect('/food/admin');
});

// 4. Admin: Show 'Edit Item' form
router.get('/admin/edit/:id', (req, res) => {
    const item = menu.find(i => i.id == req.params.id);
    if (!item) return res.redirect('/food/admin');

    res.send(renderPage(`
        <div class="header"><h1>Edit ${item.name}</h1></div>
        <div style="background: white; padding: 20px; border-radius: 10px;">
            <form action="/food/admin/edit" method="POST">
                <input type="hidden" name="id" value="${item.id}">
                <label><strong>Item Name:</strong></label>
                <input type="text" name="name" value="${item.name}" required style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                
                <label><strong>Category:</strong></label>
                <input type="text" name="category" value="${item.category}" required style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">

                <label><strong>Price ($):</strong></label>
                <input type="number" name="price" value="${item.price}" min="1" required style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                
                <label><strong>Image URL:</strong></label>
                <input type="text" name="image" value="${item.image || ''}" style="width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">

                <br><br>
                <button type="submit" style="width: 100%;">Update Item</button>
            </form>
        </div>
    `, false));
});

// 5. Admin: Process 'Edit Item' form
router.post('/admin/edit', (req, res) => {
    const { id, name, category, price, image } = req.body;
    const index = menu.findIndex(i => i.id == id);
    if (index !== -1) {
        menu[index] = { id: parseInt(id), name, category, price: parseInt(price), image };
    }
    res.redirect('/food/admin');
});

// 6. Admin: Process 'Delete Item'
router.post('/admin/delete', (req, res) => {
    const { id } = req.body;
    menu = menu.filter(i => i.id != id);
    res.redirect('/food/admin');
});

// 7. Admin: Toggle Order Status
router.post('/admin/status', (req, res) => {
    const { id, status } = req.body;
    const order = req.app.locals.foodOrders.find(o => o.id === id);
    if (order) order.status = status;
    res.redirect('/food/admin');
});

// 8. Admin: Delete Order History
router.post('/admin/delete-order', (req, res) => {
    const { id } = req.body;
    req.app.locals.foodOrders = req.app.locals.foodOrders.filter(o => o.id !== id);
    res.redirect(req.get('Referer') || '/food/admin');
});

module.exports = router;