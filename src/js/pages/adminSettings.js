// src/js/pages/adminSettings.js
// Admin UI: จัดการรูปภาพและข้อความหน้าลูกค้า (Mein Licht)
import { supabase } from '../core/SupabaseClient.js';

const STORAGE_BUCKET = 'restaurant-images';

export class AdminSettings {
  constructor(container) {
    this.container = container;
    this.settings = {};
    this._render();
  }

  async _render() {
    this.container.innerHTML = `
      <div class="p-4 lg:p-6 h-full overflow-y-auto custom-scroll bg-gray-100">
        <div style="max-width:900px;margin:0 auto">
          <div style="display:flex;align-items:center;gap:1rem;margin-bottom:2rem">
            <div style="width:44px;height:44px;background:#FFF7ED;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem">🎨</div>
            <div>
              <h2 style="font-size:1.3rem;font-weight:700;color:#111827;margin:0">ตั้งค่าหน้าลูกค้า</h2>
              <p style="font-size:0.8rem;color:#6B7280;margin:0">จัดการรูปและข้อความที่แสดงในหน้าเว็บลูกค้า</p>
            </div>
          </div>
          <div id="settings-loading" style="text-align:center;padding:3rem;color:#9CA3AF">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem"></i>
            <p style="margin-top:0.75rem">กำลังโหลด...</p>
          </div>
          <div id="settings-content" style="display:none"></div>
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

    document.getElementById('settings-loading').style.display = 'none';
    const content = document.getElementById('settings-content');
    content.style.display = 'block';

    if (error) {
      content.innerHTML = `<div style="color:#EF4444;padding:1.5rem;background:#FEF2F2;border-radius:12px">
        โหลดข้อมูลไม่ได้: ${error.message}
      </div>`;
      return;
    }

    data.forEach(row => { this.settings[row.key] = row; });

    // Group settings by section
    const sections = {
      '🏪 ข้อมูลร้าน': ['store_name', 'tagline', 'established', 'location', 'store_phone', 'location_url', 'opening_hours'],
      '🖼 รูปหน้าปก (Hero)': ['hero_image', 'hero_logo'],
      '📝 เนื้อหา About': ['about_1_title', 'about_1_desc', 'about_2_title', 'about_2_desc', 'about_3_title', 'about_3_desc'],
      '✨ เมนูแนะนำ & โปรโมชัน (8 ช่อง)': ['gallery_1', 'gallery_2', 'gallery_3', 'gallery_4', 'gallery_5', 'gallery_6', 'gallery_7', 'gallery_8'],
    };

    content.innerHTML = Object.entries(sections).map(([sectionTitle, keys]) => `
      <div class="settings-section" style="background:white;border-radius:16px;box-shadow:0 1px 4px rgba(0,0,0,0.08);margin-bottom:1.5rem;overflow:hidden">
        <div style="padding:1rem 1.5rem;background:#F9FAFB;border-bottom:1px solid #F3F4F6;font-weight:700;font-size:0.9rem;color:#374151">
          ${sectionTitle}
        </div>
        <div style="padding:1.25rem;display:grid;grid-template-columns:${keys.some(k => k.startsWith('gallery')) ? 'repeat(auto-fill,minmax(180px,1fr))' : '1fr'};gap:1rem">
          ${keys.map(key => {
            let row = this.settings[key];
            if (!row) {
              row = {
                key: key,
                label: this._getDefaultLabel(key),
                setting_type: 'text',
                value: this._getDefaultValue(key)
              };
            }
            return this._renderSettingItem(row);
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
      return `
        <div class="settings-item" data-key="${row.key}" style="background:#F9FAFB;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB">
          <div style="position:relative;aspect-ratio:4/3;background:#E5E7EB;overflow:hidden">
            <img
              src="${val}"
              alt="${row.label}"
              style="width:100%;height:100%;object-fit:cover"
              onerror="this.style.display='none'"
              id="img-preview-${row.key}"
            />
            ${!val ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#9CA3AF;font-size:2rem">🖼</div>` : ''}
          </div>
          <div style="padding:0.75rem">
            <div style="font-size:0.75rem;font-weight:600;color:#6B7280;margin-bottom:0.5rem">${row.label}</div>
            <button
              class="change-image-btn"
              data-key="${row.key}"
              style="width:100%;background:#EA580C;color:white;border:none;border-radius:8px;padding:0.5rem;font-size:0.78rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:0.4rem"
            >
              <i class="fas fa-camera"></i> เปลี่ยนรูป
            </button>
            <input
              type="file"
              accept="image/*"
              id="file-input-${row.key}"
              style="display:none"
              data-key="${row.key}"
            />
          </div>
        </div>
      `;
    }

    // Text input
    return `
      <div class="settings-item" data-key="${row.key}" style="background:#F9FAFB;border-radius:12px;padding:0.875rem;border:1px solid #E5E7EB">
        <label style="font-size:0.75rem;font-weight:600;color:#6B7280;display:block;margin-bottom:0.375rem">${row.label}</label>
        <div style="display:flex;gap:0.5rem;align-items:flex-start">
          <textarea
            class="text-setting-input"
            data-key="${row.key}"
            rows="${val.length > 60 ? 3 : 1}"
            style="flex:1;border:1px solid #D1D5DB;border-radius:8px;padding:0.5rem 0.75rem;font-size:0.85rem;resize:vertical;font-family:inherit;outline:none"
          >${val}</textarea>
          <button
            class="save-text-btn"
            data-key="${row.key}"
            style="background:#10B981;color:white;border:none;border-radius:8px;padding:0.5rem 0.75rem;font-size:0.8rem;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0"
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
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังอัปโหลด...';
    btn.disabled = true;

    try {
      // Unique filename to avoid caching issues
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
      if (preview) { preview.src = publicUrl; preview.style.display = 'block'; }

      btn.innerHTML = '<i class="fas fa-check"></i> สำเร็จ!';
      btn.style.background = '#10B981';
      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '#EA580C';
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
    } else if (!data || data.length === 0) {
      alert('บันทึกไม่สำเร็จ: คุณไม่มีสิทธิ์แก้ไข (อาจยังไม่ได้ล็อกอินเป็นพนักงาน)');
    } else {
      // Store back in internal settings
      this.settings[key] = data[0];
      btn.textContent = '✓ บันทึกแล้ว';
      btn.style.background = '#059669';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '#10B981';
        btn.disabled = false;
      }, 2000);
    }
  }

  _getDefaultLabel(key) {
    const labels = {
      'store_phone': 'เบอร์โทรศัพท์ติดต่อร้าน',
      'location_url': 'ลิงก์ Google Maps ของร้าน',
      'opening_hours': 'เวลาเปิด-ปิดร้าน (เช่น ทุกวัน 11:00 - 22:00)'
    };
    return labels[key] || key;
  }

  _getDefaultValue(key) {
    const values = {
      'store_phone': '081-234-5678',
      'location_url': 'https://maps.google.com',
      'opening_hours': 'ทุกวัน 11:00 - 22:00'
    };
    return values[key] || '';
  }
}
