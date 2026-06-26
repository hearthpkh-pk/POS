// src/js/pages/adminSettings.js
// Admin UI: จัดการรูปภาพและข้อความหน้าลูกค้า (Dynamic settings using iOS HIG style)
import { supabase } from '../core/SupabaseClient.js';
import { Utils } from '../utils.js';

const STORAGE_BUCKET = 'restaurant-images';

export class AdminSettings {
  constructor(container, type = 'store') {
    this.container = container;
    this.type = type; // 'store' or 'website'
    this.settings = {};
    this._render();
  }

  async _render() {
    const isStore = this.type === 'store';
    const title = isStore ? 'ตั้งค่าข้อมูลร้าน' : 'ตั้งค่าหน้าเว็บลูกค้า';
    const subtitle = isStore 
      ? 'จัดการข้อมูลทั่วไป สถานะ เวลาเปิด-ปิด และช่องทางการติดต่อร้าน' 
      : 'จัดการรูปและข้อความที่แสดงในหน้าเว็บลูกค้า';
    
    // Icon square colors
    const iconBg = isStore ? 'bg-[#007AFF]' : 'bg-[#34C759]';
    const iconClass = isStore ? 'fas fa-store' : 'fas fa-palette';

    this.container.innerHTML = `
      <div class="p-4 lg:p-6 h-full overflow-y-auto custom-scroll bg-[#F2F2F7]">
        <div class="max-w-[800px] mx-auto">
          
          <!-- iOS Page Header -->
          <div class="flex items-center gap-4 mb-6">
            <div class="w-11 h-11 ${iconBg} text-white rounded-xl flex items-center justify-center text-lg shadow-sm">
              <i class="${iconClass}"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-900 leading-tight">${title}</h2>
              <p class="text-xs text-gray-500 mt-0.5">${subtitle}</p>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div id="settings-loading" class="flex flex-col items-center justify-center p-12 text-gray-400 bg-white border border-gray-150 rounded-2xl shadow-sm min-h-[200px]">
            <i class="fas fa-spinner fa-spin text-2xl text-[#007AFF] mb-3"></i>
            <p class="text-xs font-semibold">กำลังโหลดข้อมูลตั้งค่า...</p>
          </div>

          <!-- Main Settings Form -->
          <div id="settings-content" class="hidden space-y-6"></div>

        </div>
      </div>
    `;
    await this._loadSettings();
  }

  async _loadSettings() {
    const { data, error } = await supabase
      .from('restaurant_settings')
      .select('*')
      .order('key');

    const loadingEl = document.getElementById('settings-loading');
    if (loadingEl) loadingEl.style.display = 'none';

    const content = document.getElementById('settings-content');
    if (!content) return;
    content.classList.remove('hidden');

    if (error) {
      content.innerHTML = `
        <div class="p-4 bg-[#FFEAEA] text-[#FF3B30] rounded-xl border border-[#FFEAEA] text-sm font-semibold flex items-center gap-2">
          <i class="fas fa-exclamation-circle text-base"></i> โหลดข้อมูลตั้งค่าล้มเหลว: ${error.message}
        </div>
      `;
      return;
    }

    data.forEach(row => { this.settings[row.key] = row; });

    // Group settings by section based on type
    let sections = {};
    if (this.type === 'store') {
      sections = {
        '🏪 ข้อมูลพื้นฐานร้านค้า': ['store_name', 'tagline', 'established', 'store_logo'],
        '📍 ข้อมูลติดต่อและที่ตั้ง': ['location', 'store_phone', 'location_url', 'opening_hours'],
        '⚙️ สถานะและเวลาทำการ': ['store_status', 'weekly_closed_day', 'open_time', 'close_time'],
      };
    } else {
      sections = {
        '🖼️ รูปหน้าปกและตราสัญลักษณ์': ['hero_image', 'hero_logo', 'storefront_image'],
        '📝 เนื้อหาหัวข้อและคำบรรยาย (About Us)': ['about_1_title', 'about_1_desc', 'about_2_title', 'about_2_desc', 'about_3_title', 'about_3_desc'],
        '✨ แกลเลอรีภาพอาหารแนะนำ (8 รูป)': ['gallery_1', 'gallery_2', 'gallery_3', 'gallery_4', 'gallery_5', 'gallery_6', 'gallery_7', 'gallery_8'],
      };
    }

    content.innerHTML = Object.entries(sections).map(([sectionTitle, keys]) => `
      <div class="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div class="px-5 py-3.5 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
          ${sectionTitle}
        </div>
        <div class="p-4 ${keys.some(k => k.startsWith('gallery')) ? 'grid grid-cols-2 sm:grid-cols-4 gap-4' : 'divide-y divide-gray-100 space-y-4'}">
          ${keys.map((key, index) => {
            let row = this.settings[key];
            if (!row) {
              row = {
                key: key,
                label: this._getDefaultLabel(key),
                setting_type: (key === 'store_logo' || key.startsWith('gallery') || key.includes('image') || key === 'hero_logo') ? 'image' : 'text',
                value: this._getDefaultValue(key)
              };
            }
            // If it's a gallery item, don't show dividing line padding since it's a grid
            const isGallery = key.startsWith('gallery');
            const wrapperClass = isGallery ? 'relative' : (index > 0 ? 'pt-4' : '');
            return `<div class="${wrapperClass}">${this._renderSettingItem(row)}</div>`;
          }).join('')}
        </div>
      </div>
    `).join('');

    // Bind events
    this._bindEvents();
  }

