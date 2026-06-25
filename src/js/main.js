// Main Entry Point - Me POS by Mein Licht
import { App } from './core/App.js';
import { CustomerHome } from './pages/customerHome.js';
import { StaffLogin } from './pages/staffLogin.js';

// Import styles
import '../css/main.css';
import '../css/components.css';

// Log initialization
console.log('Me POS by Mein Licht - Loading...');

// Determine which portal to load based on URL
const path = window.location.pathname;
if (path.includes('customer.html')) {
  // Customer portal – render CustomerHome directly
  window.customerHome = new CustomerHome();
} else {
  // Employee portal – use App which handles admin/staff views
  window.app = new App();
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
