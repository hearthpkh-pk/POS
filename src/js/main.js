// Main Entry Point - Me POS by Mein Licht
import { App } from './core/App.js';

// Import styles (Assuming you have these, leaving intact from old main.js)
import '../css/main.css';
import '../css/components.css';

// Log initialization
console.log('Me POS by Mein Licht - Loading...');

// Instantiate the Application
window.app = new App();

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
