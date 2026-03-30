const express = require('express');
const router = express.Router();

// Mock Data for Gallery
let galleryImages = [
    { id: 1, url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80', title: 'The Presidential Suite', category: 'Rooms', details: '1200 sq. ft. | Ocean View', shape: 'wide' },
    { id: 2, url: 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=800&q=80', title: 'Himalayan View Pool', category: 'Spa', details: 'Infinity Edge | Heated', shape: 'tall' },
    { id: 3, url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80', title: 'Lobby Lounge', category: 'Dining', details: '24/7 Service | Live Music', shape: 'square' },
    { id: 4, url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80', title: 'Sanctuaries of Rest', category: 'Rooms', details: '750 sq. ft. | Valley Facing', shape: 'tall' },
    { id: 5, url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80', title: 'Rooftop Bar', category: 'Dining', details: 'Panoramic City Views', shape: 'wide' },
    { id: 6, url: 'https://images.unsplash.com/photo-1598539924402-54c114474f85?auto=format&fit=crop&w=800&q=80', title: 'Rejuvenation Spa', category: 'Spa', details: 'Holistic Therapies', shape: 'square' }
];

// Helper for HTML with Styles (Matching your other routes)
const renderPage = (content, isGuest = true, theme = 'default', counts = { food: 0, hotel: 0, event: 0 }) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isGuest ? 'Gallery | Grand Plaza' : 'Admin: Manage Gallery'}</title>
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
        .admin input, .admin select { width: 100%; padding: 12px; margin: 8px 0 16px; box-sizing: border-box; border-radius: 8px; font-size: 1em; font-family: 'Poppins', sans-serif; background: rgba(0,0,0,0.4) !important; border: 1px solid rgba(184, 134, 11, 0.4) !important; color: white !important; backdrop-filter: blur(5px); transition: 0.3s; }
        .admin input:focus, .admin select:focus { border-color: #d4af37 !important; outline: none; box-shadow: 0 0 10px rgba(212, 175, 55, 0.3); }
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

        /* Guest Styles */
        :root {
            --primary-gold: #C5A059; --text-dark: #2C2C2C; --text-light: #FAF9F6;
            --bg-warm: #f9f7f2; --bg-beige: #ebe4d6;
            --serif-font: 'Playfair Display', serif; --sans-font: 'Montserrat', sans-serif;
        }
        .guest { background: var(--bg-warm); color: var(--text-dark); font-family: var(--sans-font); }
        .guest .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 1px solid var(--primary-gold); padding-bottom: 20px; }
        .guest .header h1 { font-weight: 300; font-size: 2.5em; color: var(--text-dark); margin: 0; font-family: var(--serif-font); text-transform: uppercase; letter-spacing: 2px; }
        .guest .back-btn { background: var(--text-dark); text-decoration: none; padding: 10px 20px; color: white; font-size: 0.85em; text-transform: uppercase; letter-spacing: 1px; transition: 0.3s; }
        .guest .back-btn:hover { background: var(--primary-gold); }
        
        /* Gallery Filters */
        .gallery-filters { display: flex; justify-content: center; gap: 30px; margin-bottom: 50px; flex-wrap: wrap; }
        .filter-btn { background: transparent; border: none; color: var(--text-dark); font-family: var(--sans-font); text-transform: uppercase; letter-spacing: 2px; font-size: 0.85em; cursor: pointer; position: relative; padding-bottom: 5px; opacity: 0.5; transition: opacity 0.3s; }
        .filter-btn.active, .filter-btn:hover { opacity: 1; }
        .filter-btn::after { content: ''; position: absolute; width: 0; height: 1px; bottom: 0; left: 0; background: var(--primary-gold); transition: width 0.3s; }
        .filter-btn.active::after, .filter-btn:hover::after { width: 100%; }

        /* Gallery Grid */
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); grid-auto-rows: 300px; gap: 30px; grid-auto-flow: dense; }
        .gallery-item { position: relative; overflow: hidden; border-radius: 4px; border: 1px solid rgba(197, 160, 89, 0.3); background: #000; cursor: none; }
        .gallery-item.tall { grid-row: span 2; }
        .gallery-item.wide { grid-column: span 2; }
        @media (max-width: 768px) { .gallery-item.wide { grid-column: span 1; } }

        /* Parallax & Zoom effect */
        .parallax-wrapper { width: 100%; height: 120%; position: absolute; top: -10%; left: 0; will-change: transform; }
        .gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.6s cubic-bezier(0.2, 1, 0.3, 1); }
        .gallery-item:hover img { transform: scale(1.05); }
        .gallery-item .overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); opacity: 0; transition: opacity 0.5s; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fff; text-align: center; padding: 20px; pointer-events: none; }
        .gallery-item:hover .overlay { opacity: 1; }
        .overlay h3 { font-family: var(--serif-font); font-size: 1.8em; font-weight: 400; margin: 0 0 10px 0; transform: translateY(15px); transition: transform 0.5s; text-transform: uppercase; letter-spacing: 2px; }
        .overlay p { font-size: 0.75em; text-transform: uppercase; letter-spacing: 2px; color: var(--primary-gold); margin: 0; transform: translateY(15px); transition: transform 0.5s 0.1s; }
        .gallery-item:hover .overlay h3, .gallery-item:hover .overlay p { transform: translateY(0); }

        .item-details { position: absolute; bottom: 15px; right: 15px; font-size: 0.65em; text-transform: uppercase; letter-spacing: 1.5px; background: rgba(0,0,0,0.7); color: #fff; padding: 6px 12px; border-radius: 2px; border: 1px solid rgba(197, 160, 89, 0.4); z-index: 2; pointer-events: none; backdrop-filter: blur(5px); }
        
        /* Custom Cursor */
        .custom-cursor { position: fixed; top: 0; left: 0; width: 80px; height: 80px; border-radius: 50%; background: rgba(197, 160, 89, 0.9); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.75em; font-family: var(--sans-font); text-transform: uppercase; letter-spacing: 2px; pointer-events: none; z-index: 9999; opacity: 0; transform: translate(-50%, -50%) scale(0.2); transition: transform 0.3s cubic-bezier(0.2, 1, 0.3, 1), opacity 0.3s; }
        .custom-cursor.active { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        @media (hover: none) and (pointer: coarse) { .custom-cursor { display: none !important; } .gallery-item { cursor: auto; } }

        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out; }
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
            <a href="/gallery/admin" class="active">🖼️ Gallery</a>
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
    const categories = ['All', ...new Set(galleryImages.map(img => img.category))];
    const filtersHtml = categories.map((cat, idx) => `
        <button class="filter-btn ${idx === 0 ? 'active' : ''}" data-filter="${cat === 'All' ? 'all' : cat}">${cat}</button>
    `).join('');

    const galleryHtml = galleryImages.map((img, idx) => `
        <div class="gallery-item ${img.shape} reveal" data-category="${img.category}" style="transition-delay: ${(idx % 3) * 100}ms">
            <div class="parallax-wrapper" data-speed="0.05">
                <img src="${img.url}" alt="${img.title}">
            </div>
            <div class="overlay">
                <h3>${img.title}</h3>
                <p>${img.category}</p>
            </div>
            ${img.details ? `<div class="item-details">${img.details}</div>` : ''}
        </div>
    `).join('');

    res.send(renderPage(`
        <div class="custom-cursor">View</div>
        <div class="header">
            <h1>The Curated Canvas</h1>
            <a href="/" class="back-btn">Back to Home</a>
        </div>
        
        <div class="gallery-filters">
            ${filtersHtml}
        </div>

        <div class="gallery-grid">
            ${galleryHtml}
        </div>

        <script>
            const filters = document.querySelectorAll('.filter-btn');
            const items = document.querySelectorAll('.gallery-item');
            
            // Filter Logic
            filters.forEach(btn => {
                btn.addEventListener('click', () => {
                    filters.forEach(f => f.classList.remove('active'));
                    btn.classList.add('active');
                    const filter = btn.dataset.filter;
                    items.forEach(item => {
                        if (filter === 'all' || item.dataset.category === filter) {
                            item.style.display = 'block';
                            setTimeout(() => item.classList.add('active'), 50);
                        } else {
                            item.style.display = 'none';
                            item.classList.remove('active');
                        }
                    });
                });
            });

            // Custom Cursor Logic
            const cursor = document.querySelector('.custom-cursor');
            document.addEventListener('mousemove', e => {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            });
            items.forEach(item => {
                item.addEventListener('mouseenter', () => cursor.classList.add('active'));
                item.addEventListener('mouseleave', () => cursor.classList.remove('active'));
            });

            // Parallax Logic
            window.addEventListener('scroll', () => {
                items.forEach(item => {
                    const rect = item.getBoundingClientRect();
                    if(rect.top < window.innerHeight && rect.bottom > 0) {
                        const wrapper = item.querySelector('.parallax-wrapper');
                        const speed = parseFloat(wrapper.dataset.speed) || 0.05;
                        const yPos = (window.innerHeight - rect.top) * speed - 20; 
                        wrapper.style.transform = \`translateY(\${yPos}px)\`;
                    }
                });
            });
        </script>
    `, true, req.app.locals.guestTheme));
});

