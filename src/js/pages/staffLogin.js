// src/js/pages/staffLogin.js
import { supabase } from '../core/SupabaseClient.js';

export class StaffLogin {
  constructor() {
    this.clickCount = 0;
    this._setupTrigger();
  }

  _setupTrigger() {
    const logo = document.getElementById('logo');
    if (!logo) return;
    logo.addEventListener('click', () => {
      this.clickCount++;
      if (this.clickCount >= 6) {
        this._showLoginModal();
        this.clickCount = 0;
      }
    });
  }

  _showLoginModal() {
    const modal = document.createElement('div');
    modal.id = 'staff-login-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 modal-enter';
    modal.innerHTML = `
      <div class="bg-white bg-opacity-80 rounded-xl p-6 w-11/12 max-w-md shadow-lg transform scale-95 transition-transform duration-300">
        <h2 class="text-xl font-bold mb-4" style="color: var(--brand-primary)">พนักงานเข้าสู่ระบบ</h2>
        <input id="staff-email" type="email" placeholder="อีเมล" class="border rounded w-full mb-2 p-2" />
        <input id="staff-password" type="password" placeholder="รหัสผ่าน" class="border rounded w-full mb-4 p-2" />
        <button id="staff-login-btn" class="w-full bg-brand-primary text-white py-2 rounded">Login</button>
      </div>
    `;
    document.body.appendChild(modal);
    requestAnimationFrame(() => {
      modal.classList.remove('opacity-0');
      modal.classList.add('opacity-100');
      modal.querySelector('div').classList.remove('scale-95');
      modal.querySelector('div').classList.add('scale-100');
    });
    document.getElementById('staff-login-btn').addEventListener('click', async () => {
      const email = document.getElementById('staff-email').value.trim();
      const password = document.getElementById('staff-password').value;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return alert('Login failed: ' + error.message);
      modal.remove();
      window.location.href = '/admin.html';
    });
  }
}
