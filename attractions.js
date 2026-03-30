const express = require('express');
const router = express.Router();

// Mock Data for Local Attractions
let attractions = [
    { id: 1, name: 'City Palace', category: 'Historic Landmark', distance: '5 km', description: 'A stunning complex of palaces, courtyards and gardens, built over a period of nearly 400 years, that gives a panoramic view of the city and its surroundings.', image: 'https://images.unsplash.com/photo-1599539831213-f4c397435736?auto=format&fit=crop&w=800&q=80' },
    { id: 2, name: 'Lake Pichola', category: 'Natural Beauty', distance: '3 km', description: 'An artificial fresh water lake, created in the year 1362 AD, it is one of the several contiguous lakes, and developed over the last few centuries in and around the famous Udaipur city.', image: 'https://images.unsplash.com/photo-1617634667339-150432790b6a?auto=format&fit=crop&w=800&q=80' },
    { id: 3, name: 'Vintage Car Museum', category: 'Museum', distance: '7 km', description: 'A collection of classic and vintage cars owned by the royalty of Mewar, showcasing a rich automotive heritage in a luxurious setting.', image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80' },
    { id: 4, name: 'Saheliyon Ki Bari', category: 'Garden', distance: '6 km', description: 'A major garden and a popular tourist space in Udaipur. It has fountains and kiosks, a lotus pool and marble elephants.', image: 'https://images.unsplash.com/photo-1541492456972-88821a17c16c?auto=format&fit=crop&w=800&q=80' }
];

// Reusable renderPage function (adapted from other modules)
const renderPage = (content, isGuest = true, theme = 'default', counts = { food: 0, hotel: 0, event: 0 }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isGuest ? 'Local Attractions | Grand Plaza' : 'Admin: Manage Attractions'}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        body { margin: 0; font-family: 'Poppins', sans-serif; transition: background-color 0.3s, color 0.3s; }
        .container { width: 100%; max-width: 1400px; margin: 0 auto; padding: 40px; box-sizing: border-box; }

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

        /* Guest Styles - Attractions Specific */
        :root {
            --primary-gold: #C5A059; --text-dark: #2C2C2C; --text-light: #FAF9F6;
            --bg-warm: #f9f7f2; --bg-beige: #ebe4d6;
            --serif-font: 'Playfair Display', serif; --sans-font: 'Montserrat', sans-serif;
        }
        .guest { background: var(--bg-warm); color: var(--text-dark); font-family: var(--sans-font); }
        .guest .header { text-align: center; margin-bottom: 60px; }
        .guest .header h1 { font-weight: 400; font-size: 3.5em; color: var(--text-dark); margin: 0 0 15px 0; font-family: var(--serif-font); text-transform: uppercase; letter-spacing: 4px; }
        .guest .header p { font-size: 1.1em; color: #777; max-width: 600px; margin: 0 auto 20px auto; line-height: 1.7; }
        .guest .back-btn { display: inline-block; background: transparent; border: 1px solid var(--primary-gold); color: var(--primary-gold); padding: 12px 30px; text-transform: uppercase; letter-spacing: 2px; text-decoration: none; transition: all 0.4s; border-radius: 2px; font-weight: 500; }
        .guest .back-btn:hover { background: var(--primary-gold); color: #fff; box-shadow: 0 10px 20px rgba(197, 160, 89, 0.3); }
        
        .attractions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 40px; }
        
        .attraction-card {
            position: relative;
            height: 480px;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .attraction-card:hover { transform: translateY(-10px); box-shadow: 0 30px 60px rgba(0,0,0,0.2); }
        
        .attraction-img {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background-size: cover;
            background-position: center;
            transition: transform 0.8s ease;
        }
        .attraction-card:hover .attraction-img { transform: scale(1.1); }
        
        .attraction-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%);
            transition: background 0.5s ease;
        }
        .attraction-card:hover .attraction-overlay { background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 60%, transparent 100%); }

        .attraction-content {
            position: absolute;
            bottom: 0; left: 0;
            width: 100%;
            padding: 30px;
            box-sizing: border-box;
            color: #fff;
            transform: translateY(calc(100% - 130px));
            transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .attraction-card:hover .attraction-content { transform: translateY(0); }
        
        .attraction-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 0.8em; text-transform: uppercase; letter-spacing: 1.5px; }
        .attraction-meta .category { background: var(--primary-gold); color: #fff; padding: 4px 10px; border-radius: 20px; font-weight: 500; }
        .attraction-meta .distance { opacity: 0.8; }
        
        .attraction-title {
            font-family: var(--serif-font);
            font-size: 2em;
            margin: 0 0 15px 0;
            font-weight: 600;
            line-height: 1.2;
        }
        
        .attraction-desc {
            font-size: 0.95em;
            line-height: 1.7;
            margin-bottom: 25px;
            opacity: 0;
            transition: opacity 0.5s ease 0.2s;
        }
        .attraction-card:hover .attraction-desc { opacity: 1; }

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
            <a href="/offers/admin">🎁 Offers</a>
            <a href="/attractions/admin" class="active">📍 Attractions</a>
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
    const attractionsHtml = attractions.map((att, idx) => `
        <div class="attraction-card reveal" style="transition-delay: ${idx * 150}ms">
            <div class="attraction-img" style="background-image: url('${att.image}')"></div>
            <div class="attraction-overlay"></div>
            <div class="attraction-content">
                <div class="attraction-meta">
                    <span class="category">${att.category}</span>
                    <span class="distance">${att.distance} away</span>
                </div>
                <h3 class="attraction-title">${att.name}</h3>
                <p class="attraction-desc">${att.description}</p>
            </div>
        </div>
    `).join('');

    res.send(renderPage(`
        <div class="header">
            <h1>Local Attractions</h1>
            <p>Discover the rich culture and breathtaking sights surrounding The Grand Plaza. Our concierge is delighted to help you plan your perfect excursion.</p>
            <a href="/" class="back-btn">Back to Home</a>
        </div>
        
        <div class="attractions-grid">
            ${attractionsHtml}
        </div>
    `, true, req.app.locals.guestTheme));
});

