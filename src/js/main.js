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

import { supabase } from './core/SupabaseClient.js';

window.importHandwrittenMenu = async () => {
  console.log("Starting menu import with variants from browser console...");
  
  const COMPANY_ID = '00000000-0000-0000-0000-000000000000';
  
  const categoriesToCreate = [
    { name_th: 'พิซซ่า', name_en: 'Pizza', sort_order: 4 },
    { name_th: 'เบอร์เกอร์เซ็ต', name_en: 'Burger Set', sort_order: 5 },
    { name_th: 'ทาโก้', name_en: 'Tacos', sort_order: 6 },
    { name_th: 'เคซาดิญ่า', name_en: 'Quesadilla', sort_order: 7 },
  ];

  const menuData = [
    // 1. Pizza
    { categoryNameTh: 'พิซซ่า', name_th: 'พิซซ่าเบคอน', name_en: 'Bacon Pizza', price: 219 },
    { categoryNameTh: 'พิซซ่า', name_th: 'พิซซ่าเห็ด', name_en: 'Mushroom Pizza', price: 200 },
    { categoryNameTh: 'พิซซ่า', name_th: 'พิซซ่าซอสเนื้อ', name_en: 'Beef Pizza', price: 229 },

    // 2. Snacks (Appetizers - ทานเล่น)
    { categoryNameTh: 'ทานเล่น', name_th: 'เซ็ทกินเล่นรวม', name_en: 'Snacks Set', price: 199 },
    { categoryNameTh: 'ทานเล่น', name_th: 'ไก่ทอดมายลิคท์', name_en: 'Fried Chicken', price: 149 },
    { categoryNameTh: 'ทานเล่น', name_th: 'ไก่ทอดสไปซี่', name_en: 'Fried Chicken Spicy', price: 159 },
    { categoryNameTh: 'ทานเล่น', name_th: 'เฟรนช์ฟรายส์', name_en: 'French Fries', price: 99 },
    { categoryNameTh: 'ทานเล่น', name_th: 'ข้าวโพดย่างรสนัว', name_en: 'Corn Ribs', price: 169 },

    // 3. Burger Set (with variants)
    {
      categoryNameTh: 'เบอร์เกอร์เซ็ต',
      name_th: 'เบอร์เกอร์',
      name_en: 'Burger',
      price: 159,
      variants: [
        { name_th: 'ไก่ต้ม', name_en: 'Chicken', price_cents: 15900 },
        { name_th: 'ไก่กรอบ', name_en: 'Fried Chicken', price_cents: 16900 },
        { name_th: 'หมู', name_en: 'Pork', price_cents: 17900 },
        { name_th: 'เนื้อ', name_en: 'Beef', price_cents: 18900 }
      ]
    },

    // 4. Rice Menu (Single Dishes - อาหารจานเดียว)
    { categoryNameTh: 'อาหารจานเดียว', name_th: 'ข้าวซอสเนื้อ + ไข่ดาว', name_en: 'Sauce Beef Rice', price: 149 },
    { categoryNameTh: 'อาหารจานเดียว', name_th: 'ข้าวไก่กรอบ', name_en: 'Fried Chicken Rice', price: 89 },
    { categoryNameTh: 'อาหารจานเดียว', name_th: 'ข้าวไก่กรอบสไปซี่', name_en: 'Fried Chicken Spicy Rice', price: 99 },
    {
      categoryNameTh: 'อาหารจานเดียว',
      name_th: 'ข้าวผัด',
      name_en: 'Fried Rice',
      price: 199,
      variants: [
        { name_th: 'ไก่', name_en: 'Chicken', price_cents: 19900 },
        { name_th: 'หมู', name_en: 'Pork', price_cents: 21900 },
        { name_th: 'เนื้อ', name_en: 'Beef', price_cents: 22900 }
      ]
    },

    // 5. Drinks (เครื่องดื่ม)
    { categoryNameTh: 'เครื่องดื่ม', name_th: 'โค้ก', name_en: 'Coke', price: 25 },
    { categoryNameTh: 'เครื่องดื่ม', name_th: 'น้ำเปล่า', name_en: 'Water', price: 15 },
    { categoryNameTh: 'เครื่องดื่ม', name_th: 'น้ำแข็งฟรี', name_en: 'Free Ice', price: 0 },

    // 6. Tacos (with variants)
    {
      categoryNameTh: 'ทาโก้',
      name_th: 'เลิฟเวอร์เซ็ต ทาโก้แป้งกรอบ',
      name_en: 'Lover Set Crispy Taco',
      price: 169,
      variants: [
        { name_th: 'ซอสไก่', name_en: 'Chicken', price_cents: 16900 },
        { name_th: 'ซอสหมู', name_en: 'Pork', price_cents: 17900 },
        { name_th: 'ซอสเนื้อ', name_en: 'Beef', price_cents: 19900 }
      ]
    },
    {
      categoryNameTh: 'ทาโก้',
      name_th: 'ไวท์เซ็ต ทาโก้แป้งนุ่ม',
      name_en: 'White Set Soft Taco',
      price: 169,
      variants: [
        { name_th: 'ซอสไก่', name_en: 'Chicken', price_cents: 16900 },
        { name_th: 'ซอสหมู', name_en: 'Pork', price_cents: 17900 },
        { name_th: 'ซอสเนื้อ', name_en: 'Beef', price_cents: 19900 }
      ]
    },
    {
      categoryNameTh: 'ทาโก้',
      name_th: 'คอนครั้น ทาโก้แป้งกรอบ (1 ชิ้น)',
      name_en: 'CornCrun Crispy Taco (1 pc)',
      price: 99,
      variants: [
        { name_th: 'ซอสไก่', name_en: 'Chicken', price_cents: 9900 },
        { name_th: 'ซอสหมู', name_en: 'Pork', price_cents: 11900 },
        { name_th: 'ซอสเนื้อ', name_en: 'Beef', price_cents: 13900 }
      ]
    },
    {
      categoryNameTh: 'ทาโก้',
      name_th: 'ไวท์ซอฟต์ ทาโก้แป้งนุ่ม (1 ชิ้น)',
      name_en: 'WhiteSoft Soft Taco (1 pc)',
      price: 99,
      variants: [
        { name_th: 'ซอสไก่', name_en: 'Chicken', price_cents: 9900 },
        { name_th: 'ซอสหมู', name_en: 'Pork', price_cents: 11900 },
        { name_th: 'ซอสเนื้อ', name_en: 'Beef', price_cents: 13900 }
      ]
    },

    // 7. Quesadilla (with variants)
    {
      categoryNameTh: 'เคซาดิญ่า',
      name_th: 'เคซาดิญ่า (ข้าว & ชีส)',
      name_en: 'Quesadilla Rice & Cheese',
      price: 179,
      variants: [
        { name_th: 'ไก่', name_en: 'Chicken', price_cents: 17900 },
        { name_th: 'หมู', name_en: 'Pork', price_cents: 19900 },
        { name_th: 'เนื้อ', name_en: 'Beef', price_cents: 21900 }
      ]
    },
    {
      categoryNameTh: 'เคซาดิญ่า',
      name_th: 'เคซาดิญ่า (เนื้อสัตว์ & ชีส)',
      name_en: 'Quesadilla Meat & Cheese',
      price: 189,
      variants: [
        { name_th: 'ไก่', name_en: 'Chicken', price_cents: 18900 },
        { name_th: 'หมู', name_en: 'Pork', price_cents: 21900 },
        { name_th: 'เนื้อ', name_en: 'Beef', price_cents: 23900 }
      ]
    },
    { categoryNameTh: 'เคซาดิญ่า', name_th: 'เคซาดิญ่าชีสล้วนสไตล์เม็กซิกัน', name_en: 'Quesadilla Only Cheese Mexican', price: 200 }
  ];

  // 1. Get existing categories
  const { data: existingCats, error: catFetchErr } = await supabase
    .from('categories')
    .select('*')
    .eq('company_id', COMPANY_ID);

  if (catFetchErr) {
    console.error("Error fetching categories:", catFetchErr);
    return "Error fetching categories";
  }

  // Create list of missing categories
  const catsToInsert = categoriesToCreate.filter(
    newCat => !existingCats.some(exCat => exCat.name_th === newCat.name_th)
  );

  if (catsToInsert.length > 0) {
    console.log("Inserting new categories:", catsToInsert);
    const { data: insertedCats, error: catInsertErr } = await supabase
      .from('categories')
      .insert(catsToInsert.map(c => ({ ...c, company_id: COMPANY_ID })))
      .select();

    if (catInsertErr) {
      console.error("Error inserting categories:", catInsertErr);
      return "Error inserting categories";
    }
    existingCats.push(...insertedCats);
  }

  // 2. Map category name_th to ID
  const categoryMap = {};
  existingCats.forEach(cat => {
    categoryMap[cat.name_th] = cat.id;
  });

  // 3. Get maximum current SKU number to auto-increment
  const { data: currentMenuItems, error: menuFetchErr } = await supabase
    .from('menu_items')
    .select('sku, name_th')
    .eq('company_id', COMPANY_ID);

  if (menuFetchErr) {
    console.error("Error fetching menu items:", menuFetchErr);
    return "Error fetching menu items";
  }

  let nextSkuNum = 8;
  currentMenuItems.forEach(item => {
    if (item.sku && item.sku.startsWith('SKU-')) {
      const num = parseInt(item.sku.split('-')[1]);
      if (!isNaN(num) && num >= nextSkuNum) {
        nextSkuNum = num + 1;
      }
    }
  });

  console.log("Next starting SKU number:", nextSkuNum);

  // 4. Create menu item payloads, checking for duplicates
  const itemsToInsert = [];
  let skuIndex = nextSkuNum;

  for (const item of menuData) {
    const exists = currentMenuItems.some(
      exItem => exItem.name_th.trim() === item.name_th.trim()
    );

    if (exists) {
      console.log(`Skipping duplicate item: ${item.name_th}`);
      continue;
    }

    const catId = categoryMap[item.categoryNameTh];
    if (!catId) {
      console.error(`Category ID not found for: ${item.categoryNameTh}`);
      continue;
    }

    const skuStr = `SKU-${String(skuIndex).padStart(3, '0')}`;
    skuIndex++;

    itemsToInsert.push({
      company_id: COMPANY_ID,
      category_id: catId,
      sku: skuStr,
      name_th: item.name_th,
      name_en: item.name_en,
      base_price_cents: item.price * 100,
      variants: item.variants || null,
      is_active: true,
      is_sold_out: false
    });
  }

  if (itemsToInsert.length === 0) {
    console.log("No new items to insert.");
    return "No new items to insert.";
  }

  console.log(`Inserting ${itemsToInsert.length} new menu items...`);
  const { error: menuInsertErr } = await supabase
    .from('menu_items')
    .insert(itemsToInsert);

  if (menuInsertErr) {
    console.error("Error inserting menu items:", menuInsertErr);
    return "Error inserting menu items";
  } else {
    console.log("Successfully inserted all menu items!");
    return "Success";
  }
};

