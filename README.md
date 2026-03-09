# Me POS by Mein Licht

Point of Sale (POS) system for restaurants and cafes, built with modern web technologies and preparing for an Enterprise-grade future.

## 🌟 The Ultimate Vision (B2B SaaS & ERP Readiness)

**Me POS is not just a standalone cash register app; it is the foundation for a highly scalable B2B SaaS platform.** 

Our architectural north star is to build a "Bulletproof" ecosystem with:
- **Financial Precision:** 100% accurate calculations using Integer Math (Cents) to completely eliminate JavaScript floating-point errors.
- **SaaS Multi-Tenancy:** A database architecture designed to support unlimited restaurant companies (Tenants) and branches securely from day one.
- **ERP Scalability:** Built-in Role-Based Access Control (RBAC), immutable order snapshots, and structured data relationships ready to integrate with future HR, Payroll, and Inventory Management systems.
- **Enterprise Grade Security:** Strict separation of UI and Business Logic, Row Level Security (RLS) enforcement, and zero hard-coded credentials.

We are currently transitioning from a rapid-prototype NoSQL (Firebase) approach to a robust, relational SQL (Supabase/PostgreSQL) architecture to handle complex reporting and massive data scale.
## 🚀 Features

### Core Functionality
- **Multi-table Order Management** - Handle multiple orders simultaneously
- **Real-time Sync** - All data syncs in real-time across devices
- **Offline Support** - Works offline with automatic sync when online
- **Mobile Responsive** - Optimized for tablets and mobile devices
- **PWA Ready** - Installable as a native app on mobile devices

### POS Features
- **Menu Management** - Add, edit, and delete menu items
- **Order Processing** - Create, modify, and settle orders
- **Discount System** - Support for percentage and fixed amount discounts
- **Tax Calculation** - Automatic VAT calculation (7% for Thailand)
- **Receipt Generation** - Digital receipts with image export
- **Bill Parking** - Save and retrieve parked orders

### Admin Features
- **Dashboard** - Real-time sales analytics and metrics
- **Sales History** - Complete order history with filtering
- **Revenue Reports** - Detailed sales reports by menu and category
- **CSV Export** - Export sales data for external analysis
- **Date Range Filtering** - Analyze sales for specific periods

## 🛠️ Technology Stack

### Frontend
- **JavaScript ES6+** - Modern JavaScript with modules
- **CSS3** - Custom CSS with CSS variables
- **HTML5** - Semantic HTML5 structure
- **PWA** - Progressive Web App capabilities

### Backend
- **Firebase Firestore** - Real-time database
- **Firebase Authentication** - Anonymous and custom token auth
- **Firebase Hosting** - Static site hosting with CDN

### Development Tools
- **Webpack** - Module bundling and optimization
- **Babel** - JavaScript transpilation
- **Jest** - Unit testing framework
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting

## 📱 Installation & Setup

### Prerequisites
- Node.js 16.0 or higher
- npm 8.0 or higher
- Firebase CLI (for deployment)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-pos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Production Build

1. **Build for production**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   npm run deploy
   ```

## 📁 Project Structure

```
my-pos/
├── public/                     # Static assets
│   ├── index.html             # Main HTML file
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker
│   └── icon.png               # App icon
├── src/                       # Source code
│   ├── js/                    # JavaScript modules
│   │   ├── main.js           # Entry point
│   │   ├── app.js            # Main application
│   │   ├── config.js         # Configuration
│   │   ├── utils.js          # Utility functions
│   │   ├── database.js       # Firebase operations
│   │   ├── pos.js            # POS functionality
│   │   └── admin.js          # Admin features
│   ├── css/                   # Stylesheets
│   │   ├── main.css          # Main styles
│   │   └── components.css    # Component styles
│   └── components/            # Reusable components
│       ├── Modal.js          # Modal component
│       └── Receipt.js        # Receipt component
├── tests/                     # Test files
│   ├── setup.js              # Test configuration
│   └── utils.test.js         # Example tests
├── scripts/                   # Build and deployment scripts
│   ├── build.js              # Build script
│   └── deploy.js             # Deployment script
├── docs/                      # Documentation
├── firebase.json              # Firebase configuration
├── .firebaserc               # Firebase project settings
├── webpack.config.js          # Webpack configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 🔧 Configuration

### Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Firestore Database
   - Enable Authentication (Anonymous)

2. **Configure Local Project**
   ```bash
   firebase login
   firebase init hosting
   firebase use --add <project-id>
   ```

3. **Update Configuration**
   - Edit `src/js/config.js` with your Firebase config
   - Update `.firebaserc` with your project ID

### Environment Variables

Create a `.env.local` file for environment-specific settings:

```env
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- Unit tests for utility functions
- Component tests for UI components
- Integration tests for workflows

### Writing Tests
```javascript
// Example test
import { Utils } from '../src/js/utils.js';

describe('Utils', () => {
  test('should format currency correctly', () => {
    const result = Utils.formatCurrency(1234.56);
    expect(result).toContain('฿');
  });
});
```

## 📦 Build & Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Build Analysis
```bash
npm run build:analyze
```

### Deployment Options

#### Production Deployment
```bash
npm run deploy
```

#### Preview Deployment
```bash
npm run deploy --preview
```

#### Custom Deployment
```bash
# Skip build
npm run deploy --skip-build

# Skip tests
npm run deploy --skip-tests

# Debug mode
npm run deploy --debug
```

## 🎨 Customization

### Theming
Edit `src/css/main.css` to customize colors and styling:

```css
:root {
  --primary-color: #EA580C;
  --bg-primary: #F3F4F6;
  --text-primary: #1F2937;
}
```

### Business Configuration
Update `src/js/config.js` for business-specific settings:

```javascript
BUSINESS: {
  vatRate: 0.07,        // VAT percentage
  currency: "THB",      // Currency code
  locale: "th-TH",      // Locale for formatting
  timezone: "Asia/Bangkok"
}
```

### Menu Categories
Add or modify categories in the admin interface or seed data.

## 🔒 Security

### Firebase Security Rules
Configure Firestore security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Data Protection
- All Firebase connections use HTTPS
- Sensitive data is not stored in localStorage
- Regular security updates for dependencies

## 🚀 Performance

### Optimization Features
- Code splitting with Webpack
- Image optimization
- Service worker caching
- Lazy loading for non-critical resources
- Bundle size monitoring

### Performance Monitoring
Monitor performance in the browser console:
```javascript
// Performance metrics are logged automatically
// Check console for load times and warnings
```

## 🐛 Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

#### Firebase Connection Issues
```bash
# Check Firebase configuration
firebase projects:list
firebase use --add <project-id>
```

#### Service Worker Issues
```bash
# Unregister service worker in browser dev tools
# Clear browser cache and reload
```

### Debug Mode
Enable debug logging:
```javascript
// In browser console
localStorage.setItem('debug', 'true');
```

## 📈 Monitoring

### Analytics
- Firebase Analytics for user behavior
- Performance monitoring
- Error tracking

### Logs
Check Firebase Functions logs:
```bash
firebase functions:log
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run tests and linting
5. Submit pull request

### Code Style
- Use ESLint and Prettier
- Follow JavaScript Standard Style
- Write meaningful commit messages
- Include tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [Firebase Documentation](https://firebase.google.com/docs)
- [Webpack Documentation](https://webpack.js.org/)
- [Jest Documentation](https://jestjs.io/)

### Issues
Report issues on the GitHub repository with:
- Detailed description of the problem
- Steps to reproduce
- Browser and environment information

### Contact
For support and inquiries:
- Email: support@meinlicht.com
- Website: https://meinlicht.com

---

**Me POS by Mein Licht** - Modern Point of Sale Solution for Thai Businesses 🇹🇭