// --- ADMIN/OWNER VIEW ---
router.get('/admin', (req, res) => {
    const listHtml = attractions.map(att => `
        <div class="card" style="display: flex; gap: 20px; align-items: center;">
            <img src="${att.image}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;">
            <div style="flex-grow: 1;">
                <h3 style="margin: 0 0 5px 0; font-size: 1.3em; color: #fff;">${att.name}</h3>
                <p style="margin: 0 0 5px 0; opacity: 0.8; font-size: 0.9em;">${att.category} - ${att.distance}</p>
                <p style="margin: 0; opacity: 0.6; font-size: 0.8em; font-family: monospace;">${att.description}</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <form action="/attractions/admin/delete" method="POST" style="margin: 0;">
                    <input type="hidden" name="id" value="${att.id}">
                    <button type="submit" class="btn-danger" onclick="return confirm('Delete this attraction?')">Delete</button>
                </form>
            </div>
        </div>
    `).join('');

    res.send(renderPage(`
        <div class="header"><h1>Manage Local Attractions</h1></div>
        
        <div class="card" style="margin-bottom: 40px;">
            <h2>Add New Attraction</h2>
            <form action="/attractions/admin/add" method="POST" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                <div style="grid-column: span 3;"><label>Name:</label><input type="text" name="name" placeholder="e.g. City Palace" required></div>
                <div><label>Category:</label><input type="text" name="category" placeholder="e.g. Historic" required></div>
                <div><label>Distance:</label><input type="text" name="distance" placeholder="e.g. 5 km" required></div>
                <div style="grid-column: span 3;"><label>Image URL:</label><input type="text" name="image" placeholder="https://..." required></div>
                <div style="grid-column: span 3;"><label>Description:</label><textarea name="description" rows="3" placeholder="Brief description of the attraction..." required></textarea></div>
                <div style="grid-column: span 3; display: flex; justify-content: flex-end;"><button type="submit" class="btn-success">Add Attraction</button></div>
            </form>
        </div>

        <h2>Current Attractions</h2>
        <div style="display: flex; flex-direction: column; gap: 15px;">
            ${listHtml.length ? listHtml : '<p style="opacity: 0.6;">No attractions available.</p>'}
        </div>
    `, false, 'default', res.locals.counts));
});

router.post('/admin/add', (req, res) => {
    const { name, category, distance, image, description } = req.body;
    const newId = attractions.length > 0 ? Math.max(...attractions.map(a => a.id)) + 1 : 1;
    attractions.push({ id: newId, name, category, distance, description, image });
    res.redirect('/attractions/admin');
});

router.post('/admin/delete', (req, res) => {
    const { id } = req.body;
    attractions = attractions.filter(a => a.id !== parseInt(id));
    res.redirect('/attractions/admin');
});

module.exports = router;