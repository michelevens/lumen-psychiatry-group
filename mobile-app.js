/**
 * EnnHealth Psychiatry — Mobile Native App Experience
 * Include this script on any page to add:
 *   - Bottom navigation bar with Explore drawer
 *   - Floating "Book Now" button
 *   - Native app feel (touch feedback, safe areas, scroll effects)
 *   - PWA manifest link
 */
(function() {
  'use strict';
  if (window.__ennMobileApp) return; // prevent double-init
  window.__ennMobileApp = true;

  var isMobile = window.innerWidth <= 768;

  // ─── Inject PWA meta tags if missing ───
  if (!document.querySelector('link[rel="manifest"]')) {
    var isSubdir = location.pathname.split('/').filter(Boolean).length > 0 && !location.pathname.endsWith('.html');
    var prefix = location.pathname.includes('/blog/') || location.pathname.includes('/adhd/') || location.pathname.includes('/anxiety/') || location.pathname.includes('/alcohol-use/') || location.pathname.includes('/admin/') ? '../' : '/';
    var manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = prefix + 'manifest.json';
    document.head.appendChild(manifest);
  }
  if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
    var m1 = document.createElement('meta'); m1.name = 'apple-mobile-web-app-capable'; m1.content = 'yes'; document.head.appendChild(m1);
    var m2 = document.createElement('meta'); m2.name = 'apple-mobile-web-app-status-bar-style'; m2.content = 'default'; document.head.appendChild(m2);
  }
  // Fix viewport for safe areas
  var vp = document.querySelector('meta[name="viewport"]');
  if (vp && vp.content.indexOf('viewport-fit') === -1) {
    vp.content = vp.content + ', viewport-fit=cover';
  }

  // ─── Inject CSS ───
  var css = document.createElement('style');
  css.textContent = [
    '/* ─── Mobile Bottom Nav ─── */',
    '.enn-bottom-nav { display:none; position:fixed; bottom:0; left:0; right:0; z-index:500;',
    '  background:rgba(255,255,255,0.97); backdrop-filter:blur(20px) saturate(180%);',
    '  -webkit-backdrop-filter:blur(20px) saturate(180%);',
    '  border-top:1px solid rgba(226,232,240,0.8);',
    '  padding:6px 0 calc(6px + env(safe-area-inset-bottom,0px));',
    '  box-shadow:0 -2px 20px rgba(0,0,0,0.06); }',
    '.enn-bottom-nav-inner { display:flex; justify-content:space-around; align-items:center; max-width:500px; margin:0 auto; }',
    '.enn-bnav { display:flex; flex-direction:column; align-items:center; gap:2px;',
    '  text-decoration:none; color:#94a3b8; font-size:10px; font-weight:600; letter-spacing:0.3px;',
    '  padding:6px 12px; border-radius:12px; transition:all 0.2s; -webkit-tap-highlight-color:transparent; min-width:56px; font-family:-apple-system,BlinkMacSystemFont,sans-serif; cursor:pointer; border:none; background:none; }',
    '.enn-bnav svg { width:22px; height:22px; stroke-width:1.8; transition:all 0.2s; }',
    '.enn-bnav.active { color:#2C4A5A; }',
    '.enn-bnav.active svg { stroke-width:2.2; }',
    '.enn-bnav:active { transform:scale(0.92); }',
    '.enn-cta-circle { width:48px; height:48px; border-radius:50%;',
    '  background:linear-gradient(135deg,#D4A855,#c49645);',
    '  display:flex; align-items:center; justify-content:center;',
    '  box-shadow:0 4px 16px rgba(212,168,85,0.4); margin-top:-20px; transition:transform 0.2s; }',
    '.enn-cta-circle:active { transform:scale(0.9); }',
    '.enn-cta-circle svg { width:22px; height:22px; color:white; stroke:white; stroke-width:2; }',
    '',
    '/* ─── Explore Drawer ─── */',
    '.enn-explore-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:550; opacity:0; transition:opacity 0.3s; }',
    '.enn-explore-overlay.active { display:block; opacity:1; }',
    '.enn-explore-drawer { position:fixed; bottom:0; left:0; right:0; z-index:600;',
    '  background:white; border-radius:20px 20px 0 0;',
    '  box-shadow:0 -8px 40px rgba(0,0,0,0.15);',
    '  transform:translateY(100%); transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);',
    '  padding:0 0 calc(16px + env(safe-area-inset-bottom,0px));',
    '  max-height:75vh; overflow-y:auto; -webkit-overflow-scrolling:touch; }',
    '.enn-explore-drawer.open { transform:translateY(0); }',
    '.enn-explore-handle { width:36px; height:4px; background:#d1d5db; border-radius:2px; margin:10px auto 0; }',
    '.enn-explore-header { padding:16px 20px 12px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1f5f9; }',
    '.enn-explore-header h3 { font-size:17px; font-weight:700; color:#1a3545; margin:0; }',
    '.enn-explore-close { background:none; border:none; color:#94a3b8; font-size:24px; cursor:pointer; padding:4px 8px; line-height:1; }',
    '.enn-explore-section { padding:16px 20px 8px; }',
    '.enn-explore-section-title { font-size:11px; font-weight:700; color:#D4A855; text-transform:uppercase; letter-spacing:1.2px; margin-bottom:10px; }',
    '.enn-explore-links { display:flex; flex-direction:column; gap:2px; }',
    '.enn-explore-link { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:12px; text-decoration:none; color:#1e293b; font-size:15px; font-weight:500; transition:background 0.15s; -webkit-tap-highlight-color:transparent; }',
    '.enn-explore-link:active { background:#f1f5f9; }',
    '.enn-explore-link svg { width:20px; height:20px; color:#2C4A5A; stroke:#2C4A5A; flex-shrink:0; }',
    '.enn-explore-link .enn-el-text { flex:1; }',
    '.enn-explore-link .enn-el-sub { font-size:12px; color:#94a3b8; font-weight:400; }',
    '.enn-explore-link .enn-el-arrow { color:#d1d5db; font-size:16px; }',
    '.enn-explore-divider { height:1px; background:#f1f5f9; margin:4px 20px; }',
    '',
    '/* ─── Floating Action Button ─── */',
    '.enn-fab { display:none; position:fixed; bottom:calc(76px + env(safe-area-inset-bottom,0px)); right:16px; z-index:400;',
    '  background:linear-gradient(135deg,#D4A855,#c49645); color:white; border:none; border-radius:50px;',
    '  padding:14px 24px; font-size:15px; font-weight:700; font-family:inherit; cursor:pointer;',
    '  box-shadow:0 4px 20px rgba(212,168,85,0.5); transition:all 0.3s; opacity:0; transform:translateY(20px);',
    '  -webkit-tap-highlight-color:transparent; }',
    '.enn-fab.visible { opacity:1; transform:translateY(0); }',
    '.enn-fab:active { transform:scale(0.95) translateY(0); }',
    '',
    '/* ─── Native Feel ─── */',
    '@media(max-width:768px) {',
    '  .enn-bottom-nav { display:block; }',
    '  .enn-fab { display:block; }',
    '  html { overscroll-behavior-y:none; }',
    '  body { -webkit-tap-highlight-color:transparent; padding-bottom:calc(68px + env(safe-area-inset-bottom,0px)) !important; }',
    '  input,select,textarea { font-size:16px !important; }',
    '}'
  ].join('\n');
  document.head.appendChild(css);

  // ─── Inject Bottom Nav HTML ───
  var path = location.pathname;
  var isHome = path === '/' || path === '/index.html' || path === '';
  var isExplore = path.indexOf('/blog') !== -1 || path.indexOf('/insurance') !== -1 || path.indexOf('/quiz') !== -1 || path.indexOf('/locations') !== -1 || path.indexOf('/about') !== -1 || path.indexOf('/faq') !== -1;
  var isServices = path.indexOf('/adhd') !== -1 || path.indexOf('/anxiety') !== -1 || path.indexOf('/alcohol') !== -1 || path.indexOf('/depression') !== -1 || path.indexOf('/ptsd') !== -1 || path.indexOf('/bipolar') !== -1 || path.indexOf('/ocd') !== -1 || path.indexOf('/insomnia') !== -1 || path.indexOf('/genetic') !== -1;
  var isAdmin = path.indexOf('/admin') !== -1;
  if (isAdmin) return; // Don't add bottom nav to admin pages

  var nav = document.createElement('nav');
  nav.className = 'enn-bottom-nav';
  nav.id = 'ennBottomNav';
  nav.innerHTML = '<div class="enn-bottom-nav-inner">' +
    '<a href="/" class="enn-bnav' + (isHome ? ' active' : '') + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
      '<span>Home</span></a>' +
    '<a href="/#services" class="enn-bnav' + (isServices ? ' active' : '') + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' +
      '<span>Services</span></a>' +
    '<a href="/#book" class="enn-bnav">' +
      '<div class="enn-cta-circle">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
      '</div>' +
      '<span>Book</span></a>' +
    '<button class="enn-bnav' + (isExplore ? ' active' : '') + '" id="ennExploreBtn" type="button">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>' +
      '<span>Explore</span></button>' +
    '<a href="tel:+14077962406" class="enn-bnav">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
      '<span>Call</span></a>' +
  '</div>';
  document.body.appendChild(nav);

  // ─── Inject Explore Drawer ───
  var overlay = document.createElement('div');
  overlay.className = 'enn-explore-overlay';
  overlay.id = 'ennExploreOverlay';
  document.body.appendChild(overlay);

  var drawer = document.createElement('div');
  drawer.className = 'enn-explore-drawer';
  drawer.id = 'ennExploreDrawer';
  drawer.innerHTML =
    '<div class="enn-explore-handle"></div>' +
    '<div class="enn-explore-header">' +
      '<h3>Explore</h3>' +
      '<button class="enn-explore-close" id="ennExploreClose">&times;</button>' +
    '</div>' +

    '<div class="enn-explore-section">' +
      '<div class="enn-explore-section-title">Free Screenings</div>' +
      '<div class="enn-explore-links">' +
        '<a href="/quiz/adhd/" class="enn-explore-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
          '<div class="enn-el-text">ADHD Self-Assessment<br><span class="enn-el-sub">6-question screening (ASRS)</span></div>' +
          '<span class="enn-el-arrow">&rsaquo;</span></a>' +
        '<a href="/quiz/anxiety/" class="enn-explore-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
          '<div class="enn-el-text">Anxiety Self-Assessment<br><span class="enn-el-sub">7-question screening (GAD-7)</span></div>' +
          '<span class="enn-el-arrow">&rsaquo;</span></a>' +
        '<a href="/quiz/depression/" class="enn-explore-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
          '<div class="enn-el-text">Depression Self-Assessment<br><span class="enn-el-sub">9-question screening (PHQ-9)</span></div>' +
          '<span class="enn-el-arrow">&rsaquo;</span></a>' +
        '<a href="/quiz/ptsd/" class="enn-explore-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
          '<div class="enn-el-text">PTSD Self-Assessment<br><span class="enn-el-sub">5-question screening (PC-PTSD-5)</span></div>' +
          '<span class="enn-el-arrow">&rsaquo;</span></a>' +
        '<a href="/quiz/alcohol/" class="enn-explore-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
          '<div class="enn-el-text">Alcohol Use Self-Screening<br><span class="enn-el-sub">3-question screening (AUDIT-C)</span></div>' +
          '<span class="enn-el-arrow">&rsaquo;</span></a>' +
      '</div>' +
    '</div>' +

    '<div class="enn-explore-divider"></div>' +

    '<div class="enn-explore-section">' +
      '<div class="enn-explore-section-title">Insurance</div>' +
      '<div class="enn-explore-links">' +
        '<a href="/insurance/" class="enn-explore-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' +
          '<div class="enn-el-text">Check Your Insurance Coverage<br><span class="enn-el-sub">Aetna, BCBS, Cigna, UHC + 6 more</span></div>' +
          '<span class="enn-el-arrow">&rsaquo;</span></a>' +
      '</div>' +
    '</div>' +

    '<div class="enn-explore-divider"></div>' +

    '<div class="enn-explore-section">' +
      '<div class="enn-explore-section-title">Resources</div>' +
      '<div class="enn-explore-links">' +
        '<a href="/blog/" class="enn-explore-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' +
          '<div class="enn-el-text">Blog<br><span class="enn-el-sub">Mental health articles & guides</span></div>' +
          '<span class="enn-el-arrow">&rsaquo;</span></a>' +
        '<a href="/faq/" class="enn-explore-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' +
          '<div class="enn-el-text">FAQ<br><span class="enn-el-sub">Common questions answered</span></div>' +
          '<span class="enn-el-arrow">&rsaquo;</span></a>' +
        '<a href="/locations/" class="enn-explore-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
          '<div class="enn-el-text">Locations<br><span class="enn-el-sub">28+ states served</span></div>' +
          '<span class="enn-el-arrow">&rsaquo;</span></a>' +
      '</div>' +
    '</div>' +

    '<div class="enn-explore-divider"></div>' +

    '<div class="enn-explore-section">' +
      '<div class="enn-explore-section-title">About</div>' +
      '<div class="enn-explore-links">' +
        '<a href="/about/" class="enn-explore-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
          '<div class="enn-el-text">Our Team<br><span class="enn-el-sub">Meet your psychiatric provider</span></div>' +
          '<span class="enn-el-arrow">&rsaquo;</span></a>' +
        '<a href="tel:+14077962406" class="enn-explore-link">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
          '<div class="enn-el-text">Contact Us<br><span class="enn-el-sub">(407) 796-2406</span></div>' +
          '<span class="enn-el-arrow">&rsaquo;</span></a>' +
      '</div>' +
    '</div>';

  document.body.appendChild(drawer);

  // ─── Explore Drawer Toggle ───
  function openExplore() {
    overlay.classList.add('active');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeExplore() {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.getElementById('ennExploreBtn').addEventListener('click', function(e) {
    e.preventDefault();
    if (drawer.classList.contains('open')) closeExplore();
    else openExplore();
  });
  overlay.addEventListener('click', closeExplore);
  document.getElementById('ennExploreClose').addEventListener('click', closeExplore);

  // Close drawer when a link is tapped
  drawer.querySelectorAll('.enn-explore-link').forEach(function(link) {
    link.addEventListener('click', function() {
      closeExplore();
    });
  });

  // Swipe down to close drawer
  var touchStartY = 0;
  drawer.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  drawer.addEventListener('touchmove', function(e) {
    var dy = e.touches[0].clientY - touchStartY;
    if (dy > 60 && drawer.scrollTop <= 0) {
      closeExplore();
    }
  }, { passive: true });

  // ─── Inject Floating Book Now ───
  var fab = document.createElement('button');
  fab.className = 'enn-fab';
  fab.id = 'ennFab';
  fab.textContent = 'Book Now';
  fab.onclick = function() { window.location.href = '/#book'; };
  document.body.appendChild(fab);

  // ─── Scroll behavior ───
  if (isMobile) {
    window.addEventListener('scroll', function() {
      var y = window.scrollY || window.pageYOffset;
      // Show FAB after scrolling
      if (y > 400) fab.classList.add('visible');
      else fab.classList.remove('visible');
    }, { passive: true });

    // Header scroll shadow
    var header = document.querySelector('.header, header');
    if (header) {
      window.addEventListener('scroll', function() {
        if (window.scrollY > 10) header.style.boxShadow = '0 2px 16px rgba(0,0,0,0.08)';
        else header.style.boxShadow = '';
      }, { passive: true });
    }
  }
})();