  _renderSettingItem(row) {
    const isImage = row.setting_type === 'image';
    const val = row.value || '';

    if (isImage) {
      const isSquare = row.key === 'store_logo' || row.key === 'hero_logo';
      const containerWidth = isSquare ? 'max-w-[150px]' : 'w-full';
      return `
        <div class="settings-item flex flex-col gap-2 mx-auto ${containerWidth}" data-key="${row.key}">
          <div class="font-bold text-xs text-gray-400 uppercase tracking-wider">${row.label}</div>
          <div class="relative bg-gray-100 rounded-xl overflow-hidden border border-gray-200/60 aspect-[4/3] group shadow-inner">
            <img
              src="${val}"
              alt="${row.label}"
              class="w-full h-full object-cover transition duration-300 group-hover:scale-105"
              onerror="this.style.opacity='0'"
              id="img-preview-${row.key}"
            />
            ${!val ? `<div class="absolute inset-0 flex items-center justify-center text-gray-300 text-xl"><i class="far fa-image"></i></div>` : ''}
          </div>
          <button
            class="change-image-btn w-full bg-[#007AFF] hover:bg-blue-600 text-white rounded-lg py-1.5 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
            data-key="${row.key}"
          >
            <i class="fas fa-camera"></i> เปลี่ยนรูป
          </button>
          <input
            type="file"
            accept="image/*"
            id="file-input-${row.key}"
            class="hidden"
            data-key="${row.key}"
          />
        </div>
      `;
    }

    if (row.key === 'store_status') {
      const selectedOpen = val === 'open' ? 'selected' : '';
      const selectedClosed = val === 'closed' ? 'selected' : '';
      return `
        <div class="settings-item flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" data-key="${row.key}">
          <label class="font-bold text-xs text-gray-500 uppercase tracking-wider sm:w-1/3">${row.label}</label>
          <div class="flex gap-2 sm:w-2/3">
            <select
              class="text-setting-input flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[#007AFF] focus:ring-0 focus:outline-none transition"
              data-key="${row.key}"
            >
              <option value="open" ${selectedOpen}>เปิดบริการปกติ (open)</option>
              <option value="closed" ${selectedClosed}>ปิดบริการชั่วคราว (closed)</option>
            </select>
            <button
              class="save-text-btn bg-[#34C759] hover:bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-bold transition flex-shrink-0 shadow-sm"
              data-key="${row.key}"
            >บันทึก</button>
          </div>
        </div>
      `;
    }

    if (row.key === 'weekly_closed_day') {
      const options = [
        { value: '', label: 'ไม่มีวันหยุดประจำสัปดาห์ (เปิดทุกวัน)' },
        { value: '0', label: 'วันอาทิตย์ (Sunday)' },
        { value: '1', label: 'วันจันทร์ (Monday)' },
        { value: '2', label: 'วันอังคาร (Tuesday)' },
        { value: '3', label: 'วันพุธ (Wednesday)' },
        { value: '4', label: 'วันพฤหัสบดี (Thursday)' },
        { value: '5', label: 'วันศุกร์ (Friday)' },
        { value: '6', label: 'วันเสาร์ (Saturday)' }
      ];
      const renderedOptions = options.map(opt => {
        const selected = val === opt.value ? 'selected' : '';
        return `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
      }).join('');

      return `
        <div class="settings-item flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" data-key="${row.key}">
          <label class="font-bold text-xs text-gray-500 uppercase tracking-wider sm:w-1/3">${row.label}</label>
          <div class="flex gap-2 sm:w-2/3">
            <select
              class="text-setting-input flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[#007AFF] focus:ring-0 focus:outline-none transition"
              data-key="${row.key}"
            >
              ${renderedOptions}
            </select>
            <button
              class="save-text-btn bg-[#34C759] hover:bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-bold transition flex-shrink-0 shadow-sm"
              data-key="${row.key}"
            >บันทึก</button>
          </div>
        </div>
      `;
    }

    if (row.key === 'open_time' || row.key === 'close_time') {
      return `
        <div class="settings-item flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" data-key="${row.key}">
          <label class="font-bold text-xs text-gray-500 uppercase tracking-wider sm:w-1/3">${row.label}</label>
          <div class="flex gap-2 sm:w-2/3">
            <input
              type="time"
              class="text-setting-input flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[#007AFF] focus:ring-0 focus:outline-none transition"
              data-key="${row.key}"
              value="${val}"
            />
            <button
              class="save-text-btn bg-[#34C759] hover:bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-bold transition flex-shrink-0 shadow-sm"
              data-key="${row.key}"
            >บันทึก</button>
          </div>
        </div>
      `;
    }

    // Standard text / textarea input
    const isTextarea = val.length > 50 || row.key.includes('desc') || row.key === 'opening_hours' || row.key === 'location';
    return `
      <div class="settings-item flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2" data-key="${row.key}">
        <label class="font-bold text-xs text-gray-500 uppercase tracking-wider sm:w-1/3 sm:pt-2.5">${row.label}</label>
        <div class="flex gap-2 sm:w-2/3 items-start">
          ${isTextarea 
            ? `<textarea
                 class="text-setting-input flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-[#007AFF] focus:ring-0 focus:outline-none transition"
                 data-key="${row.key}"
                 rows="3.5"
               >${val}</textarea>`
            : `<input
                 type="text"
                 class="text-setting-input flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-[#007AFF] focus:ring-0 focus:outline-none transition"
                 data-key="${row.key}"
                 value="${val}"
               />`
          }
          <button
            class="save-text-btn bg-[#34C759] hover:bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-bold transition flex-shrink-0 shadow-sm sm:mt-0.5"
            data-key="${row.key}"
          >บันทึก</button>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    // Image change button → trigger file input
    document.querySelectorAll('.change-image-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        document.getElementById(`file-input-${key}`).click();
      });
    });

    // File input change → upload + update DB
    document.querySelectorAll('input[type="file"][data-key]').forEach(input => {
      input.addEventListener('change', async (e) => {
        const key = input.dataset.key;
        const file = e.target.files[0];
        if (!file) return;
        await this._uploadImage(key, file);
      });
    });

    // Text save
    document.querySelectorAll('.save-text-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const key = btn.dataset.key;
        const textarea = document.querySelector(`.text-setting-input[data-key="${key}"]`);
        const newValue = textarea.value.trim();
        await this._saveText(key, newValue, btn);
      });
    });
  }

  async _uploadImage(key, file) {
    const btn = document.querySelector(`.change-image-btn[data-key="${key}"]`);
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> อัปโหลด...';
    btn.disabled = true;

    try {
      const ext = file.name.split('.').pop();
      const filename = `${key}_${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filename, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filename);

      const publicUrl = urlData.publicUrl;

      // Update in DB
      const { data: dbData, error: dbError } = await supabase
        .from('restaurant_settings')
        .update({ value: publicUrl })
        .eq('key', key)
        .select();

      if (dbError) throw dbError;
      if (!dbData || dbData.length === 0) {
        throw new Error('บันทึกลงฐานข้อมูลไม่สำเร็จ (สิทธิ์ไม่ถูกต้อง หรือคุณยังไม่ได้เข้าสู่ระบบพนักงาน)');
      }

      // Update preview image
      const preview = document.getElementById(`img-preview-${key}`);
      if (preview) { preview.src = publicUrl; preview.style.opacity = '1'; }

      // Update local settings cache
      if (window.app && window.app.settings) {
        window.app.settings[key] = publicUrl;
      }

      // Update sidebar logo if store_logo is changed
      if (key === 'store_logo') {
        Utils.updateFavicon(publicUrl);
        const sidebarLogoImg = document.querySelector('#sidebar .p-6.border-b.hidden.lg\\:block img');
        if (sidebarLogoImg) {
          sidebarLogoImg.src = publicUrl;
        } else {
          const sidebarLogoContainer = document.querySelector('#sidebar .p-6.border-b.hidden.lg\\:block');
          const storeName = this.settings['store_name']?.value || 'POS';
          if (sidebarLogoContainer) {
            sidebarLogoContainer.innerHTML = `
              <div class="flex items-center gap-3">
                  <img src="${publicUrl}" alt="Logo" class="w-9 h-9 rounded-lg object-cover border border-gray-100" />
                  <div>
                      <h1 class="text-sm font-bold text-gray-900 leading-tight">${storeName}</h1>
                  </div>
              </div>
            `;
          }
        }
      }

      btn.innerHTML = '<i class="fas fa-check"></i> สำเร็จ!';
      btn.classList.replace('bg-[#007AFF]', 'bg-[#34C759]');
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.classList.replace('bg-[#34C759]', 'bg-[#007AFF]');
        btn.disabled = false;
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      alert('อัปโหลดไม่สำเร็จ: ' + err.message);
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  }

  async _saveText(key, value, btn) {
    const originalText = btn.textContent;
    btn.textContent = '...';
    btn.disabled = true;

    const existing = this.settings[key];
    const label = existing ? existing.label : this._getDefaultLabel(key);
    const setting_type = existing ? existing.setting_type : 'text';

    const { data, error } = await supabase
      .from('restaurant_settings')
      .upsert({
        key,
        value,
        label,
        setting_type
      }, { onConflict: 'key' })
      .select();

    if (error) {
      alert('บันทึกไม่สำเร็จ: ' + error.message);
      btn.textContent = originalText;
      btn.disabled = false;
    } else if (!data || data.length === 0) {
      alert('บันทึกไม่สำเร็จ: คุณไม่มีสิทธิ์แก้ไข (อาจยังไม่ได้ล็อกอินเป็นพนักงาน)');
      btn.textContent = originalText;
      btn.disabled = false;
    } else {
      this.settings[key] = data[0];

      // Update local settings cache
      if (window.app && window.app.settings) {
        window.app.settings[key] = value;
      }

      // Update sidebar logo text if store_name is changed
      if (key === 'store_name') {
        const sidebarLogoTitle = document.querySelector('#sidebar .p-6.border-b.hidden.lg\\:block h1');
        if (sidebarLogoTitle) {
          sidebarLogoTitle.textContent = value;
        }
        document.title = value;
        const mobileTitle = document.getElementById('store-title-mobile');
        if (mobileTitle) {
          mobileTitle.textContent = value;
        }
      }

      btn.textContent = '✓ บันทึกแล้ว';
      btn.classList.replace('bg-[#34C759]', 'bg-[#007AFF]');
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.replace('bg-[#007AFF]', 'bg-[#34C759]');
        btn.disabled = false;
      }, 2000);
    }
  }

  _getDefaultLabel(key) {
    const labels = {
      'store_logo': 'โลโก้ร้านค้า',
      'store_name': 'ชื่อร้านค้า',
      'tagline': 'สโลแกนร้าน',
      'established': 'ปีที่ก่อตั้ง (เช่น ESTD 2024)',
      'location': 'ที่ตั้งร้าน',
      'store_phone': 'เบอร์โทรศัพท์ติดต่อร้าน',
      'location_url': 'ลิงก์ Google Maps ของร้าน',
      'opening_hours': 'เวลาเปิด-ปิดร้าน (เช่น ทุกวัน 11:00 - 22:00)',
      'storefront_image': 'รูปภาพหน้าร้าน (แสดงท้ายเว็บไซต์)',
      'store_status': 'สถานะเปิดบริการหน้าร้าน (open = เปิดปกติ, closed = ปิดบริการชั่วคราว)',
      'weekly_closed_day': 'วันหยุดประจำสัปดาห์ (ระบุหมายเลข 0=อาทิตย์, 1=จันทร์, 2=อังคาร, 3=พุธ, 4=พฤหัสฯ, 5=ศุกร์, 6=เสาร์)',
      'open_time': 'เวลาเปิดร้าน (เช่น 11:00)',
      'close_time': 'เวลาปิดร้าน (เช่น 19:00)'
    };
    return labels[key] || key;
  }

  _getDefaultValue(key) {
    const values = {
      'store_logo': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&h=120&fit=crop',
      'store_name': 'ร้านค้า',
      'tagline': 'WELCOME',
      'established': 'ESTD 2024',
      'location': 'Bangkok, Thailand',
      'store_phone': '064-9288187',
      'location_url': 'https://maps.google.com',
      'opening_hours': '11:00 - 19:00',
      'storefront_image': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      'store_status': 'open',
      'weekly_closed_day': '2',
      'open_time': '11:00',
      'close_time': '19:00'
    };
    return values[key] || '';
  }
}
