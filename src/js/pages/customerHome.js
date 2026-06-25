// src/js/pages/customerHome.js
// Mein Licht – Customer Portal (Public, no auth required)
import { supabase } from '../core/SupabaseClient.js';
import { loginWithPhone } from '../services/auth.js';
import '../../css/customer.css';

const TRANSLATIONS = {
  th: {
    about: 'เกี่ยวกับ',
    gallery: 'Gallery',
    menu: 'เมนู',
    contact: 'ติดต่อ',
    recommendedTitle: 'เมนูแนะนำ & โปรโมชัน',
    recommendedSub: 'RECOMMENDED',
    viewMenu: 'ดูเมนูอาหาร',
    cart: 'ตะกร้า',
    cartHeader: '🛍 ตะกร้าของคุณ',
    total: 'รวม',
    checkout: 'สั่งซื้อ / จองล่วงหน้า',
    emptyCart: 'ตะกร้าว่าง',
    emptyMenu: 'ยังไม่มีเมนูในขณะนี้',
    searchPlaceholder: 'ค้นหาเมนู...',
    ourMenu: 'เมนูของร้าน',
    itemsCount: 'รายการ',
    phoneTitle: 'เบอร์โทรศัพท์ติดต่อร้าน',
    hoursTitle: 'เวลาเปิด-ปิดร้าน',
    locationTitle: 'แผนที่ร้าน',
    toastHours: 'เวลาให้บริการ: ',
    copiedLink: 'คัดลอกลิงก์ร้านค้าแล้ว!',
    orderSuccess: '✅ สั่งซื้อสำเร็จ! ทีมงานจะติดต่อกลับ',
    verifyTitle: 'ยืนยันตัวตน',
    verifySub: 'กรอกชื่อและเบอร์โทรเพื่อยืนยันการสั่ง<br>เราจะส่ง OTP ไปยังเบอร์ที่กรอก',
    fullName: 'ชื่อ-นามสกุล',
    phoneNumber: 'เบอร์โทรศัพท์ (0812345678)',
    sendOtp: 'ส่ง OTP',
    cancel: 'ยกเลิก',
    verifyOtp: 'ยืนยัน OTP',
    otpSub: 'กรอกรหัส OTP 6 หลักที่ส่งไปยัง',
    verifyBtn: 'ยืนยัน',
    editPhone: 'แก้ไขเบอร์',
    staffTitle: '⚡ Staff Login',
    staffSub: 'ระบบสำหรับพนักงาน Mein Licht เท่านั้น',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    login: 'เข้าสู่ระบบ',
    close: 'ปิด'
  },
  en: {
    about: 'About',
    gallery: 'Gallery',
    menu: 'Menu',
    contact: 'Contact',
    recommendedTitle: 'Recommended & Promotions',
    recommendedSub: 'RECOMMENDED',
    viewMenu: 'View Menu',
    cart: 'Cart',
    cartHeader: '🛍 Your Cart',
    total: 'Total',
    checkout: 'Checkout / Reserve',
    emptyCart: 'Cart is empty',
    emptyMenu: 'No menu items available',
    searchPlaceholder: 'Search menu...',
    ourMenu: 'Our Menu',
    itemsCount: 'items',
    phoneTitle: 'Contact Number',
    hoursTitle: 'Opening Hours',
    locationTitle: 'Location Map',
    toastHours: 'Opening hours: ',
    copiedLink: 'Store link copied to clipboard!',
    orderSuccess: '✅ Order placed successfully! We will contact you back.',
    verifyTitle: 'Verification',
    verifySub: 'Enter your name and phone number.<br>We will send an OTP code.',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number (0812345678)',
    sendOtp: 'Send OTP',
    cancel: 'Cancel',
    verifyOtp: 'Verify OTP',
    otpSub: 'Enter the 6-digit OTP code sent to',
    verifyBtn: 'Verify',
    editPhone: 'Edit Phone',
    staffTitle: 'Staff Login',
    staffSub: 'Authorized Mein Licht Staff Only',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    close: 'Close'
  }
};

export class CustomerHome {
  constructor() {
    this.container = document.getElementById('app-container');
    this.cart = [];
    this.guestInfo = null;
    this.behaviorData = [];
    this.settings = {};
    this.menus = [];
    this.currentLang = 'th';
    this._sessionStart = Date.now();
    this._pendingGuestInfo = null;
    this._toastTimeout = null;
    this._init();
  }

