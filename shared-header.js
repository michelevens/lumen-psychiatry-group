/**
 * EnnHealth Psychiatry — Shared Header
 * Include on any page to get the unified site header with mobile menu.
 * Place <div id="site-header"></div> where you want the header injected,
 * or it will be prepended to <body>.
 */
(function() {
  'use strict';
  if (window.__ennSharedHeader) return;
  window.__ennSharedHeader = true;

  function initHeader() {
  // Determine if we're on the home page
  var isHome = location.pathname === '/' || location.pathname === '/index.html' || location.pathname === '';
  var prefix = isHome ? '#' : '/#';

  var headerHTML =
    '<header class="header">' +
      '<div class="header-inner">' +
        '<a href="/" class="logo">' +
          '<div class="logo-mark">' +
            '<picture><source srcset="/assets/images/logo-192.webp" type="image/webp"><img src="/assets/images/logo-192.png" alt="EnnHealth Logo" width="192" height="192"></picture>' +
          '</div>' +
          '<div class="logo-text">' +
            '<span class="logo-name">EnnHealth</span>' +
            '<span class="logo-sub">Psychiatry</span>' +
          '</div>' +
        '</a>' +
        '<nav class="nav" id="mainNav" aria-label="Main navigation">' +
          '<a href="' + prefix + 'services">Services</a>' +
          '<a href="' + prefix + 'facility">Facilities &amp; ER</a>' +
          '<a href="' + prefix + 'how">How It Works</a>' +
          '<a href="' + prefix + 'pricing">Pricing</a>' +
          '<a href="' + prefix + 'providers">Our Team</a>' +
          '<a href="tel:8667969995" class="nav-phone">' +
            '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
            ' (866) 796-9995' +
          '</a>' +
          '<a href="' + prefix + 'book" class="nav-cta">Book Appointment</a>' +
          '<div class="nav-login-wrap">' +
            '<button class="nav-login-btn" onclick="this.parentElement.classList.toggle(\'open\')">' +
              '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
              ' Login' +
            '</button>' +
            '<div class="nav-login-dropdown">' +
              '<a href="https://portal.kareo.com/pp-webapp/app/new/login" target="_blank" rel="noopener">Patient Portal</a>' +
              '<a href="https://portal.kareo.com/app/new/login/practice" target="_blank" rel="noopener">Provider Portal</a>' +
            '</div>' +
          '</div>' +
        '</nav>' +
        '<button class="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mainNav" id="menuBtn">' +
          '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-icon"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' +
          '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="close-icon" style="display:none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
    '</header>' +
    '<div class="mobile-overlay" id="mobileOverlay" onclick="toggleMobileMenu()"></div>';

  // Inject CSS if not already from styles.css
  if (!document.querySelector('link[href*="styles.css"]')) {
    var style = document.createElement('style');
    style.textContent =
      '.header { background: rgba(255,255,255,0.95); position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #e2e8f0; backdrop-filter: blur(12px); }' +
      '.header.menu-open { z-index: 600; }' +
      '.header-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; height: 72px; }' +
      '.logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }' +
      '.logo-mark { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }' +
      '.logo-mark img { width: 100%; height: 100%; object-fit: contain; }' +
      '.logo-text { display: flex; flex-direction: column; line-height: 1.1; }' +
      '.logo-name { font-family: "Playfair Display", Georgia, serif; font-size: 20px; font-weight: 700; color: #2C4A5A; }' +
      '.logo-sub { font-size: 10px; font-weight: 600; color: #D4A855; text-transform: uppercase; letter-spacing: 2px; }' +
      '.nav { display: flex; align-items: center; gap: 28px; }' +
      '.nav a { color: #64748b; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }' +
      '.nav a:hover { color: #2C4A5A; }' +
      '.nav-phone { display: flex; align-items: center; gap: 6px; color: #2C4A5A !important; font-weight: 600 !important; }' +
      '.nav-cta { background: #2C4A5A !important; color: #fff !important; padding: 10px 24px; border-radius: 8px; font-weight: 600 !important; transition: all 0.2s !important; }' +
      '.nav-cta:hover { background: #1a3545 !important; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(44,74,90,0.25); }' +
      '.nav-login-wrap { position: relative; border-left: 1px solid #e2e8f0; padding-left: 16px; margin-left: 4px; }' +
      '.nav-login-btn { display: flex; align-items: center; gap: 6px; background: none; border: 1px solid #D4A855; color: #D4A855; padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }' +
      '.nav-login-btn:hover { background: #D4A855; color: white; }' +
      '.nav-login-btn svg { flex-shrink: 0; }' +
      '.nav-login-dropdown { display: none; position: absolute; top: 100%; right: 0; margin-top: 8px; background: white; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); min-width: 180px; z-index: 300; overflow: hidden; }' +
      '.nav-login-wrap.open .nav-login-dropdown { display: block; }' +
      '.nav-login-dropdown a { display: block; padding: 12px 16px; font-size: 14px; color: #1a3545 !important; text-decoration: none; transition: background 0.15s; font-weight: 500 !important; }' +
      '.nav-login-dropdown a:hover { background: #f8fafb; color: #D4A855 !important; }' +
      '.mobile-menu-btn { display: none; background: none; border: none; cursor: pointer; padding: 8px; color: #2C4A5A; }' +
      '.mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 150; }' +
      '.mobile-overlay.active { display: block; }' +
      'body.menu-open .bottom-nav { display: none !important; }' +
      'body.menu-open .fab-book { display: none !important; }' +
      '@media (max-width: 768px) {' +
        '.nav { display: flex; visibility: hidden; pointer-events: none; position: fixed; top: 0; right: 0; width: 280px; height: 100vh; background: white; flex-direction: column; align-items: stretch; gap: 0; padding: 80px 24px 32px; z-index: 200; box-shadow: -4px 0 24px rgba(0,0,0,0.15); overflow-y: auto; transform: translateX(100%); transition: transform 0.3s ease, visibility 0s 0.3s; }' +
        '.nav.open { visibility: visible; pointer-events: auto; transform: translateX(0); transition: transform 0.3s ease, visibility 0s 0s; }' +
        '.nav a { padding: 14px 0; font-size: 16px; border-bottom: 1px solid #f1f5f9; color: #1a3545; }' +
        '.nav a:last-child { border-bottom: none; }' +
        '.nav .nav-cta { text-align: center; margin-top: 16px; padding: 14px 24px; border-radius: 10px; }' +
        '.nav .nav-phone { justify-content: flex-start; padding: 14px 0; }' +
        '.nav-login-wrap { border-left: none; padding-left: 0; margin-left: 0; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 8px; }' +
        '.nav-login-btn { width: 100%; justify-content: center; padding: 12px 16px; font-size: 15px; border-radius: 10px; }' +
        '.nav-login-dropdown { position: static; margin-top: 8px; box-shadow: none; border: 1px solid #f1f5f9; }' +
        '.nav-login-dropdown a { padding: 12px 16px !important; font-size: 15px !important; border-bottom: 1px solid #f1f5f9; }' +
        '.mobile-menu-btn { display: flex; align-items: center; justify-content: center; }' +
        '.header-inner { height: 64px; }' +
        '.logo-mark { width: 36px; height: 36px; }' +
        '.logo-name { font-size: 18px; }' +
        '.header.menu-open { z-index: 600; }' +
        'body.menu-open .enn-bottom-nav, body.menu-open .mobile-bottom-nav, body.menu-open .enn-fab, body.menu-open .mobile-fab { display: none !important; }' +
        '.header { transition: box-shadow 0.3s ease; }' +
        '.header.scrolled { box-shadow: 0 2px 16px rgba(0,0,0,0.08); }' +
        '.header-inner { padding-left: max(24px, env(safe-area-inset-left)); padding-right: max(24px, env(safe-area-inset-right)); }' +
      '}';
    document.head.appendChild(style);
  }

  // Inject header — replace existing old headers or prepend
  var oldHeaders = document.querySelectorAll('.blog-header, .policy-header, .intake-header');
  if (oldHeaders.length > 0) {
    oldHeaders[0].outerHTML = headerHTML;
    for (var i = 1; i < oldHeaders.length; i++) oldHeaders[i].remove();
  } else {
    var target = document.getElementById('site-header');
    if (target) {
      target.outerHTML = headerHTML;
    } else {
      document.body.insertAdjacentHTML('afterbegin', headerHTML);
    }
  }

  // Mobile menu toggle
  window.toggleMobileMenu = function() {
    var nav = document.querySelector('.nav');
    var overlay = document.getElementById('mobileOverlay');
    var menuIcon = document.querySelector('.menu-icon');
    var closeIcon = document.querySelector('.close-icon');
    var menuBtn = document.getElementById('menuBtn');
    var header = document.querySelector('.header');
    if (!nav) return;
    var isOpen = nav.classList.contains('open');
    if (isOpen) {
      nav.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
      menuIcon.style.display = '';
      closeIcon.style.display = 'none';
      document.body.style.overflow = '';
      document.body.classList.remove('menu-open');
      if (header) header.classList.remove('menu-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open navigation menu');
    } else {
      nav.classList.add('open');
      if (overlay) overlay.classList.add('active');
      menuIcon.style.display = 'none';
      closeIcon.style.display = '';
      document.body.style.overflow = 'hidden';
      document.body.classList.add('menu-open');
      if (header) header.classList.add('menu-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', 'Close navigation menu');
    }
  };

  // Close mobile menu on nav link click
  document.querySelectorAll('.nav a').forEach(function(link) {
    link.addEventListener('click', function() {
      if (window.innerWidth <= 768) {
        window.toggleMobileMenu();
      }
    });
  });

  // Close login dropdown on click outside
  document.addEventListener('click', function(e) {
    var wrap = document.querySelector('.nav-login-wrap');
    if (wrap && !wrap.contains(e.target)) wrap.classList.remove('open');
  });

  // Close menu on resize to desktop
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      var nav = document.querySelector('.nav');
      var overlay = document.getElementById('mobileOverlay');
      if (nav) nav.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
      document.body.classList.remove('menu-open');
      var header = document.querySelector('.header');
      if (header) header.classList.remove('menu-open');
      var menuIcon = document.querySelector('.menu-icon');
      var closeIcon = document.querySelector('.close-icon');
      if (menuIcon) menuIcon.style.display = '';
      if (closeIcon) closeIcon.style.display = 'none';
      var menuBtn = document.getElementById('menuBtn');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    }
  });
  } // end initHeader

  // Ensure DOM is ready before injecting (script may load in <head> before <body> elements exist)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
  } else {
    initHeader();
  }
})();
