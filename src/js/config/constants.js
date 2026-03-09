// Configuration Constants for the POS application
export const CONSTANTS = {
    // Business Setup
    TAX_RATE: 7.00, // 7% VAT
    CURRENCY: "THB",
    LOCALE: "th-TH",
    TIMEZONE: "Asia/Bangkok",

    // Local Storage / Session Storage Keys
    STORAGE_KEYS: {
        POS_CART: 'me_pos_cart',
        AUTH_TOKEN: 'me_pos_auth',
        USER_PROFILE: 'me_pos_user'
    },

    // UI Settings
    UI: {
        SIDEBAR_WIDTH_DESKTOP: 260,
        MOBILE_BREAKPOINT: 1024,
        ANIMATION_SPEED: 300,
    }
};