  // ──────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────
  async _init() {
    // Load all settings from DB in parallel with menu_items from POS
    const [settingsResult, menuItemsResult] = await Promise.all([
      supabase.from('restaurant_settings').select('key, value'),
      supabase.from('menu_items').select('*, categories(id, name_th, name_en, sort_order)').eq('is_active', true),
    ]);

    if (settingsResult.data) {
      settingsResult.data.forEach(row => { this.settings[row.key] = row.value; });
    }
    if (menuItemsResult.data) {
      this.menus = menuItemsResult.data.map(item => ({
        id: item.id,
        name_th: item.name_th || item.name_en || 'รายการอาหาร',
        name_en: item.name_en || item.name_th || 'Menu Item',
        price: item.base_price_cents / 100, // convert cents to Baht
        image_url: item.image_url,
        category_id: item.category_id,
        category_name_th: item.categories?.name_th || 'อื่นๆ',
        category_name_en: item.categories?.name_en || 'Others',
        sort_order: item.categories?.sort_order !== undefined ? item.categories.sort_order : 999
      }));
    }

    this._updateLangProperties();
    this._render();
    this._initNav();
    this._initGallery();
    this._initMenuSearch();
    this._initCart();
    this._initDock();
    this._initScrollAnimations();
    this._trackEvent('page_load', { ts: Date.now() });
  }

  _updateLangProperties() {
    this.menus.forEach(m => {
      m.name = this.currentLang === 'th' ? m.name_th : m.name_en;
      m.category_name = this.currentLang === 'th' ? m.category_name_th : m.category_name_en;
    });
  }

