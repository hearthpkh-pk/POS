// Main Entry Point - POS
import { App } from './core/App.js';
import { CustomerHome } from './pages/customerHome.js';
import { StaffLogin } from './pages/staffLogin.js';

// Import styles
import '../css/main.css';
import '../css/components.css';

// Log initialization
console.log('POS - Loading...');

// Determine which portal to load based on URL
const path = window.location.pathname.toLowerCase();
if (path.includes('pos') || path.includes('admin')) {
  // Employee portal – use App which handles admin/staff views
  window.app = new App();
} else {
  // Customer portal – render CustomerHome directly (including root /)
  window.customerHome = new CustomerHome();
}
new StaffLogin();

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('Service Worker Registered');
    })
    .catch((error) => {
      console.log('Service Worker Registration Failed:', error);
    });
}

// Handle app updates
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
});

// Performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    if (perfData) console.log('Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
  });
}
