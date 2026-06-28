// src/js/pages/customerHome.js
// Mein Licht – Customer Portal (Public, no auth required)
import { supabase } from '../core/SupabaseClient.js';
import { loginWithPhone } from '../services/auth.js';
import { Utils } from '../utils.js';
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
    staffSub: 'ระบบสำหรับพนักงานเท่านั้น',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    login: 'เข้าสู่ระบบ',
    close: 'ปิด',
    reservationTimeLabel: 'เวลานัดหมายเข้ามารับประทาน',
    emptyReservationTime: 'กรุณาระบุเวลานัดหมาย'
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
    staffSub: 'Authorized Staff Only',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    close: 'Close',
    reservationTimeLabel: 'Reservation Date & Time',
    emptyReservationTime: 'Please specify your reservation time'
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
    try {
      this.likedItems = JSON.parse(localStorage.getItem('meinlicht_likes') || '[]');
    } catch (e) {
      this.likedItems = [];
    }
    this._init();
  }

  // ──────────────────────────────────────────────
  // INIT
  // ──────────────────────────────────────────────
  async _init() {
    // Load all settings from DB in parallel with menu_items from POS
    const [settingsResult, menuItemsResult, modGroupsResult, linksResult] = await Promise.all([
      supabase.from('restaurant_settings').select('key, value'),
      supabase.from('menu_items').select('*, categories(id, name_th, name_en, sort_order)').eq('is_active', true),
      supabase.from('modifier_groups').select('*, modifier_options(*)').eq('is_active', true),
      supabase.from('menu_item_modifier_groups').select('*')
    ]);

    this.modifierGroups = modGroupsResult.data || [];
    this.itemModifierGroups = linksResult.data || [];

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
        sort_order: item.categories?.sort_order !== undefined ? item.categories.sort_order : 999,
        item_sort_order: item.sort_order !== undefined ? item.sort_order : 999,
        likes_count: item.likes_count || 0,
        is_sold_out: item.is_sold_out || false,
        variants: item.variants
      }));
    }

    this._updateLangProperties();
    this._render();

    // Check active login session and fetch points if authenticated
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user && session.user.phone) {
            const companyId = '00000000-0000-0000-0000-000000000000';
            const { data: member } = await supabase
                .from('members')
                .select('*')
                .eq('phone', session.user.phone)
                .eq('company_id', companyId)
                .maybeSingle();

            if (member) {
                this.guestInfo = {
                    phone: member.phone,
                    name: member.name
                };
                this.guestPoints = member.points;
                this._updatePointsBadge();
            }
        }
    } catch (err) {
        console.error("Session restore failed:", err);
    }
    this._initNav();
    this._initGallery();
    this._initMenuSearch();
    this._initCart();
    this._initDetailModal();
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
    const storeName = s.store_name || 'ร้านค้า';
    document.title = storeName;
    const tagline = s.tagline || 'MEXICAN FUSION';
    const established = s.established || 'ESTD 2024';
    const location = s.location || 'Bangkok, Thailand';
    const heroImg = s.hero_image || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1600&q=80';
    const mascotImg = s.hero_logo || '';
    const storeLogo = s.store_logo || '';
    Utils.updateFavicon(storeLogo);
    const phone = s.store_phone || '064-9288187';
    const locationUrl = s.location_url || 'https://maps.app.goo.gl/qctSRFkG37zZDRdq9';
    const storefrontImg = s.storefront_image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80';

    const t = TRANSLATIONS[this.currentLang];

    const displayTagline = tagline === tagline.toUpperCase()
      ? tagline.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
      : tagline;

    // Create root element for customer portal
    const root = document.createElement('div');
    root.id = 'customer-root';
    root.innerHTML = `
      <!-- NAV -->
      <nav class="c-nav" id="c-nav">
        <div class="c-nav__logo" id="logo" style="display:flex;align-items:center;gap:0.5rem">
          ${storeLogo ? `<img src="${storeLogo}" alt="${storeName} logo" style="width:32px;height:32px;border-radius:50%;object-fit:cover" />` : ''}
          ${storeName.split(' ')[0]}<span>${storeName.split(' ')[1] || ''}</span>
        </div>
        <ul class="c-nav__links">
          <li class="c-nav__link" data-scroll="c-about">${t.about}</li>
          <li class="c-nav__link" data-scroll="c-gallery">${t.gallery}</li>
          <li class="c-nav__link" id="nav-menu-link">${t.menu}</li>
          <li class="c-nav__link" data-scroll="c-footer">${t.contact}</li>
        </ul>
        <div class="c-nav__actions" style="display:flex; align-items:center; gap:0.5rem;">
          <div id="customer-points-badge" style="display:none; font-family:'Outfit',sans-serif; font-size:0.75rem; font-weight:800; background:var(--red); color:white; padding:0.3rem 0.6rem; border-radius:20px; box-shadow:0 2px 8px rgba(183, 28, 28, 0.15);"></div>
          <button class="c-nav__icon-btn" id="cart-nav-btn" aria-label="ตะกร้า">
            <i class="fas fa-shopping-bag"></i>
          </button>
        </div>
      </nav>

      <!-- HERO – Custom overlay directly on image -->
      <section class="c-hero" id="c-hero">
        <!-- Full-bleed food photo -->
        <img class="c-hero__photo" src="${heroImg}" alt="${storeName} hero" id="hero-bg-img" />

        <!-- Overlay container sitting directly on the image -->
        <div class="c-hero__overlay">
          <div class="c-hero__title-container">
            <span class="c-hero__tagline-script">${displayTagline}</span>
            <h1 class="c-hero__name">${storeName}</h1>
          </div>
        </div>
      </section>

      <!-- ABOUT -->
      <section class="c-about" id="c-about">
        <div class="c-about__meta">
          <span>${established}</span>
          <span>${location}</span>
        </div>
        <div class="c-about__center">
          ${mascotImg
            ? `<img class="c-about__logo" src="${mascotImg}" alt="${storeName} mascot" />`
            : `<div class="c-about__logo-placeholder">🌮</div>`
          }
        </div>
        <div class="c-about__cols">
          <div class="c-about__col fade-in-up">
            <div class="c-about__col-title">${s.about_1_title || 'ABOUT US'}</div>
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
        ${storefrontImg ? `
          <div class="c-footer__storefront">
            <img src="${storefrontImg}" alt="Storefront" />
          </div>
        ` : ''}
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
          <div class="c-menu-categories-scroll" id="menu-categories-scroll"></div>
          <div class="c-menu-drawer__items-container" id="menu-categories-container">
            ${this._renderMenuSections(this.menus)}
          </div>
          
          <!-- Floating Cart Bar inside menu drawer -->
          <div class="c-drawer-cart-bar" id="drawer-cart-bar" style="display:none">
            <div class="c-drawer-cart-bar__info">
              <i class="fas fa-shopping-bag"></i>
              <span id="drawer-cart-bar-text"></span>
            </div>
            <button class="c-drawer-cart-bar__btn" id="drawer-cart-view-btn">
              ดูตะกร้า <i class="fas fa-chevron-right"></i>
            </button>
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
          <div style="margin-bottom:0.75rem; text-align:left;">
            <label style="font-size:0.72rem; font-weight:700; color:var(--red); display:block; margin-bottom:0.25rem; text-transform:uppercase; letter-spacing:0.05em;" id="guest-time-label">${t.reservationTimeLabel}</label>
            <input class="c-modal-input" type="datetime-local" id="guest-time-input" style="margin-bottom:0;" required />
          </div>
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

      <!-- iOS-STYLE FOOD DETAIL MODAL (Bottom Sheet view) -->
      <div class="c-detail-modal" id="detail-modal" style="display:none">
        <div class="c-detail-modal__sheet">
          <div class="c-detail-modal__handle"></div>
          
          <div class="c-detail-modal__banner">
            <button class="c-detail-modal__close-btn" id="detail-modal-close-btn" aria-label="Close">
              <i class="fas fa-chevron-left"></i>
            </button>
            <button class="c-detail-modal__like-btn like-btn" id="detail-modal-like-btn" aria-label="Like">
              <i class="far fa-heart"></i>
            </button>
            <div class="c-detail-modal__img-wrapper">
              <img id="detail-modal-img" src="" alt="Food Preview" />
            </div>
          </div>

          <div class="c-detail-modal__body">
            <div class="c-detail-modal__meta-row">
              <div>
                <h2 class="c-detail-modal__title" id="detail-modal-title"></h2>
                <span class="c-detail-modal__tag" id="detail-modal-tag"></span>
              </div>
              <div class="c-detail-modal__price" id="detail-modal-price"></div>
            </div>

            <div class="c-detail-modal__tab-content">
              <div class="c-detail-tab-panel" id="detail-panel-desc">
                <p id="detail-modal-desc-text" style="margin-top: 0.5rem;"></p>
                <div id="detail-modal-variants-container" style="margin-top: 1rem; display: none;"></div>
                <div id="detail-modal-modifiers-container" style="margin-top: 1rem; display: none;"></div>
              </div>
            </div>
          </div>

          <div class="c-detail-modal__actions">
            <div class="c-qty-selector">
              <button class="c-qty-btn" id="detail-qty-minus-btn">-</button>
              <span class="c-qty-value" id="detail-qty-value">1</span>
              <button class="c-qty-btn" id="detail-qty-plus-btn">+</button>
            </div>
            <button class="c-detail-add-btn" id="detail-add-to-cart-btn">
              <i class="fas fa-shopping-bag"></i> ใส่ตะกร้า
            </button>
          </div>
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
      const isLiked = this.likedItems.includes(m.id);
      
      const cartItem = this.cart.find(i => i.id === m.id);
      const cartQty = cartItem ? cartItem.qty : 0;
      
      let footerActionHTML = '';
      if (m.is_sold_out) {
        footerActionHTML = `
          <span style="font-size:0.7rem; font-weight:700; color:var(--text-muted); background:var(--cream-dark); padding:0.35rem 0.65rem; border-radius:var(--radius-pill); border:1px solid var(--cream-border);">${this.currentLang === 'th' ? 'หมดชั่วคราว' : 'Sold Out'}</span>
        `;
      } else if (cartQty > 0) {
        footerActionHTML = `
          <div class="c-menu-card__qty-controls">
            <button class="c-menu-card__qty-btn minus-cart-btn" data-id="${m.id}">-</button>
            <span class="c-menu-card__qty-val">${cartQty}</span>
            <button class="c-menu-card__qty-btn plus-cart-btn" data-id="${m.id}" data-price="${m.price}" data-name="${displayName}">+</button>
          </div>
        `;
      } else {
        footerActionHTML = `
          <button class="c-menu-card__add-btn add-to-cart-btn"
            data-id="${m.id}" data-price="${m.price}" data-name="${displayName}"
            aria-label="เพิ่ม ${displayName} ลงตะกร้า">+</button>
        `;
      }

      return `
        <div class="c-menu-card fade-in-up ${m.is_sold_out ? 'c-menu-card--sold-out' : ''}" data-menu-id="${m.id}" data-menu-price="${m.price}" data-menu-name="${displayName}">
          <div class="c-menu-card__img-container">
            ${m.image_url
              ? `<img src="${m.image_url}" alt="${displayName}" loading="lazy" />`
              : `<div class="c-menu-card__img-placeholder">🌮</div>`
            }
            ${m.is_sold_out ? `<div class="c-menu-card__sold-out-badge">${this.currentLang === 'th' ? 'หมด' : 'Out of stock'}</div>` : ''}
            <button class="c-menu-card__like-btn like-btn ${isLiked ? 'active' : ''}" data-id="${m.id}" aria-label="ถูกใจ" ${m.is_sold_out ? 'disabled style="display:none"' : ''}>
              <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
            </button>
          </div>
          <div class="c-menu-card__details">
            <div class="c-menu-card__name">${displayName}</div>
            <div class="c-menu-card__tag">
              ${displayCategory} · <i class="fas fa-heart" style="color:var(--red); font-size:0.6rem;"></i> <span class="c-card-like-count-${m.id}">${m.likes_count || 0}</span>
            </div>
            <div class="c-menu-card__footer">
              <span class="c-menu-card__price">฿ ${Number(m.price).toLocaleString()}</span>
              ${footerActionHTML}
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

    return sortedCategories.map(cat => {
      const sortedItems = cat.items.sort((a, b) => a.item_sort_order - b.item_sort_order);
      return `
        <div class="c-menu-section fade-in-up" id="category-section-${cat.id}">
          <h3 class="c-menu-section__title">
            ${cat.name} <span>(${cat.items.length} ${t.itemsCount})</span>
          </h3>
          <div class="c-menu__grid">
            ${this._renderMenuCards(sortedItems)}
          </div>
        </div>
      `;
    }).join('');
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
      window.location.href = '/pos';
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
      const hoursText = this.settings.opening_hours || (this.currentLang === 'th' ? '11:00 - 19:00 ปิดทุกวันอังคาร แนะนำให้โทรจองก่อนทุกครั้ง' : '11:00 AM - 7:00 PM, Closed Tuesdays. Booking recommended.');
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
      const storeName = s.store_name || 'ร้านค้า';
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
      this._activeCategoryFilter = 'all';
      this._renderCategoryPills();
      this._refreshMenuDrawer();
      this._trackEvent('open_menu_drawer', { ts: Date.now() });
      this._updateBodyScrollLock();
    }
  }

  _closeMenuDrawer() {
    const drawer = document.getElementById('menu-drawer');
    if (drawer) {
      drawer.classList.remove('open');
      setTimeout(() => {
        drawer.style.display = 'none';
        this._updateBodyScrollLock();
      }, 400);
      this._trackEvent('close_menu_drawer', { ts: Date.now() });
      this._updateBodyScrollLock();
    }
  }
  _refreshMenuDrawer() {
    const q = document.getElementById('menu-search-input')?.value.trim() || '';
    const container = document.getElementById('menu-categories-container');
    if (!container) return;

    let items = this.menus;

    // Filter by category first
    if (this._activeCategoryFilter && this._activeCategoryFilter !== 'all') {
      items = items.filter(m => (m.category_id || 'others') === this._activeCategoryFilter);
    }

    // Filter by search query
    if (q) {
      items = items.filter(m => {
        const displayName = this.currentLang === 'th' ? m.name_th : m.name_en;
        return displayName.toLowerCase().includes(q.toLowerCase());
      });
    }

    container.innerHTML = this._renderMenuSections(items);
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
    const guestTimeLabel = document.getElementById('guest-time-label');
    if (guestTimeLabel) guestTimeLabel.textContent = t.reservationTimeLabel;
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

      // Check if this menu item has linked modifiers
      const hasModifiers = (this.itemModifierGroups || []).some(link => link.menu_item_id === id);

      if (hasModifiers) {
        this._openDetailModal(id);
      } else {
        this._addToCart(id, price, name, 1);
        this._animateFlyToCart(btn, 1);
        this._trackEvent('add_to_cart', { menu_id: id, price, ts: Date.now() });
      }
    });

    // Like/Heart button toggle (event delegation for both card and detail modal)
    document.addEventListener('click', e => {
      const btn = e.target.closest('.like-btn');
      if (!btn) return;
      e.stopPropagation(); // Prevent card click / detail modal open when tapping heart
      const id = btn.dataset.id;
      if (id) {
        this._toggleLikeItem(id);
      }
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

    // Drawer cart view button handler (transitions smoothly from drawer to cart)
    document.getElementById('drawer-cart-view-btn')?.addEventListener('click', () => {
      this._closeMenuDrawer();
      setTimeout(() => {
        this._openCartModal();
      }, 350);
    });

    // Cart items quantity adjustment event delegation (+ / - buttons)
    document.getElementById('cart-items-list')?.addEventListener('click', e => {
      const btn = e.target.closest('.c-cart-qty-btn');
      if (!btn) return;
      const id = btn.dataset.id;
      const isPlus = btn.classList.contains('plus');
      this._changeCartItemQty(id, isPlus ? 1 : -1);
    });

    // Card-level plus quantity adjustment
    document.addEventListener('click', e => {
      const btn = e.target.closest('.plus-cart-btn');
      if (!btn) return;
      const id = btn.dataset.id;
      const price = parseFloat(btn.dataset.price);
      const name = btn.dataset.name;

      // Check if this menu item has linked modifiers
      const hasModifiers = (this.itemModifierGroups || []).some(link => link.menu_item_id === id);

      if (hasModifiers) {
        this._openDetailModal(id);
      } else {
        this._addToCart(id, price, name, 1);
        this._animateFlyToCart(btn, 1);
        this._trackEvent('add_to_cart_card', { menu_id: id, price, ts: Date.now() });
      }
    });

    // Card-level minus quantity adjustment
    document.addEventListener('click', e => {
      const btn = e.target.closest('.minus-cart-btn');
      if (!btn) return;
      const id = btn.dataset.id;
      this._changeCartItemQty(id, -1);
      this._trackEvent('remove_to_cart_card', { menu_id: id, ts: Date.now() });
    });
  }

  _addToCart(id, price, name, qty = 1) {
    const itemData = this.menus.find(m => m.id === id);
    const existing = this.cart.find(i => i.id === id);
    if (existing) {
      existing.qty += qty;
    } else {
      this.cart.push({
        id,
        price,
        name_th: itemData ? itemData.name_th : name,
        name_en: itemData ? itemData.name_en : name,
        qty: qty
      });
    }
    this._updateCartUI();
  }

  _toggleLikeItem(itemId) {
    const index = this.likedItems.indexOf(itemId);
    const wasLiked = index !== -1;
    const delta = wasLiked ? -1 : 1;
    
    if (wasLiked) {
      this.likedItems.splice(index, 1);
    } else {
      this.likedItems.push(itemId);
    }
    
    try {
      localStorage.setItem('meinlicht_likes', JSON.stringify(this.likedItems));
    } catch (e) {
      console.warn('Failed to save likes to localStorage:', e);
    }
    
    this._trackEvent('toggle_like', { menu_id: itemId, liked: !wasLiked, ts: Date.now() });
    
    // Database sync via RPC
    supabase.rpc('adjust_menu_item_likes', { item_id: itemId, increment_val: delta })
      .then(({ error }) => {
        if (error) console.error('Failed to sync likes to database:', error);
      });

    // Update in-memory menu likes_count
    const menuItem = this.menus.find(m => m.id === itemId);
    if (menuItem) {
      menuItem.likes_count = Math.max(0, (menuItem.likes_count || 0) + delta);
    }

    const isNowLiked = !wasLiked;
    
    // Update DOM counts on cards
    document.querySelectorAll(`.c-card-like-count-${itemId}`).forEach(el => {
      let currentVal = parseInt(el.textContent) || 0;
      el.textContent = Math.max(0, currentVal + delta);
    });

    // Update DOM count in detail modal if open
    const detailLikeCount = document.getElementById('detail-modal-like-count');
    if (detailLikeCount && this._selectedDetailItem && this._selectedDetailItem.id === itemId) {
      let currentVal = parseInt(detailLikeCount.textContent) || 0;
      detailLikeCount.textContent = Math.max(0, currentVal + delta);
    }

    // Update all matching buttons
    document.querySelectorAll(`.like-btn[data-id="${itemId}"]`).forEach(btn => {
      btn.classList.toggle('active', isNowLiked);
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className = isNowLiked ? 'fas fa-heart' : 'far fa-heart';
      }
      
      // Trigger spring pulse animation
      if (isNowLiked) {
        btn.classList.remove('liked-animation');
        btn.getBoundingClientRect(); // reflow
        btn.classList.add('liked-animation');
      } else {
        btn.classList.remove('liked-animation');
      }
    });
  }

  _changeCartItemQty(id, delta) {
    const existing = this.cart.find(i => i.id === id);
    if (existing) {
      existing.qty += delta;
      if (existing.qty <= 0) {
        this.cart = this.cart.filter(i => i.id !== id);
      }
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

    // Disable checkout button if store is closed
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      if (this.settings['store_status'] === 'closed') {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = this.currentLang === 'th' ? '🔴 ร้านปิดบริการชั่วคราว' : '🔴 Closed Temporarily';
        checkoutBtn.style.background = '#9CA3AF';
        checkoutBtn.style.cursor = 'not-allowed';
      } else {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = TRANSLATIONS[this.currentLang].checkout;
        checkoutBtn.style.background = '';
        checkoutBtn.style.cursor = '';
      }
    }

    // Update drawer floating cart bar
    const drawerCartBar = document.getElementById('drawer-cart-bar');
    const drawerCartBarText = document.getElementById('drawer-cart-bar-text');
    if (drawerCartBar) {
      if (count > 0) {
        drawerCartBar.style.display = 'flex';
        if (drawerCartBarText) {
          drawerCartBarText.innerHTML = this.currentLang === 'th'
            ? `มี <strong>${count}</strong> รายการในตะกร้า (<strong>฿ ${total.toLocaleString()}</strong>)`
            : `<strong>${count}</strong> items in cart (<strong>฿ ${total.toLocaleString()}</strong>)`;
        }
      } else {
        drawerCartBar.style.display = 'none';
      }
    }

    // Render cart items (multilingual & interactive)
    const t = TRANSLATIONS[this.currentLang];
    document.getElementById('cart-items-list').innerHTML = this.cart.map(i => {
      const displayName = this.currentLang === 'th' ? i.name_th : i.name_en;
      return `
        <div class="c-cart-item">
          <div class="c-cart-item__info">
            <div class="c-cart-item__name">${displayName}</div>
            <div class="c-cart-item__price">฿ ${Number(i.price).toLocaleString()}</div>
          </div>
          <div class="c-cart-item__actions">
            <div class="c-cart-qty-selector">
              <button class="c-cart-qty-btn minus" data-id="${i.id}">-</button>
              <span class="c-cart-qty-value">${i.qty}</span>
              <button class="c-cart-qty-btn plus" data-id="${i.id}">+</button>
            </div>
            <div class="c-cart-item__total-price">฿ ${(i.price * i.qty).toLocaleString()}</div>
          </div>
        </div>
      `;
    }).join('') || `<div class="c-empty" style="padding:1.25rem 0"><i class="fas fa-shopping-bag"></i>${t.emptyCart}</div>`;

    // Update DOM quantity controls on cards inline (preserves scroll position!)
    this.menus.forEach(m => {
      const cards = document.querySelectorAll(`.c-menu-card[data-menu-id="${m.id}"]`);
      const cartItem = this.cart.find(i => i.id === m.id);
      const cartQty = cartItem ? cartItem.qty : 0;
      const displayName = this.currentLang === 'th' ? m.name_th : m.name_en;

      cards.forEach(card => {
        const footer = card.querySelector('.c-menu-card__footer');
        if (!footer) return;

        if (cartQty > 0) {
          footer.innerHTML = `
            <span class="c-menu-card__price">฿ ${Number(m.price).toLocaleString()}</span>
            <div class="c-menu-card__qty-controls">
              <button class="c-menu-card__qty-btn minus-cart-btn" data-id="${m.id}">-</button>
              <span class="c-menu-card__qty-val">${cartQty}</span>
              <button class="c-menu-card__qty-btn plus-cart-btn" data-id="${m.id}" data-price="${m.price}" data-name="${displayName}">+</button>
            </div>
          `;
        } else {
          footer.innerHTML = `
            <span class="c-menu-card__price">฿ ${Number(m.price).toLocaleString()}</span>
            <button class="c-menu-card__add-btn add-to-cart-btn"
              data-id="${m.id}" data-price="${m.price}" data-name="${displayName}"
              aria-label="เพิ่ม ${displayName} ลงตะกร้า">+</button>
          `;
        }
      });
    });
  }

  _openCartModal() {
    document.getElementById('cart-modal').classList.add('open');
    this._updateBodyScrollLock();
  }

  _closeCartModal() {
    document.getElementById('cart-modal').classList.remove('open');
    this._updateBodyScrollLock();
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
    if (this.settings['store_status'] === 'closed') {
      alert(this.currentLang === 'th' 
        ? 'ขออภัย ขณะนี้ทางร้านปิดบริการชั่วคราว ไม่สามารถจองหรือสั่งอาหารล่วงหน้าได้ในขณะนี้' 
        : 'Sorry, the shop is currently closed. Pre-orders and reservations are unavailable.');
      return;
    }

    this._openModal('guest-modal');
    this._initFlatpickr();

    document.getElementById('guest-submit-btn').onclick = async () => {
      const name = document.getElementById('guest-name-input').value.trim();
      const phone = document.getElementById('guest-phone-input').value.trim();
      const resTime = document.getElementById('guest-time-input').value;
      if (!name || !phone) return alert(this.currentLang === 'th' ? 'กรุณากรอกชื่อและเบอร์โทร' : 'Please fill name and phone number');
      if (!resTime) return alert(TRANSLATIONS[this.currentLang].emptyReservationTime);
      try {
        await loginWithPhone(phone);
        this._closeModal('guest-modal');
        document.getElementById('otp-phone-display').textContent = phone;
        this._openModal('otp-modal');
        this._pendingGuestInfo = { name, phone, reservationTime: resTime };
        this._setupOtpVerify();
      } catch (e) {
        alert(e.message);
      }
    };
    document.getElementById('guest-cancel-btn').onclick = () => {
      if (this.flatpickrInstance) {
        this.flatpickrInstance.destroy();
        this.flatpickrInstance = null;
      }
      this._closeModal('guest-modal');
    };
  }

  _initFlatpickr() {
    const input = document.getElementById('guest-time-input');
    if (!input) return;
    
    // Change input type to text for flatpickr to hook on properly
    input.type = 'text';

    // Parse closed days
    const closedDays = (this.settings['weekly_closed_day'] || '2')
        .split(',')
        .map(x => x.trim())
        .filter(x => x !== '')
        .map(Number);

    const openTime = this.settings['open_time'] || '11:00';
    const closeTime = this.settings['close_time'] || '19:00';

    // Check if current time is past today's closing time
    const now = new Date();
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    const closeDateTime = new Date();
    closeDateTime.setHours(closeHour, closeMin || 0, 0, 0);

    let minDateVal = "today";
    if (now > closeDateTime) {
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      minDateVal = tomorrow;
    }

    // Flatpickr initialization
    this.flatpickrInstance = flatpickr(input, {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
      minDate: minDateVal,
      minTime: openTime,
      maxTime: closeTime,
      locale: this.currentLang === 'th' ? 'th' : 'default',
      disable: [
        function(date) {
          // Disable weekly closed days
          return closedDays.includes(date.getDay());
        }
      ],
      onChange: (selectedDates, dateStr, instance) => {
        // Double check if selected time is within range
        if (selectedDates.length > 0) {
          const selected = selectedDates[0];
          const [openHour, openMin] = openTime.split(':').map(Number);
          const [closeHour, closeMin] = closeTime.split(':').map(Number);
          
          const hours = selected.getHours();
          const minutes = selected.getMinutes();
          
          const selectedVal = hours * 60 + minutes;
          const openVal = openHour * 60 + (openMin || 0);
          const closeVal = closeHour * 60 + (closeMin || 0);
          
          if (selectedVal < openVal || selectedVal > closeVal) {
            alert(this.currentLang === 'th' 
              ? `กรุณาเลือกเวลาช่วง ${openTime} ถึง ${closeTime}` 
              : `Please select a time between ${openTime} and ${closeTime}`);
            instance.clear();
          }
        }
      }
    });
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
      reservation_time: this.guestInfo.reservationTime,
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
    if (m) {
      m.classList.add('open');
      this._updateBodyScrollLock();
    }
  }

  _closeModal(id) {
    const m = document.getElementById(id);
    if (m) {
      m.classList.remove('open');
      this._updateBodyScrollLock();
    }
  }

  _updateBodyScrollLock() {
    const isMenuOpen = document.getElementById('menu-drawer')?.classList.contains('open');
    const isCartOpen = document.getElementById('cart-modal')?.classList.contains('open');
    const isDetailOpen = document.getElementById('detail-modal')?.style.display === 'flex';
    const isGuestOpen = document.getElementById('guest-modal')?.classList.contains('open');
    const isOtpOpen = document.getElementById('otp-modal')?.classList.contains('open');
    const isStaffOpen = document.getElementById('staff-modal')?.classList.contains('open');

    if (isMenuOpen || isCartOpen || isDetailOpen || isGuestOpen || isOtpOpen || isStaffOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
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

  // ──────────────────────────────────────────────
  // FOOD DETAIL MODAL (iOS Bottom Sheet Style)
  // ──────────────────────────────────────────────
  _initDetailModal() {
    this._selectedDetailItem = null;
    this._detailQty = 1;

    // Open detail modal when clicking a menu card (excluding add-to-cart "+" button)
    document.addEventListener('click', e => {
      if (e.target.closest('.add-to-cart-btn')) return;
      const card = e.target.closest('.c-menu-card');
      if (!card) return;
      const id = card.dataset.menuId;
      if (id) {
        this._openDetailModal(id);
      }
    });

    // Close button
    document.getElementById('detail-modal-close-btn')?.addEventListener('click', () => {
      this._closeDetailModal();
    });

    // Close on overlay click
    document.getElementById('detail-modal')?.addEventListener('click', e => {
      if (e.target === document.getElementById('detail-modal')) {
        this._closeDetailModal();
      }
    });

    // Tabs
    document.getElementById('detail-tab-desc-btn')?.addEventListener('click', () => {
      this._toggleDetailTab('desc');
    });
    document.getElementById('detail-tab-reviews-btn')?.addEventListener('click', () => {
      this._toggleDetailTab('reviews');
    });

    // Qty adjust
    document.getElementById('detail-qty-minus-btn')?.addEventListener('click', () => {
      this._detailQty--;
      if (this._detailQty < 1) this._detailQty = 1;
      document.getElementById('detail-qty-value').textContent = this._detailQty;
    });
    document.getElementById('detail-qty-plus-btn')?.addEventListener('click', () => {
      this._detailQty++;
      document.getElementById('detail-qty-value').textContent = this._detailQty;
    });

    // Add to cart from detail modal
    document.getElementById('detail-add-to-cart-btn')?.addEventListener('click', () => {
      if (!this._selectedDetailItem) return;
      const item = this._selectedDetailItem;

      // Validate modifier groups min_selection requirements
      const linkedGroupIds = (this.itemModifierGroups || [])
          .filter(link => link.menu_item_id === item.id)
          .map(link => link.modifier_group_id);
      
      const activeGroups = (this.modifierGroups || []).filter(g => linkedGroupIds.includes(g.id));

      for (const group of activeGroups) {
          const min = group.min_selection || 0;
          if (min > 0) {
              const selectedCountInGroup = (this._selectedModifiers || []).filter(o => o.groupId === group.id).length;
              if (selectedCountInGroup < min) {
                  const isTh = this.currentLang === 'th';
                  const groupName = isTh ? group.name_th : (group.name_en || group.name_th);
                  alert(isTh 
                      ? `กรุณาเลือกในกลุ่ม "${groupName}" อย่างน้อย ${min} รายการ` 
                      : `Please select at least ${min} options in "${groupName}"`);
                  return;
              }
          }
      }
      
      let finalId = item.id;
      let finalPrice = item.price;
      let finalNameTh = item.name_th;
      let finalNameEn = item.name_en;
      let chosenModifiers = [];

      if (this._selectedVariant) {
        finalId = `${item.id}-${this._selectedVariant.name_en}`;
        finalPrice = this._selectedVariant.price_cents / 100;
        finalNameTh = `${item.name_th} (${this._selectedVariant.name_th})`;
        finalNameEn = item.name_en 
          ? `${item.name_en} (${this._selectedVariant.name_en || this._selectedVariant.name_th})` 
          : (this._selectedVariant.name_en || this._selectedVariant.name_th);
      }

      if (this._selectedModifiers && this._selectedModifiers.length > 0) {
        const modIdSuffix = this._selectedModifiers.map(o => o.id).join('-');
        finalId = `${finalId}-${modIdSuffix}`;
        
        const extraCents = this._selectedModifiers.reduce((sum, o) => sum + o.price_cents, 0);
        finalPrice += extraCents / 100;

        const modNameTh = this._selectedModifiers.map(o => o.name_th).join(', ');
        const modNameEn = this._selectedModifiers.map(o => o.name_en || o.name_th).join(', ');

        finalNameTh = `${finalNameTh} (${modNameTh})`;
        finalNameEn = finalNameEn ? `${finalNameEn} (${modNameEn})` : modNameEn;
        
        chosenModifiers = this._selectedModifiers.map(o => ({
          id: o.id,
          name_th: o.name_th,
          name_en: o.name_en,
          price_cents: o.price_cents
        }));
      }

      const displayName = this.currentLang === 'th' ? finalNameTh : finalNameEn;

      // Add to cart manually to support custom composite properties
      const existing = this.cart.find(i => i.id === finalId);
      if (existing) {
        existing.qty += this._detailQty;
      } else {
        this.cart.push({
          id: finalId,
          price: finalPrice,
          name_th: finalNameTh,
          name_en: finalNameEn,
          qty: this._detailQty,
          modifiers: chosenModifiers.length > 0 ? chosenModifiers : undefined
        });
      }
      this._updateCartUI();
      
      // Trigger fly animation
      const startEl = document.getElementById('detail-modal-img') || document.getElementById('detail-add-to-cart-btn');
      this._animateFlyToCart(startEl, this._detailQty);

      // Track event
      this._trackEvent('add_to_cart_detail', { menu_id: finalId, qty: this._detailQty, price: finalPrice, ts: Date.now() });

      // Toast feedback
      const toast = document.getElementById('toast-el');
      if (toast) {
        toast.textContent = this.currentLang === 'th' 
          ? `🛍 เพิ่ม ${displayName} (${this._detailQty} ชิ้น) ลงตะกร้าแล้ว!`
          : `🛍 Added ${displayName} (${this._detailQty} items) to cart!`;
        toast.classList.add('show');
        clearTimeout(this._toastTimeout);
        this._toastTimeout = setTimeout(() => { toast.classList.remove('show'); }, 3000);
      }

      this._closeDetailModal();
    });
  }

  _openDetailModal(itemId) {
    const item = this.menus.find(m => m.id === itemId);
    if (!item) return;

    this._selectedDetailItem = item;
    this._detailQty = 1;

    // Elements
    const modal = document.getElementById('detail-modal');
    const img = document.getElementById('detail-modal-img');
    const title = document.getElementById('detail-modal-title');
    const tag = document.getElementById('detail-modal-tag');
    const price = document.getElementById('detail-modal-price');
    const descText = document.getElementById('detail-modal-desc-text');
    const qtyVal = document.getElementById('detail-qty-value');

    // Populate data
    const displayName = this.currentLang === 'th' ? item.name_th : item.name_en;
    const displayCategory = this.currentLang === 'th' ? item.category_name_th : item.category_name_en;

    title.textContent = displayName;
    tag.innerHTML = `${displayCategory} · <i class="fas fa-heart" style="color:var(--red); font-size:0.65rem;"></i> <span id="detail-modal-like-count">${item.likes_count || 0}</span>`;
    price.textContent = `฿ ${Number(item.price).toLocaleString()}`;
    qtyVal.textContent = '1';

    if (item.image_url) {
      img.src = item.image_url;
      img.style.display = 'block';
    } else {
      img.style.display = 'none';
    }

    // Dynamic Mock Description based on item name
    descText.textContent = this._getMockDescription(displayName);

    // Disable adding to cart if sold out
    const addBtn = document.getElementById('detail-add-to-cart-btn');
    const qtySelector = modal.querySelector('.c-qty-selector');
    if (item.is_sold_out) {
      if (addBtn) {
        addBtn.disabled = true;
        addBtn.style.opacity = '0.5';
        addBtn.style.pointerEvents = 'none';
        addBtn.innerHTML = `<i class="fas fa-ban"></i> ${this.currentLang === 'th' ? 'หมดชั่วคราว' : 'Sold Out'}`;
      }
      if (qtySelector) qtySelector.style.opacity = '0.3';
    } else {
      if (addBtn) {
        addBtn.disabled = false;
        addBtn.style.opacity = '1';
        addBtn.style.pointerEvents = 'auto';
        addBtn.innerHTML = `<i class="fas fa-shopping-bag"></i> ${this.currentLang === 'th' ? 'ใส่ตะกร้า' : 'ใส่ตะกร้า'}`;
      }
      if (qtySelector) qtySelector.style.opacity = '1';
    }

    // Sync Like Status on Detail Like Button
    const likeBtn = document.getElementById('detail-modal-like-btn');
    if (likeBtn) {
      likeBtn.dataset.id = itemId;
      const isLiked = this.likedItems.includes(itemId);
      likeBtn.classList.toggle('active', isLiked);
      const icon = likeBtn.querySelector('i');
      if (icon) {
        icon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
      }
    }

    // Price updater helper
    const updateTotalPrice = () => {
        let baseCents = this._selectedVariant ? this._selectedVariant.price_cents : (item.price * 100);
        let extraCents = (this._selectedModifiers || []).reduce((sum, o) => sum + o.price_cents, 0);
        price.textContent = `฿ ${Number((baseCents + extraCents) / 100).toLocaleString()}`;
    };

    // Render variants if present
    const variantsContainer = document.getElementById('detail-modal-variants-container');
    this._selectedVariant = null;

    let parsedVariants = null;
    if (item.variants) {
      try {
        parsedVariants = typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants;
      } catch (e) {
        parsedVariants = null;
      }
    }

    if (parsedVariants && parsedVariants.length > 0) {
      this._selectedVariant = parsedVariants[0];
      price.textContent = `฿ ${Number(this._selectedVariant.price_cents / 100).toLocaleString()}`;
      
      const isTh = this.currentLang === 'th';
      const labelText = isTh ? 'เลือกประเภท / เนื้อสัตว์ / ขนาด' : 'Select Size / Meat / Type';

      let optionsHtml = `<label style="display:block; font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-bottom:0.5rem; text-transform:uppercase; letter-spacing:0.05em;">${labelText}</label>
      <div style="display:flex; flex-direction:column; gap:0.5rem;">`;

      parsedVariants.forEach((v, index) => {
        const vName = isTh ? v.name_th : (v.name_en || v.name_th);
        const isActive = index === 0;
        const activeBorder = isActive ? 'border: 2px solid var(--red); background: rgba(183, 28, 28, 0.04);' : 'border: 1.5px solid var(--cream-border);';
        const activeDot = isActive ? 'display: block;' : 'display: none;';
        const activeDotBorder = isActive ? 'border-color: var(--red);' : 'border-color: #C8C8C8;';

        optionsHtml += `
          <div class="variant-option-card" data-index="${index}" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-radius: 12px; cursor: pointer; transition: all 0.2s; ${activeBorder}">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div class="variant-option-radio" style="width: 16px; height: 16px; border-radius: 50%; border: 2px solid; display: flex; align-items: center; justify-content: center; ${activeDotBorder}">
                <div class="variant-option-dot" style="width: 8px; height: 8px; border-radius: 50%; background: var(--red); ${activeDot}"></div>
              </div>
              <span style="font-family: 'Prompt', sans-serif; font-size: 0.8rem; font-weight: 700; color: var(--dark);">${vName}</span>
            </div>
            <span style="font-family: 'Outfit', sans-serif; font-size: 0.85rem; font-weight: 800; color: var(--red);">฿ ${Number(v.price_cents / 100).toLocaleString()}</span>
          </div>
        `;
      });
      optionsHtml += `</div>`;
      
      if (variantsContainer) {
        variantsContainer.innerHTML = optionsHtml;
        variantsContainer.style.display = 'block';

        // Add click handlers for options
        const cards = variantsContainer.querySelectorAll('.variant-option-card');
        cards.forEach(card => {
          card.onclick = () => {
            // Reset all styles
            cards.forEach(c => {
              c.style.border = '1.5px solid var(--cream-border)';
              c.style.background = '';
              c.querySelector('.variant-option-radio').style.borderColor = '#C8C8C8';
              c.querySelector('.variant-option-dot').style.display = 'none';
            });

            // Set active styles
            card.style.border = '2px solid var(--red)';
            card.style.background = 'rgba(183, 28, 28, 0.04)';
            card.querySelector('.variant-option-radio').style.borderColor = 'var(--red)';
            card.querySelector('.variant-option-dot').style.display = 'block';

            // Update selection state
            const selectedIdx = parseInt(card.dataset.index);
            this._selectedVariant = parsedVariants[selectedIdx];
            updateTotalPrice();
          };
        });
      }
    } else {
      if (variantsContainer) {
        variantsContainer.innerHTML = '';
        variantsContainer.style.display = 'none';
      }
    }

    // Render modifiers if present
    const modifiersContainer = document.getElementById('detail-modal-modifiers-container');
    this._selectedModifiers = [];

    const linkedGroupIds = (this.itemModifierGroups || [])
        .filter(link => link.menu_item_id === item.id)
        .map(link => link.modifier_group_id);

    const activeGroups = (this.modifierGroups || []).filter(g => linkedGroupIds.includes(g.id));

    if (activeGroups.length > 0 && modifiersContainer) {
      const isTh = this.currentLang === 'th';
      let modifiersHtml = '';

      activeGroups.forEach(group => {
          const options = (group.modifier_options || []).filter(o => o.is_active);
          const isSingleSelect = group.max_selection === 1;
          const labelText = isTh ? group.name_th : (group.name_en || group.name_th);
          const requirementText = group.min_selection > 0 
              ? (isTh ? `* จำเป็นต้องเลือกอย่างน้อย ${group.min_selection}` : `* Select at least ${group.min_selection}`) 
              : '';
          
          modifiersHtml += `
            <div class="customer-modifier-group-block" style="margin-top:1.25rem;" data-group-id="${group.id}" data-min="${group.min_selection}" data-max="${group.max_selection}" data-name="${labelText}">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                <label style="font-size:0.75rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">${labelText}</label>
                <span style="font-size:0.65rem; font-weight:600; color:var(--red);">${requirementText}</span>
              </div>
              <div style="display:flex; flex-direction:column; gap:0.5rem;">
                ${options.map(opt => {
                    const optName = isTh ? opt.name_th : (opt.name_en || opt.name_th);
                    const isSoldOut = opt.is_sold_out;
                    return `
                      <div class="customer-modifier-option-card" 
                           data-group-id="${group.id}" 
                           data-option-id="${opt.id}" 
                           data-price-cents="${opt.price_cents}"
                           data-name-th="${opt.name_th}"
                           data-name-en="${opt.name_en || ''}"
                           style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border-radius: 12px; cursor: ${isSoldOut ? 'not-allowed' : 'pointer'}; transition: all 0.2s; border: 1.5px solid var(--cream-border); background: ${isSoldOut ? '#F2F2F7' : 'white'}; opacity: ${isSoldOut ? 0.45 : 1}; pointer-events: ${isSoldOut ? 'none' : 'auto'};">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <div class="modifier-option-checkbox" style="width: 16px; height: 16px; border-radius: ${isSingleSelect ? '50%' : '4px'}; border: 2px solid #C8C8C8; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                            <div class="modifier-option-dot" style="width: 8px; height: 8px; border-radius: ${isSingleSelect ? '50%' : '2px'}; background: var(--red); display: none;"></div>
                          </div>
                          ${opt.image_url ? `<img src="${opt.image_url}" style="width: 28px; height: 28px; object-fit: cover; border-radius: 6px; border: 1px solid var(--cream-border); margin-right: 0.25rem;">` : ''}
                          <span style="font-family: 'Prompt', sans-serif; font-size: 0.8rem; font-weight: 700; color: var(--dark);">${optName} ${isSoldOut ? `<span style="font-family:'Prompt',sans-serif; font-size:0.6rem; font-weight:800; background:#FFEAEA; color:#FF3B30; padding:0.15rem 0.40rem; border-radius:10px; margin-left:0.25rem; pointer-events:none;">หมดชั่วคราว</span>` : ''}</span>
                        </div>
                        <span style="font-family: 'Outfit', sans-serif; font-size: 0.85rem; font-weight: 800; color: var(--red);">${opt.price_cents > 0 ? `+ ฿ ${Number(opt.price_cents / 100).toFixed(2)}` : '฿ 0.00'}</span>
                      </div>
                    `;
                }).join('')}
              </div>
            </div>
          `;
      });
      modifiersContainer.innerHTML = modifiersHtml;
      modifiersContainer.style.display = 'block';

      // Set up click handlers
      const blocks = modifiersContainer.querySelectorAll('.customer-modifier-group-block');
      blocks.forEach(block => {
          const groupId = block.dataset.groupId;
          const max = parseInt(block.dataset.max) || 999;
          const isSingle = max === 1;

          const cards = block.querySelectorAll('.customer-modifier-option-card');
          cards.forEach(card => {
              card.onclick = () => {
                  const optionId = card.dataset.optionId;
                  const priceCents = parseInt(card.dataset.priceCents) || 0;
                  const nameTh = card.dataset.nameTh;
                  const nameEn = card.dataset.nameEn;

                  const isChecked = card.style.borderColor === 'var(--red)';

                  if (isChecked) {
                      card.style.borderColor = 'var(--cream-border)';
                      card.style.background = 'white';
                      card.querySelector('.modifier-option-checkbox').style.borderColor = '#C8C8C8';
                      card.querySelector('.modifier-option-dot').style.display = 'none';

                      this._selectedModifiers = this._selectedModifiers.filter(o => o.id !== optionId);
                  } else {
                      if (isSingle) {
                          cards.forEach(c => {
                              c.style.borderColor = 'var(--cream-border)';
                              c.style.background = 'white';
                              c.querySelector('.modifier-option-checkbox').style.borderColor = '#C8C8C8';
                              c.querySelector('.modifier-option-dot').style.display = 'none';
                              this._selectedModifiers = this._selectedModifiers.filter(o => o.id !== c.dataset.optionId);
                          });
                      } else {
                          const currentGroupSelectedCount = this._selectedModifiers.filter(o => o.groupId === groupId).length;
                          if (currentGroupSelectedCount >= max) {
                              alert(`เลือกตัวเลือกเสริมได้สูงสุด ${max} รายการสำหรับกลุ่มนี้`);
                              return;
                          }
                      }

                      card.style.borderColor = 'var(--red)';
                      card.style.background = 'rgba(183, 28, 28, 0.04)';
                      card.querySelector('.modifier-option-checkbox').style.borderColor = 'var(--red)';
                      card.querySelector('.modifier-option-dot').style.display = 'block';

                      this._selectedModifiers.push({
                          id: optionId,
                          groupId: groupId,
                          name_th: nameTh,
                          name_en: nameEn,
                          price_cents: priceCents
                      });
                  }
                  updateTotalPrice();
              };
          });
      });
    } else {
      if (modifiersContainer) {
        modifiersContainer.innerHTML = '';
        modifiersContainer.style.display = 'none';
      }
    }

    // Open Modal
    if (modal) {
      modal.style.display = 'flex';
      this._trackEvent('view_item_details', { menu_id: itemId, ts: Date.now() });
      this._updateBodyScrollLock();
    }
  }

  _closeDetailModal() {
    const modal = document.getElementById('detail-modal');
    if (modal) {
      modal.style.display = 'none';
    }
    this._selectedDetailItem = null;
    this._updateBodyScrollLock();
  }
  _getMockDescription(name) {
    const isThai = this.currentLang === 'th';
    const n = name.toLowerCase();

    if (n.includes('ผัดไทย') || n.includes('pad thai')) {
      return isThai
        ? 'ผัดไทยสูตรพิเศษของร้าน เส้นจันท์เหนียวนุ่มผัดด้วยซอสมะขามเข้มข้นสูตรโบราณ รสชาติกลมกล่อมเปรี้ยวหวานเค็ม ครบสามรส เสิร์ฟพร้อมกุ้งสดตัวโตและผักเครื่องเคียงสดกรอบ'
        : 'Our signature Pad Thai. Chewy rice noodles stir-fried with rich tamarind sauce, fresh prawns, tofu, bean sprouts, and crushed peanuts for the perfect balance of sweet, sour, and savory flavors.';
    }
    if (n.includes('ข้าวผัด') || n.includes('fried rice')) {
      return isThai
        ? 'ข้าวผัดร้อนๆ ผัดกระทะไฟแรงจนเม็ดข้าวร่วนสวย มีกลิ่นหอมกระทะอันเป็นเอกลักษณ์ ผัดคลุกเคล้ากับวัตถุดิบหลักสดใหม่และต้นหอม รสชาติกลมกล่อมหอมละมุน'
        : 'Fragrant jasmine rice stir-fried over high heat with egg, fresh scallions, and your choice of protein, seasoned to perfection with a light smoky wok aroma.';
    }
    if (n.includes('กะเพรา') || n.includes('basil')) {
      return isThai
        ? 'กะเพราแท้รสจัดจ้าน ผัดพริกแห้งและกระเทียมจนหอมฟุ้ง คลุกเคล้าใบกะเพราป่ากลิ่นฉุนร้อนแรง ทานคู่กับข้าวสวยร้อนๆ และไข่ดาวกรอบขอบเจลลี่ แนะนำสำหรับคนชอบรสชาติจัดจ้าน'
        : 'Authentic fiery Thai basil stir-fry. Sautéed with garlic, fresh chili, and aromatic holy basil leaves. Served with warm jasmine rice and a crispy fried egg.';
    }
    if (n.includes('ปีกไก่') || n.includes('chicken wings') || n.includes('ทอด')) {
      return isThai
        ? 'ปีกไก่คัดขนาดพิเศษ หมักเครื่องเทศสมุนไพรจนเข้าเนื้อ ทอดในน้ำมันร้อนระอุจนหนังบางกรอบเหลืองทอง แต่เนื้อภายในยังชุ่มฉ่ำนุ่มละมุน เสิร์ฟคู่ซอสสูตรเด็ด'
        : 'Crispy fried chicken wings marinated in local herbs and spices, fried to a perfect golden crunch while remaining tender and juicy on the inside. Served with dipping sauce.';
    }
    if (n.includes('ชา') || n.includes('tea') || n.includes('นม') || n.includes('น้ำ')) {
      return isThai
        ? 'เครื่องดื่มรสละมุนคัดสรรวัตถุดิบเกรดพรีเมียม ชงสดใหม่ทุกแก้ว รสชาติหวานมันกำลังดี เติมความสดชื่นและกระปรี้กระเปร่าระหว่างวันได้อย่างดีเยี่ยม'
        : 'A refreshing premium beverage made from high-quality ingredients, freshly brewed per order. Perfectly balanced sweetness to cool you down and boost your day.';
    }

    const storeName = this.settings?.store_name || 'ร้านค้า';
    return isThai
      ? `เมนูแนะนำยอดนิยมของร้าน ${storeName}! คัดสรรเฉพาะวัตถุดิบชั้นดีที่สะอาดสดใหม่ นำมาปรุงสดแก้วต่อแก้ว/จานต่อจานอย่างพิถีพิถันเพื่อมอบรสชาติที่ดีที่สุดแก่คุณ`
      : `Popular recommended menu by ${storeName}! Crafted meticulously with handpicked fresh, clean ingredients to deliver the ultimate flavor profile in every serving.`;
  }

  _getMockReviewsHTML(name) {
    const isThai = this.currentLang === 'th';
    const reviews = [
      {
        author: isThai ? 'คุณพิชิตพล (Pichitpon)' : 'Pichitpon K.',
        stars: '★★★★★',
        text: isThai 
          ? `อร่อยสมมงร้าน ${this.settings?.store_name || 'ร้านค้า'} ครับ! เมนู ${name} นี้วัตถุดิบสดสะอาดมาก รสชาติกลมกล่อมกลิ่นหอมชวนทาน แนะนำอย่างยิ่ง!`
          : `Delicious and high-quality! The ${name} was fresh, well-seasoned, and aromatic. Definitely a must-try!`
      },
      {
        author: isThai ? 'Aria Rose' : 'Aria Rose',
        stars: '★★★★☆',
        text: isThai
          ? `ประทับใจความเร็วในการเสิร์ฟและรสชาติของ ${name} ค่ะ แพ็กเกจสะอาดเรียบร้อย อร่อยกลมกล่อมดีมาก`
          : `Really impressed with the speed and taste of this ${name}. Clean packaging and great flavor balance.`
      }
    ];

    return reviews.map(r => `
      <div class="c-review-card">
        <div class="c-review-card__header">
          <span class="c-review-card__author">${r.author}</span>
          <span class="c-review-card__stars">${r.stars}</span>
        </div>
        <p class="c-review-card__text">${r.text}</p>
      </div>
    `).join('');
  }

  _getUniqueCategories() {
    const catsMap = {};
    this.menus.forEach(m => {
      const catId = m.category_id || 'others';
      if (!catsMap[catId]) {
        catsMap[catId] = {
          id: catId,
          name_th: m.category_name_th || 'อื่นๆ',
          name_en: m.category_name_en || 'Others',
          sort_order: m.sort_order !== undefined ? m.sort_order : 999
        };
      }
    });
    return Object.values(catsMap).sort((a, b) => a.sort_order - b.sort_order);
  }

  _renderCategoryPills() {
    const container = document.getElementById('menu-categories-scroll');
    if (!container) return;

    const categories = this._getUniqueCategories();
    const isTh = this.currentLang === 'th';

    const allLabel = isTh ? 'ทั้งหมด' : 'All';
    let html = `
      <button class="c-category-pill ${this._activeCategoryFilter === 'all' ? 'active' : ''}" data-cat-id="all">
        ${allLabel}
      </button>
    `;

    categories.forEach(cat => {
      const label = isTh ? cat.name_th : cat.name_en;
      html += `
        <button class="c-category-pill ${this._activeCategoryFilter === cat.id ? 'active' : ''}" data-cat-id="${cat.id}">
          ${label}
        </button>
      `;
    });

    container.innerHTML = html;

    // Attach click events
    container.querySelectorAll('.c-category-pill').forEach(btn => {
      btn.onclick = () => {
        this._activeCategoryFilter = btn.dataset.catId;
        // Update active class
        container.querySelectorAll('.c-category-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._refreshMenuDrawer();
        
        // Scroll active pill into view smoothly
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      };
    });
  }

  _animateFlyToCart(startEl, qty = 1) {
    if (!startEl) return;
    
    // Target element: bottom dock cart button wrapper or drawer cart bar
    const drawer = document.getElementById('menu-drawer');
    let targetEl = document.getElementById('open-cart-btn');
    if (drawer && drawer.classList.contains('open')) {
      const barBtn = document.getElementById('drawer-cart-bar');
      if (barBtn && barBtn.style.display !== 'none') {
        targetEl = barBtn;
      }
    }
    if (!targetEl) return;
    
    const startRect = startEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    
    // Create fly element
    const flyEl = document.createElement('div');
    flyEl.className = 'c-fly-to-cart';
    flyEl.innerHTML = `+${qty}`;
    
    // Position it centered on start element
    const startX = startRect.left + (startRect.width / 2) - 16;
    const startY = startRect.top + (startRect.height / 2) - 16;
    
    flyEl.style.left = `${startX}px`;
    flyEl.style.top = `${startY}px`;
    flyEl.style.transform = 'scale(1)';
    
    document.body.appendChild(flyEl);
    
    // Force layout reflow
    flyEl.getBoundingClientRect();
    
    // Target position coordinates
    const targetX = targetRect.left + (targetRect.width / 2) - 16;
    const targetY = targetRect.top + (targetRect.height / 2) - 16;
    
    // Transition styles
    flyEl.style.left = `${targetX}px`;
    flyEl.style.top = `${targetY}px`;
    flyEl.style.transform = 'scale(0.15)';
    flyEl.style.opacity = '0.2';
    
    // Remove element on transition end & trigger pulse effects
    flyEl.addEventListener('transitionend', () => {
      flyEl.remove();
      
      const cartWrapper = document.getElementById('open-cart-btn');
      const cartBadge = document.getElementById('cart-dock-count');
      const cartNavBtn = document.getElementById('cart-nav-btn');
      const drawerCartBar = document.getElementById('drawer-cart-bar');
      
      // Pulse drawer cart bar
      if (drawerCartBar && drawerCartBar.style.display !== 'none') {
        drawerCartBar.classList.remove('pulse-dock');
        drawerCartBar.getBoundingClientRect();
        drawerCartBar.classList.add('pulse-dock');
        setTimeout(() => drawerCartBar.classList.remove('pulse-dock'), 400);
      }
      
      // Pulse bottom dock cart button
      if (cartWrapper) {
        cartWrapper.classList.remove('pulse-dock');
        cartWrapper.getBoundingClientRect();
        cartWrapper.classList.add('pulse-dock');
        setTimeout(() => cartWrapper.classList.remove('pulse-dock'), 400);
      }
      
      // Pulse cart badge
      if (cartBadge) {
        cartBadge.classList.remove('pulse-badge');
        cartBadge.getBoundingClientRect();
        cartBadge.classList.add('pulse-badge');
        setTimeout(() => cartBadge.classList.remove('pulse-badge'), 400);
      }

      // Pulse top navigation cart icon too!
      if (cartNavBtn) {
        cartNavBtn.classList.remove('pulse-badge');
        cartNavBtn.getBoundingClientRect();
        cartNavBtn.classList.add('pulse-badge');
        setTimeout(() => cartNavBtn.classList.remove('pulse-badge'), 400);
      }
    });
  }

  _updatePointsBadge() {
    const badge = document.getElementById('customer-points-badge');
    if (!badge) return;
    if (this.guestInfo) {
      badge.textContent = `🪙 ${this.guestPoints || 0} pts`;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }
}

