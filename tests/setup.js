// Jest Setup File
import 'jest-environment-jsdom';

// Mock Firebase
jest.mock('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js', () => ({
  initializeApp: jest.fn(() => ({
    name: 'test-app'
  }))
}));

jest.mock('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    signInAnonymously: jest.fn(),
    signInWithCustomToken: jest.fn(),
    onAuthStateChanged: jest.fn()
  }))
}));

jest.mock('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(),
      addDoc: jest.fn(),
      getDocs: jest.fn(),
      onSnapshot: jest.fn()
    }))
  })),
  doc: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(() => ({ toDate: () => new Date() })),
  setLogLevel: jest.fn(),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    commit: jest.fn()
  })),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn()
}));

// Mock html2canvas
jest.mock('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', () => ({
  default: jest.fn(() => Promise.resolve({
    toDataURL: jest.fn(() => 'data:image/png;base64,mock')
  }))
}));

// Mock flatpickr
jest.mock('https://cdn.jsdelivr.net/npm/flatpickr', () => ({
  default: jest.fn(() => ({
    destroy: jest.fn(),
    setDate: jest.fn(),
    clear: jest.fn()
  }))
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock window methods
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    reload: jest.fn()
  },
  writable: true
});

// Mock IndexedDB
const indexedDBMock = {
  open: jest.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: {
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => ({
          getAll: jest.fn(() => ({ result: [] })),
          delete: jest.fn(() => ({ result: undefined }))
        }))
      }))
    }
  }))
};
global.indexedDB = indexedDBMock;

// Mock service worker
global.navigator.serviceWorker = {
  register: jest.fn(() => Promise.resolve({
    installing: null,
    waiting: null,
    active: null
  }))
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Setup DOM environment
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('')
  })
);

// Mock URL constructor
global.URL = dom.window.URL;

// Mock Blob
global.Blob = dom.window.Blob;

// Mock File
global.File = dom.window.File;

// Mock FileReader
global.FileReader = dom.window.FileReader;

// Mock Canvas
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: [] })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => ({ data: [] })),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn()
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
    zIndex: '0'
  })
});

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock console methods for cleaner test output
const originalConsole = { ...console };
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
  console.warn.mockRestore();
  console.error.mockRestore();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
});

// Global test utilities
global.createMockElement = (tagName, attributes = {}, children = []) => {
  const element = document.createElement(tagName);
  
  Object.keys(attributes).forEach(key => {
    if (key === 'className') {
      element.className = attributes[key];
    } else if (key === 'innerHTML') {
      element.innerHTML = attributes[key];
    } else {
      element.setAttribute(key, attributes[key]);
    }
  });
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  });
  
  return element;
};

global.createMockEvent = (type, properties = {}) => {
  const event = new Event(type);
  Object.assign(event, properties);
  return event;
};

// Wait for async operations
global.waitFor = (condition, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 50);
      }
    };
    
    check();
  });
};

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    getEntriesByType: jest.fn(() => []),
    mark: jest.fn(),
    measure: jest.fn(),
    now: jest.fn(() => Date.now())
  }
});

// Mock crypto API
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: jest.fn(arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    })
  }
});