// --- ADMIN/OWNER VIEW ---
router.get('/admin', (req, res) => {
    const listHtml = galleryImages.map(img => `
        <div class="card" style="display: flex; gap: 20px; align-items: center;">
            <img src="${img.url}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px;">
            <div style="flex-grow: 1;">
                <h3 style="margin: 0; font-size: 1.2em;">${img.title}</h3>
                <p style="margin: 5px 0 0 0; opacity: 0.7; font-size: 0.9em;">Category: ${img.category}</p>
            </div>
            <form action="/gallery/admin/delete" method="POST" style="margin: 0;">
                <input type="hidden" name="id" value="${img.id}">
                <button type="submit" class="btn-danger" onclick="return confirm('Delete this image?')">Delete</button>
            </form>
        </div>
    `).join('');

    res.send(renderPage(`
        <div class="header"><h1>Manage Gallery</h1></div>
        
        <div class="card" style="margin-bottom: 40px;">
            <h2>Add New Image</h2>
            <form action="/gallery/admin/add" method="POST" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div><label>Image URL:</label><input type="text" name="url" placeholder="https://..." required></div>
                <div><label>Title:</label><input type="text" name="title" placeholder="e.g. Lobby Lounge" required></div>
                <div><label>Category:</label><input type="text" name="category" placeholder="e.g. Rooms, Spa, Dining" required></div>
                <div style="display: flex; align-items: flex-end;"><button type="submit" class="btn-success" style="width: 100%;">Add Image</button></div>
            </form>
        </div>

        <h2>Current Images</h2>
        <div style="display: flex; flex-direction: column; gap: 15px;">
            ${listHtml.length ? listHtml : '<p style="opacity: 0.6;">No images in the gallery.</p>'}
        </div>
    `, false, 'default', res.locals.counts));
});

router.post('/admin/add', (req, res) => {
    const { url, title, category } = req.body;
    const newId = galleryImages.length > 0 ? Math.max(...galleryImages.map(i => i.id)) + 1 : 1;
    galleryImages.push({ id: newId, url, title, category });
    res.redirect('/gallery/admin');
});

router.post('/admin/delete', (req, res) => {
    const { id } = req.body;
    galleryImages = galleryImages.filter(i => i.id !== parseInt(id));
    res.redirect('/gallery/admin');
});

module.exports = router;