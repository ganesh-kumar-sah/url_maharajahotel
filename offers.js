const express = require('express');
const router = express.Router();

let offers = [
    { id: 1, title: 'Weekend Staycation', discount: '20% OFF', description: 'Enjoy a luxurious weekend with complimentary breakfast and spa access.', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', validUntil: '2024-12-31' },
    { id: 2, title: 'Fine Dining Experience', discount: '15% OFF', description: 'Experience culinary excellence with a discount on our tasting menu.', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80', validUntil: '2024-11-30' },
    { id: 3, title: 'Holistic Spa Retreat', discount: 'Buy 1 Get 1', description: 'Rejuvenate your senses with our signature spa therapies.', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', validUntil: '2024-10-15' }
];

const renderPage = (content, isGuest = true, theme = 'default', counts = { food: 0, hotel: 0, event: 0 }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isGuest ? 'Exclusive Offers | Grand Plaza' : 'Admin: Manage Offers'}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; font-family: 'Poppins', sans-serif; transition: background-color 0.3s, color 0.3s; }
        .container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 40px; box-sizing: border-box; }

        /* Admin Styles */
        :root { 
            --bg-dark: #121212; --card-dark: #1e1e1e; --text-dark: #e0e0e0; --accent-dark: #d4af37;
            --bg-light: #f5f5f5; --card-light: #ffffff; --text-light: #333333; --accent-light: #2c3e50;
            --bg-blue: #0f172a; --card-blue: #1e293b; --text-blue: #f8fafc; --accent-blue: #38bdf8;
        }
        
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
        .admin .btn-danger { background-color: #ef4444 !important; color: white !important; }
        .admin .btn-success { background-color: #22c55e !important; color: white !important; }
        .admin input, .admin select, .admin textarea { width: 100%; padding: 12px; margin: 8px 0 16px; box-sizing: border-box; border-radius: 8px; font-size: 1em; font-family: 'Poppins', sans-serif; background: rgba(0,0,0,0.4) !important; border: 1px solid rgba(184, 134, 11, 0.4) !important; color: white !important; backdrop-filter: blur(5px); transition: 0.3s; }
        .admin input:focus, .admin select:focus, .admin textarea:focus { border-color: #d4af37 !important; outline: none; box-shadow: 0 0 10px rgba(212, 175, 55, 0.3); }
        .admin label { font-weight: 500; font-size: 0.9em; margin-bottom: 4px; display: block; color: #ccc; }

        /* Sidebar Styles for Admin */
        .sidebar { width: 260px; color: #ecf0f1; display: flex; flex-direction: column; padding: 30px 20px; z-index: 100; flex-shrink: 0; background: rgba(10, 10, 10, 0.65); backdrop-filter: blur(20px); border-right: 1px solid rgba(255,255,255,0.1); box-shadow: 5px 0 30px rgba(0,0,0,0.5); }
        .sidebar-header { font-family: 'Playfair Display', serif; font-size: 1.6em; margin-bottom: 50px; text-align: center; color: #d4af37; text-transform: uppercase; letter-spacing: 2px; position: relative; }
        .sidebar-header::after { content: ''; display: block; width: 40px; height: 2px; background: #d4af37; margin: 15px auto 0; }
        .nav-links { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 15px; }
        .nav-links a { display: flex; align-items: center; padding: 15px 20px; color: rgba(255,255,255,0.6); text-decoration: none; border-radius: 8px; transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); font-weight: 500; font-size: 0.95em; border-left: 3px solid transparent; background: linear-gradient(90deg, transparent 0%, transparent 100%); }
        .nav-links a:hover, .nav-links a.active { color: #fff; background: linear-gradient(90deg, rgba(212, 175, 55, 0.15) 0%, transparent 100%); border-left: 3px solid #d4af37; padding-left: 28px; }
        .main-content-wrapper { flex-grow: 1; height: 100vh; overflow-y: auto; background: inherit; }
        .badge { background: #e74c3c; color: white; padding: 2px 6px; border-radius: 10px; font-size: 0.75em; margin-left: 8px; vertical-align: middle; font-weight: bold; }
        body.admin .container { max-width: 100%; padding: 40px; }

        /* Guest Styles - Offers Specific */
        :root {
            --primary-gold: #C5A059; --text-dark: #2C2C2C; --text-light: #FAF9F6;
            --bg-warm: #f9f7f2; --bg-beige: #ebe4d6;
            --serif-font: 'Playfair Display', serif; --sans-font: 'Montserrat', sans-serif;
        }
        .guest { background: var(--bg-warm); color: var(--text-dark); font-family: var(--sans-font); }
        .guest .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 50px; border-bottom: 1px solid var(--primary-gold); padding-bottom: 20px; }
        .guest .header h1 { font-weight: 300; font-size: 2.8em; color: var(--text-dark); margin: 0; font-family: var(--serif-font); text-transform: uppercase; letter-spacing: 2px; }
        .guest .back-btn { background: var(--text-dark); text-decoration: none; padding: 12px 25px; color: white; font-size: 0.85em; text-transform: uppercase; letter-spacing: 1.5px; transition: 0.4s; border: 1px solid var(--text-dark); }
        .guest .back-btn:hover { background: transparent; color: var(--text-dark); }
        
        .offers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; }
        
        .offer-card {
            background: #fff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 15px 35px rgba(0,0,0,0.05);
            transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
            position: relative;
            display: flex;
            flex-direction: column;
            border: 1px solid rgba(197, 160, 89, 0.1);
        }
        .offer-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 25px 50px rgba(197, 160, 89, 0.15);
            border-color: rgba(197, 160, 89, 0.5);
        }
        
        .offer-img-wrapper {
            position: relative;
            height: 220px;
            overflow: hidden;
        }
        .offer-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.8s ease;
        }
        .offer-card:hover .offer-img {
            transform: scale(1.1);
        }
        
        .discount-badge {
            position: absolute;
            top: 20px;
            right: -10px;
            background: var(--primary-gold);
            color: #fff;
            padding: 8px 20px;
            font-family: var(--serif-font);
            font-size: 1.2em;
            font-weight: 600;
            letter-spacing: 1px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 2;
            animation: floatBadge 3s ease-in-out infinite;
        }
        @keyframes floatBadge {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }

        .offer-content {
            padding: 30px;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            position: relative;
            background: #fff;
            z-index: 1;
        }
        .offer-content::before {
            content: '';
            position: absolute;
            top: 0; left: 50%; transform: translateX(-50%);
            width: 50px; height: 3px;
            background: var(--primary-gold);
        }
        
        .offer-title {
            font-family: var(--serif-font);
            font-size: 1.6em;
            color: var(--text-dark);
            margin: 10px 0 15px 0;
            font-weight: 600;
            line-height: 1.3;
        }
        
        .offer-desc {
            color: #666;
            font-size: 0.95em;
            line-height: 1.6;
            margin-bottom: 25px;
            flex-grow: 1;
        }
        
        .offer-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: auto;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        
        .validity {
            font-size: 0.8em;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 500;
        }
        .validity span { color: var(--primary-gold); }
        
        .btn-claim {
            background: transparent;
            color: var(--primary-gold);
            border: 1px solid var(--primary-gold);
            padding: 8px 20px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-size: 0.8em;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.3s;
            border-radius: 2px;
        }
        .btn-claim:hover {
            background: var(--primary-gold);
            color: #fff;
            box-shadow: 0 5px 15px rgba(197, 160, 89, 0.3);
        }

        .reveal { opacity: 0; transform: translateY(40px); transition: all 0.8s cubic-bezier(0.25, 0.8, 0.25, 1); }
        .reveal.active { opacity: 1; transform: translateY(0); }
    </style>
</head>
<body class="${isGuest ? `guest theme-${theme}` : 'admin'}">
    ${!isGuest ? `
    <div class="video-bg-container">
        <video autoplay muted loop playsinline crossorigin="anonymous" poster="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80">
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
            <a href="/events/admin">📅 Table Reservations ${counts && counts.event > 0 ? `<span class="badge">${counts.event}</span>` : ''}</a>
            <a href="/admin/history">📜 Order History</a>
            <a href="/gallery/admin">🖼️ Gallery</a>
            <a href="/offers/admin" class="active">🎁 Offers</a>
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
</body>
</html>
`;

// --- GUEST VIEW ---
router.get('/', (req, res) => {
    const offersHtml = offers.map((offer, idx) => `
        <div class="offer-card reveal" style="transition-delay: ${(idx % 3) * 150}ms">
            <div class="offer-img-wrapper">
                <img src="${offer.image}" alt="${offer.title}" class="offer-img">
                <div class="discount-badge">${offer.discount}</div>
            </div>
            <div class="offer-content">
                <h3 class="offer-title">${offer.title}</h3>
                <p class="offer-desc">${offer.description}</p>
                <div class="offer-meta">
                    <div class="validity">Valid until: <span>${new Date(offer.validUntil).toLocaleDateString()}</span></div>
                    <a href="#claim" class="btn-claim" onclick="alert('Offer claimed! Please present this code at the reception: GP-OFFER-${offer.id}')">Claim</a>
                </div>
            </div>
        </div>
    `).join('');

    res.send(renderPage(`
        <div class="header">
            <h1>Exclusive Offers</h1>
            <a href="/" class="back-btn">Back to Home</a>
        </div>
        
        <div class="offers-grid">
            ${offersHtml}
        </div>
    `, true, req.app.locals.guestTheme));
});

// --- ADMIN/OWNER VIEW ---
router.get('/admin', (req, res) => {
    const listHtml = offers.map(offer => `
        <div class="card" style="display: flex; gap: 20px; align-items: center;">
            <img src="${offer.image}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;">
            <div style="flex-grow: 1;">
                <h3 style="margin: 0 0 5px 0; font-size: 1.3em; color: #fff;">${offer.title} <span style="background: var(--primary-gold); color: #000; padding: 2px 8px; border-radius: 4px; font-size: 0.6em; vertical-align: middle;">${offer.discount}</span></h3>
                <p style="margin: 0 0 5px 0; opacity: 0.8; font-size: 0.9em;">${offer.description}</p>
                <p style="margin: 0; opacity: 0.6; font-size: 0.8em; font-family: monospace;">Valid until: ${offer.validUntil}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <form action="/offers/admin/delete" method="POST" style="margin: 0;">
                    <input type="hidden" name="id" value="${offer.id}">
                    <button type="submit" class="btn-danger" onclick="return confirm('Delete this offer?')">Delete</button>
                </form>
            </div>
        </div>
    `).join('');

    res.send(renderPage(`
        <div class="header"><h1>Manage Offers</h1></div>
        
        <div class="card" style="margin-bottom: 40px;">
            <h2>Add New Offer</h2>
            <form action="/offers/admin/add" method="POST" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="grid-column: span 2;"><label>Title:</label><input type="text" name="title" placeholder="e.g. Weekend Staycation" required></div>
                <div><label>Discount/Badge Text:</label><input type="text" name="discount" placeholder="e.g. 20% OFF" required></div>
                <div><label>Valid Until:</label><input type="date" name="validUntil" required></div>
                <div style="grid-column: span 2;"><label>Description:</label><textarea name="description" rows="3" placeholder="Brief description of the offer..." required></textarea></div>
                <div style="grid-column: span 2;"><label>Image URL:</label><input type="text" name="image" placeholder="https://..." required></div>
                <div style="grid-column: span 2; display: flex; justify-content: flex-end;"><button type="submit" class="btn-success">Add Offer</button></div>
            </form>
        </div>

        <h2>Current Offers</h2>
        <div style="display: flex; flex-direction: column; gap: 15px;">
            ${listHtml.length ? listHtml : '<p style="opacity: 0.6;">No offers available.</p>'}
        </div>
    `, false, 'default', res.locals.counts));
});

router.post('/admin/add', (req, res) => {
    const { title, discount, validUntil, description, image } = req.body;
    const newId = offers.length > 0 ? Math.max(...offers.map(o => o.id)) + 1 : 1;
    offers.push({ id: newId, title, discount, description, image, validUntil });
    res.redirect('/offers/admin');
});

router.post('/admin/delete', (req, res) => {
    const { id } = req.body;
    offers = offers.filter(o => o.id !== parseInt(id));
    res.redirect('/offers/admin');
});

module.exports = router;