  // ──────────────────────────────────────────────
  // RENDER FULL PAGE
  // ──────────────────────────────────────────────
  _render() {
    const s = this.settings;
    const storeName = s.store_name || 'Mein Licht';
    const tagline = s.tagline || 'MEXICAN FUSION';
    const established = s.established || 'ESTD 2024';
    const location = s.location || 'Bangkok, Thailand';
    const heroImg = s.hero_image || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1600&q=80';
    const logoImg = s.hero_logo || '';

    // New keys fallback
    const phone = s.store_phone || '081-234-5678';
    const locationUrl = s.location_url || 'https://maps.google.com';

    const t = TRANSLATIONS[this.currentLang];

    // Create root element for customer portal
    const root = document.createElement('div');
    root.id = 'customer-root';
    root.innerHTML = `
      <!-- NAV -->
      <nav class="c-nav" id="c-nav">
        <div class="c-nav__logo" id="logo">
          ${storeName.split(' ')[0]}<span>${storeName.split(' ')[1] || ''}</span>
        </div>
        <ul class="c-nav__links">
          <li class="c-nav__link" data-scroll="c-about">${t.about}</li>
          <li class="c-nav__link" data-scroll="c-gallery">${t.gallery}</li>
          <li class="c-nav__link" id="nav-menu-link">${t.menu}</li>
          <li class="c-nav__link" data-scroll="c-footer">${t.contact}</li>
        </ul>
        <div class="c-nav__actions">
          <button class="c-nav__icon-btn" id="cart-nav-btn" aria-label="ตะกร้า">
            <i class="fas fa-shopping-bag"></i>
          </button>
        </div>
      </nav>

      <!-- HERO – Sabro style: photo top + big name on red section -->
      <section class="c-hero" id="c-hero">
        <!-- Full-bleed food photo -->
        <img class="c-hero__photo" src="${heroImg}" alt="${storeName} hero" id="hero-bg-img" />

        <!-- Dark red bottom section with big name -->
        <div class="c-hero__bottom">
          <h1 class="c-hero__name">
            ${storeName}
          </h1>
          <p class="c-hero__tagline">✦ ${tagline} ✦</p>
        </div>
      </section>

      <!-- ABOUT -->
      <section class="c-about" id="c-about">
        <div class="c-about__meta">
          <span>${established}</span>
          <span>${location}</span>
        </div>
        <div class="c-about__center">
          ${logoImg
            ? `<img class="c-about__logo" src="${logoImg}" alt="${storeName} logo" />`
            : `<div class="c-about__logo-placeholder">🌮</div>`
          }
        </div>
        <div class="c-about__cols">
          <div class="c-about__col fade-in-up">
            <div class="c-about__col-title">${s.about_1_title || 'MEIN LICHT'}</div>
            <p class="c-about__col-desc">${s.about_1_desc || '...'}</p>
          </div>
          <div class="c-about__col fade-in-up" style="transition-delay:0.12s">
            <div class="c-about__col-title">${s.about_2_title || 'ABOUT THE RESTAURANT'}</div>
            <p class="c-about__col-desc">${s.about_2_desc || '...'}</p>
          </div>
          <div class="c-about__col fade-in-up" style="transition-delay:0.24s">
            <div class="c-about__col-title">${s.about_3_title || 'OUR STORY'}</div>
            <p class="c-about__col-desc">${s.about_3_desc || '...'}</p>
          </div>
        </div>
      </section>

      <!-- GALLERY / RECOMMENDED & PROMOTIONS -->
      <section class="c-gallery" id="c-gallery">
        <div class="c-gallery__header">
          <h2 class="c-gallery__title fade-in-up">${t.recommendedTitle}</h2>
          <span class="c-gallery__subtitle">${t.recommendedSub}</span>
        </div>
        <div class="c-gallery__grid" id="gallery-grid">
          ${[1,2,3,4,5,6,7,8].map(i => `
            <div class="c-gallery__item ${i <= 4 ? 'c-gallery__item--square' : 'c-gallery__item--a4'}" data-gallery-idx="${i}" id="gallery-item-${i}">
              <img src="${s[`gallery_${i}`] || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80'}"
                   alt="Recommended ${i}" loading="lazy" />
              <div class="c-gallery__edit-btn" style="display:none" data-gallery-edit="${i}">
                 <i class="fas fa-camera"></i> เปลี่ยนรูป
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="c-footer" id="c-footer">
        <div class="c-footer__logo">${storeName.split(' ')[0]}<span>${storeName.split(' ')[1] || ''}</span></div>
        <div class="c-footer__sub">${tagline}</div>
        <div class="c-footer__divider"></div>
        <div class="c-footer__copy">&copy; 2024 ${storeName} · ${location}</div>
      </footer>

      <!-- iOS-STYLE BOTTOM DOCK (Always visible) -->
      <div class="c-bottom-dock visible" id="bottom-dock">
        <!-- Floating Utility icons bar -->
        <div class="c-bottom-dock__utility">
          <button class="c-utility-btn c-utility-btn--lang" id="lang-toggle-btn">
            <i class="fas fa-globe"></i>
            <span id="lang-btn-text">${this.currentLang === 'th' ? 'EN' : 'TH'}</span>
          </button>
          <a href="${locationUrl}" target="_blank" rel="noopener noreferrer" class="c-utility-btn" id="dock-location-btn" title="${t.locationTitle}">
            <i class="fas fa-map-marker-alt"></i>
          </a>
          <a href="tel:${phone}" class="c-utility-btn" id="dock-phone-btn" title="${t.phoneTitle}">
            <i class="fas fa-phone-alt"></i>
          </a>
          <button class="c-utility-btn" id="dock-hours-btn" title="${t.hoursTitle}">
            <i class="fas fa-clock"></i>
          </button>
          <button class="c-utility-btn" id="dock-share-btn" title="Share">
            <i class="fas fa-share-alt"></i>
          </button>
        </div>

        <!-- Main capsule bar -->
        <div class="c-bottom-dock__main">
          <button class="c-dock-btn" id="open-menu-drawer-btn">
            <i class="fas fa-utensils"></i>
            <span id="dock-menu-text">${t.viewMenu}</span>
          </button>
          <div class="c-dock-divider"></div>
          <button class="c-dock-btn" id="open-cart-btn">
            <div class="c-dock-cart-wrapper">
               <i class="fas fa-shopping-bag"></i>
               <span class="c-dock-cart-badge" id="cart-dock-count">0</span>
            </div>
            <span id="dock-cart-text">${t.cart}</span>
          </button>
        </div>
      </div>

      <!-- iOS-STYLE BOTTOM SHEET MENU DRAWER -->
      <div class="c-menu-drawer" id="menu-drawer" style="display:none">
        <div class="c-menu-drawer__sheet">
          <div class="c-menu-drawer__handle"></div>
          <div class="c-menu-drawer__header">
            <div class="c-menu-drawer__title" id="drawer-title-el">${t.ourMenu}</div>
            <button class="c-menu-drawer__close" id="menu-drawer-close-btn" aria-label="Close">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="c-menu-drawer__search">
            <i class="fas fa-search c-menu-drawer__search-icon"></i>
            <input type="text" id="menu-search-input" placeholder="${t.searchPlaceholder}" />
          </div>
          <div class="c-menu-drawer__items-container" id="menu-categories-container">
            ${this._renderMenuSections(this.menus)}
          </div>
        </div>
      </div>

      <!-- iOS-STYLE TOAST NOTIFICATION -->
      <div class="c-toast" id="toast-el"></div>

      <!-- iOS-STYLE IMAGE LIGHTBOX -->
      <div class="c-lightbox" id="lightbox">
        <button class="c-lightbox__close" id="lightbox-close">&times;</button>
        <img class="c-lightbox__content" id="lightbox-img" src="" alt="Large recommended item" />
      </div>

      <!-- CART MODAL (bottom sheet) -->
      <div class="c-cart-modal" id="cart-modal">
        <div class="c-cart-modal__sheet">
          <div class="c-cart-modal__handle"></div>
          <div class="c-cart-modal__title" id="cart-title-el">${t.cartHeader}</div>
          <div id="cart-items-list"></div>
          <div class="c-cart-modal__total">
            <span id="cart-total-label">${t.total}</span>
            <span id="cart-total-price">฿ 0</span>
          </div>
          <button class="c-checkout-btn" id="checkout-btn">${t.checkout}</button>
        </div>
      </div>

      <!-- GUEST MODAL -->
      <div class="c-modal-overlay" id="guest-modal">
        <div class="c-modal-box">
          <div class="c-modal-handle"></div>
          <div class="c-modal-title" id="guest-modal-title">${t.verifyTitle}</div>
          <p class="c-modal-subtitle" id="guest-modal-sub">${t.verifySub}</p>
          <input class="c-modal-input" type="text" id="guest-name-input" placeholder="${t.fullName}" />
          <input class="c-modal-input" type="tel" id="guest-phone-input" placeholder="${t.phoneNumber}" />
          <button class="c-modal-btn" id="guest-submit-btn">${t.sendOtp}</button>
          <button class="c-modal-btn secondary" id="guest-cancel-btn">${t.cancel}</button>
        </div>
      </div>

      <!-- OTP MODAL -->
      <div class="c-modal-overlay" id="otp-modal">
        <div class="c-modal-box">
          <div class="c-modal-handle"></div>
          <div class="c-modal-title" id="otp-modal-title">${t.verifyOtp}</div>
          <p class="c-modal-subtitle">${t.otpSub} <strong id="otp-phone-display" style="color:var(--red)"></strong></p>
          <input class="c-modal-input" type="text" id="otp-input" placeholder="OTP 6 Digits" maxlength="6" inputmode="numeric" />
          <button class="c-modal-btn" id="otp-verify-btn">${t.verifyBtn}</button>
          <button class="c-modal-btn secondary" id="otp-back-btn">${t.editPhone}</button>
        </div>
      </div>

      <!-- STAFF LOGIN MODAL -->
      <div class="c-modal-overlay c-staff-modal" id="staff-modal">
        <div class="c-modal-box">
          <div class="c-modal-handle"></div>
          <div class="c-modal-title" id="staff-modal-title">${t.staffTitle}</div>
          <p class="c-modal-subtitle" id="staff-modal-sub">${t.staffSub}</p>
          <input class="c-modal-input" type="email" id="staff-email-input" placeholder="${t.email}" />
          <input class="c-modal-input" type="password" id="staff-pass-input" placeholder="${t.password}" />
          <button class="c-modal-btn" id="staff-login-btn">${t.login}</button>
          <button class="c-modal-btn secondary" id="staff-cancel-btn">${t.close}</button>
        </div>
      </div>
    `;

    this.container.innerHTML = '';
    this.container.appendChild(root);
  }

  // ──────────────────────────────────────────────
  // MENU CARDS
  // ──────────────────────────────────────────────
  _renderMenuCards(menus) {
    if (!menus || menus.length === 0) {
      const t = TRANSLATIONS[this.currentLang];
      return `<div style="color:var(--text-muted);text-align:center;grid-column:1/-1;padding:2rem;font-family:'Prompt',sans-serif;">${t.emptyMenu}</div>`;
    }
    return menus.map(m => {
      const displayName = this.currentLang === 'th' ? m.name_th : m.name_en;
      const displayCategory = this.currentLang === 'th' ? m.category_name_th : m.category_name_en;
      return `
        <div class="c-menu-card fade-in-up" data-menu-id="${m.id}" data-menu-price="${m.price}" data-menu-name="${displayName}">
          <div class="c-menu-card__img-container">
            ${m.image_url
              ? `<img src="${m.image_url}" alt="${displayName}" loading="lazy" />`
              : `<div class="c-menu-card__img-placeholder">🌮</div>`
            }
          </div>
          <div class="c-menu-card__details">
            <div class="c-menu-card__name">${displayName}</div>
            <div class="c-menu-card__tag">${displayCategory}</div>
            <div class="c-menu-card__footer">
              <span class="c-menu-card__price">฿ ${Number(m.price).toLocaleString()}</span>
              <button class="c-menu-card__add-btn add-to-cart-btn"
                data-id="${m.id}" data-price="${m.price}" data-name="${displayName}"
                aria-label="เพิ่ม ${displayName} ลงตะกร้า">+</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  _renderMenuSections(menus) {
    if (!menus || menus.length === 0) {
      const t = TRANSLATIONS[this.currentLang];
      return `<div class="c-empty"><i class="fas fa-burger"></i>${t.emptyMenu}</div>`;
    }

    const categoriesMap = {};
    menus.forEach(m => {
      const catId = m.category_id || 'others';
      const catName = this.currentLang === 'th' ? m.category_name_th : m.category_name_en;
      const sortOrder = m.sort_order !== undefined ? m.sort_order : 999;
      if (!categoriesMap[catId]) {
        categoriesMap[catId] = {
          id: catId,
          name: catName,
          sort_order: sortOrder,
          items: []
        };
      }
      categoriesMap[catId].items.push(m);
    });

    const sortedCategories = Object.values(categoriesMap).sort((a, b) => a.sort_order - b.sort_order);
    const t = TRANSLATIONS[this.currentLang];

    return sortedCategories.map(cat => `
      <div class="c-menu-section fade-in-up" id="category-section-${cat.id}">
        <h3 class="c-menu-section__title">
          ${cat.name} <span>(${cat.items.length} ${t.itemsCount})</span>
        </h3>
        <div class="c-menu__grid">
          ${this._renderMenuCards(cat.items)}
        </div>
      </div>
    `).join('');
  }

  // ──────────────────────────────────────────────
  // NAV (scroll + logo trigger for staff)
  // ──────────────────────────────────────────────
  _initNav() {
    const nav = document.getElementById('c-nav');
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          nav.classList.toggle('scrolled', window.scrollY > 60);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Scroll to section on link click
    document.querySelectorAll('[data-scroll]').forEach(el => {
      el.addEventListener('click', () => {
        const target = document.getElementById(el.dataset.scroll);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Menu link click -> open menu drawer
    document.getElementById('nav-menu-link')?.addEventListener('click', () => {
      this._openMenuDrawer();
    });

    // Logo: 6 clicks → staff login
    const logo = document.getElementById('logo');
    let clickCount = 0;
    let resetTimer;
    logo.addEventListener('click', () => {
      clickCount++;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { clickCount = 0; }, 3000);
      if (clickCount >= 6) {
        clickCount = 0;
        this._openModal('staff-modal');
      }
    });

    // Staff modal
    document.getElementById('staff-login-btn').addEventListener('click', async () => {
      const email = document.getElementById('staff-email-input').value.trim();
      const pass = document.getElementById('staff-pass-input').value;
      if (!email || !pass) return alert('กรุณากรอกอีเมลและรหัสผ่าน');
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return alert('Login ไม่สำเร็จ: ' + error.message);
      this._closeModal('staff-modal');
      window.location.href = '/admin.html';
    });
    document.getElementById('staff-cancel-btn').addEventListener('click', () => this._closeModal('staff-modal'));
  }

  // ──────────────────────────────────────────────
  // GALLERY & LIGHTBOX
  // ──────────────────────────────────────────────
  _initGallery() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');

    // Track gallery clicks and open Lightbox
    document.querySelectorAll('.c-gallery__item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.c-gallery__edit-btn')) return;

        const img = item.querySelector('img');
        if (img && lightbox && lightboxImg) {
          lightboxImg.src = img.src;
          lightbox.style.display = 'flex';
          setTimeout(() => lightbox.classList.add('open'), 10);
          
          const idx = item.dataset.galleryIdx;
          this._trackEvent('gallery_click', { gallery_index: idx, ts: Date.now() });
        }
      });
    });

    const closeLightbox = () => {
      if (lightbox) {
        lightbox.classList.remove('open');
        setTimeout(() => { lightbox.style.display = 'none'; }, 350);
      }
    };

    lightboxClose?.addEventListener('click', closeLightbox);
    lightbox?.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // ──────────────────────────────────────────────
  // MENU SEARCH
  // ──────────────────────────────────────────────
  _initMenuSearch() {
    const input = document.getElementById('menu-search-input');
    let debounce;
    input?.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        const q = input.value.trim();
        this._trackEvent('menu_search', { query: q, ts: Date.now() });
        this._refreshMenuDrawer();
      }, 300);
    });
  }

  // ──────────────────────────────────────────────
  // DOCK ACTIONS
  // ──────────────────────────────────────────────
  _initDock() {
    // Toggle Language
    document.getElementById('lang-toggle-btn')?.addEventListener('click', () => {
      this.currentLang = this.currentLang === 'th' ? 'en' : 'th';
      this._updateLangUI();
      this._trackEvent('lang_toggle', { lang: this.currentLang, ts: Date.now() });
    });

    // Opening Hours Toast
    document.getElementById('dock-hours-btn')?.addEventListener('click', () => {
      const toast = document.getElementById('toast-el');
      const hoursText = this.settings.opening_hours || (this.currentLang === 'th' ? 'ทุกวัน 11:00 - 22:00' : 'Daily 11:00 AM - 10:00 PM');
      const toastPrefix = TRANSLATIONS[this.currentLang].toastHours;
      
      if (toast) {
        toast.textContent = `${toastPrefix}${hoursText}`;
        toast.classList.add('show');
        
        clearTimeout(this._toastTimeout);
        this._toastTimeout = setTimeout(() => {
          toast.classList.remove('show');
        }, 3000);
      }
      this._trackEvent('view_hours', { ts: Date.now() });
    });

    // Share Link
    document.getElementById('dock-share-btn')?.addEventListener('click', () => {
      const s = this.settings;
      const storeName = s.store_name || 'Mein Licht';
      const tagline = s.tagline || 'MEXICAN FUSION';
      
      if (navigator.share) {
        navigator.share({
          title: storeName,
          text: tagline,
          url: window.location.href
        }).catch(err => console.log('Share canceled or failed', err));
      } else {
        navigator.clipboard.writeText(window.location.href);
        const toast = document.getElementById('toast-el');
        if (toast) {
          toast.textContent = TRANSLATIONS[this.currentLang].copiedLink;
          toast.classList.add('show');
          clearTimeout(this._toastTimeout);
          this._toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
          }, 3000);
        }
      }
      this._trackEvent('share_store', { ts: Date.now() });
    });

    // Open/Close Drawer
    document.getElementById('open-menu-drawer-btn')?.addEventListener('click', () => {
      this._openMenuDrawer();
    });
    document.getElementById('menu-drawer-close-btn')?.addEventListener('click', () => {
      this._closeMenuDrawer();
    });
    document.getElementById('menu-drawer')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('menu-drawer')) this._closeMenuDrawer();
    });
  }

  _openMenuDrawer() {
    const drawer = document.getElementById('menu-drawer');
    if (drawer) {
      drawer.style.display = 'flex';
      drawer.getBoundingClientRect(); // reflow
      drawer.classList.add('open');
      this._refreshMenuDrawer();
      this._trackEvent('open_menu_drawer', { ts: Date.now() });
    }
  }

  _closeMenuDrawer() {
    const drawer = document.getElementById('menu-drawer');
    if (drawer) {
      drawer.classList.remove('open');
      setTimeout(() => {
        drawer.style.display = 'none';
      }, 400);
      this._trackEvent('close_menu_drawer', { ts: Date.now() });
    }
  }

  _refreshMenuDrawer() {
    const q = document.getElementById('menu-search-input')?.value.trim() || '';
    const container = document.getElementById('menu-categories-container');
    if (!container) return;

    if (!q) {
      container.innerHTML = this._renderMenuSections(this.menus);
    } else {
      const filtered = this.menus.filter(m => m.name.toLowerCase().includes(q.toLowerCase()));
      container.innerHTML = this._renderMenuSections(filtered);
    }
    this._initScrollAnimations();
  }

  _updateLangUI() {
    this._updateLangProperties();
    const t = TRANSLATIONS[this.currentLang];

    // Update Nav links
    const navLinks = document.querySelectorAll('.c-nav__links .c-nav__link');
    if (navLinks.length >= 4) {
      navLinks[0].textContent = t.about;
      navLinks[1].textContent = t.gallery;
      navLinks[2].textContent = t.menu;
      navLinks[3].textContent = t.contact;
    }

    // Update Gallery title
    const galTitle = document.querySelector('.c-gallery__title');
    const galSub = document.querySelector('.c-gallery__subtitle');
    if (galTitle) galTitle.textContent = t.recommendedTitle;
    if (galSub) galSub.textContent = t.recommendedSub;

    // Update Dock
    const langBtnText = document.getElementById('lang-btn-text');
    if (langBtnText) langBtnText.textContent = this.currentLang === 'th' ? 'EN' : 'TH';

    const dockMenuText = document.getElementById('dock-menu-text');
    if (dockMenuText) dockMenuText.textContent = t.viewMenu;

    const dockCartText = document.getElementById('dock-cart-text');
    if (dockCartText) dockCartText.textContent = t.cart;

    // Update Drawer Title & Search Placeholder
    const drawerTitle = document.getElementById('drawer-title-el');
    if (drawerTitle) drawerTitle.textContent = t.ourMenu;

    const searchInput = document.getElementById('menu-search-input');
    if (searchInput) searchInput.placeholder = t.searchPlaceholder;

    // Update Cart Title, Total Label, and Checkout Button
    const cartTitle = document.getElementById('cart-title-el');
    if (cartTitle) cartTitle.textContent = t.cartHeader;

    const cartTotalLabel = document.getElementById('cart-total-label');
    if (cartTotalLabel) cartTotalLabel.textContent = t.total;

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) checkoutBtn.textContent = t.checkout;

    // Update Modals
    const guestTitle = document.getElementById('guest-modal-title');
    if (guestTitle) guestTitle.textContent = t.verifyTitle;
    const guestSub = document.getElementById('guest-modal-sub');
    if (guestSub) guestSub.innerHTML = t.verifySub;
    const guestNameInput = document.getElementById('guest-name-input');
    if (guestNameInput) guestNameInput.placeholder = t.fullName;
    const guestPhoneInput = document.getElementById('guest-phone-input');
    if (guestPhoneInput) guestPhoneInput.placeholder = t.phoneNumber;
    const guestSubmitBtn = document.getElementById('guest-submit-btn');
    if (guestSubmitBtn) guestSubmitBtn.textContent = t.sendOtp;
    const guestCancelBtn = document.getElementById('guest-cancel-btn');
    if (guestCancelBtn) guestCancelBtn.textContent = t.cancel;

    const otpTitle = document.getElementById('otp-modal-title');
    if (otpTitle) otpTitle.textContent = t.verifyOtp;
    const otpInput = document.getElementById('otp-input');
    if (otpInput) otpInput.placeholder = 'OTP 6 Digits';
    const otpVerifyBtn = document.getElementById('otp-verify-btn');
    if (otpVerifyBtn) otpVerifyBtn.textContent = t.verifyBtn;
    const otpBackBtn = document.getElementById('otp-back-btn');
    if (otpBackBtn) otpBackBtn.textContent = t.editPhone;

    const staffTitle = document.getElementById('staff-modal-title');
    if (staffTitle) staffTitle.textContent = t.staffTitle;
    const staffSub = document.getElementById('staff-modal-sub');
    if (staffSub) staffSub.textContent = t.staffSub;
    const staffEmailInput = document.getElementById('staff-email-input');
    if (staffEmailInput) staffEmailInput.placeholder = t.email;
    const staffPassInput = document.getElementById('staff-pass-input');
    if (staffPassInput) staffPassInput.placeholder = t.password;
    const staffLoginBtn = document.getElementById('staff-login-btn');
    if (staffLoginBtn) staffLoginBtn.textContent = t.login;
    const staffCancelBtn = document.getElementById('staff-cancel-btn');
    if (staffCancelBtn) staffCancelBtn.textContent = t.close;

    // Re-render menu sections in the drawer
    this._refreshMenuDrawer();
    this._updateCartUI(); // Refresh cart names inside the cart list
  }

  // ──────────────────────────────────────────────
  // CART
  // ──────────────────────────────────────────────
  _initCart() {
    // Add to cart (event delegation)
    document.addEventListener('click', e => {
      const btn = e.target.closest('.add-to-cart-btn');
      if (!btn) return;
      const id = btn.dataset.id;
      const price = parseFloat(btn.dataset.price);
      const name = btn.dataset.name;
      this._addToCart(id, price, name);
      this._trackEvent('add_to_cart', { menu_id: id, price, ts: Date.now() });
    });

    // Open cart via main dock button
    document.getElementById('open-cart-btn')?.addEventListener('click', () => {
      this._openCartModal();
    });

    // Open cart via nav icon
    document.getElementById('cart-nav-btn')?.addEventListener('click', () => {
      this._openCartModal();
    });

    // Close cart on overlay click
    document.getElementById('cart-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('cart-modal')) this._closeCartModal();
    });

    // Checkout
    document.getElementById('checkout-btn').addEventListener('click', () => {
      this._closeCartModal();
      this._checkout();
    });
  }

  _addToCart(id, price, name) {
    const itemData = this.menus.find(m => m.id === id);
    const existing = this.cart.find(i => i.id === id);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({
        id,
        price,
        name_th: itemData ? itemData.name_th : name,
        name_en: itemData ? itemData.name_en : name,
        qty: 1
      });
    }
    this._updateCartUI();
  }

  _updateCartUI() {
    const count = this.cart.reduce((s, i) => s + i.qty, 0);
    const total = this.cart.reduce((s, i) => s + i.price * i.qty, 0);

    // Update badge in bottom dock
    const cartDockCount = document.getElementById('cart-dock-count');
    if (cartDockCount) cartDockCount.textContent = count;

    // Update total price
    const totalPriceEl = document.getElementById('cart-total-price');
    if (totalPriceEl) totalPriceEl.textContent = `฿ ${total.toLocaleString()}`;

    // Nav icon highlight
    const navBtn = document.getElementById('cart-nav-btn');
    navBtn?.classList.toggle('has-items', count > 0);

    // Render cart items (multilingual)
    const t = TRANSLATIONS[this.currentLang];
    document.getElementById('cart-items-list').innerHTML = this.cart.map(i => {
      const displayName = this.currentLang === 'th' ? i.name_th : i.name_en;
      return `
        <div class="c-cart-item">
          <div>
            <div class="c-cart-item__name">${displayName}</div>
            <div class="c-cart-item__qty">x${i.qty}</div>
          </div>
          <div class="c-cart-item__price">฿ ${(i.price * i.qty).toLocaleString()}</div>
        </div>
      `;
    }).join('') || `<div class="c-empty" style="padding:1.25rem 0"><i class="fas fa-shopping-bag"></i>${t.emptyCart}</div>`;
  }

  _openCartModal() {
    document.getElementById('cart-modal').classList.add('open');
  }

  _closeCartModal() {
    document.getElementById('cart-modal').classList.remove('open');
  }

  // ──────────────────────────────────────────────
  // CHECKOUT FLOW
  // ──────────────────────────────────────────────
  async _checkout() {
    if (this.cart.length === 0) return;
    if (!this.guestInfo) {
      this._openGuestModal();
      return;
    }
    await this._saveGuestReservation();
    const t = TRANSLATIONS[this.currentLang];
    alert(t.orderSuccess);
    this.cart = [];
    this._updateCartUI();
    this._trackEvent('checkout_complete', { ts: Date.now() });
  }

  _openGuestModal() {
    this._openModal('guest-modal');
    document.getElementById('guest-submit-btn').onclick = async () => {
      const name = document.getElementById('guest-name-input').value.trim();
      const phone = document.getElementById('guest-phone-input').value.trim();
      if (!name || !phone) return alert(this.currentLang === 'th' ? 'กรุณากรอกชื่อและเบอร์โทร' : 'Please fill name and phone number');
      try {
        await loginWithPhone(phone);
        this._closeModal('guest-modal');
        document.getElementById('otp-phone-display').textContent = phone;
        this._openModal('otp-modal');
        this._pendingGuestInfo = { name, phone };
        this._setupOtpVerify();
      } catch (e) {
        alert(e.message);
      }
    };
    document.getElementById('guest-cancel-btn').onclick = () => this._closeModal('guest-modal');
  }

  _setupOtpVerify() {
    document.getElementById('otp-verify-btn').onclick = async () => {
      const otpCode = document.getElementById('otp-input').value.trim();
      if (!otpCode || otpCode.length < 6) return alert(this.currentLang === 'th' ? 'กรุณากรอก OTP 6 หลัก' : 'Please enter 6-digit OTP');
      const { error } = await supabase.auth.verifyOtp({
        phone: this._pendingGuestInfo.phone,
        token: otpCode,
        type: 'sms',
      });
      if (error) return alert(this.currentLang === 'th' ? 'OTP ไม่ถูกต้อง: ' + error.message : 'Invalid OTP: ' + error.message);
      this.guestInfo = this._pendingGuestInfo;
      this._closeModal('otp-modal');
      this._checkout(); // retry
    };
    document.getElementById('otp-back-btn').onclick = () => {
      this._closeModal('otp-modal');
      this._openModal('guest-modal');
    };
  }

  // ──────────────────────────────────────────────
  // SAVE GUEST RESERVATION
  // ──────────────────────────────────────────────
  async _saveGuestReservation() {
    if (!this.guestInfo) return;
    const totalPrice = this.cart.reduce((s, i) => s + i.price * i.qty, 0);
    const reservation = {
      phone: this.guestInfo.phone,
      name: this.guestInfo.name,
      email: this.guestInfo.email || null,
      menu_items: this.cart.map(i => ({
        menu_id: i.id,
        name: this.currentLang === 'th' ? i.name_th : i.name_en,
        qty: i.qty,
        price: i.price
      })),
      total_price: totalPrice,
      user_agent: navigator.userAgent,
      behavior_data: {
        events: this.behaviorData,
        cart_size: this.cart.length,
        page_session_ms: Date.now() - this._sessionStart,
        referrer: document.referrer || null,
        screen: `${screen.width}x${screen.height}`,
        lang: navigator.language,
      },
    };
    const { error } = await supabase.from('guest_reservations').insert([reservation]);
    if (error) console.error('Save reservation error:', error);
  }

  // ──────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────
  _openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('open'); }
  }

  _closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('open'); }
  }

  _trackEvent(type, data) {
    this.behaviorData.push({ type, ...data });
  }

  _initScrollAnimations() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
  }
}

