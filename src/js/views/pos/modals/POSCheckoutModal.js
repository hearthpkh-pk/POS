import { posService } from '../../../services/POSService.js';
import { Utils } from '../../../utils.js';
import { supabase } from '../../../core/SupabaseClient.js';

export class POSCheckoutModal {
    static show(onCheckoutCallback) {
        if (posService.cart.length === 0) return;

        const modal = document.getElementById('custom-modal');
        const title = document.getElementById('modal-title');
        const message = document.getElementById('modal-message');
        const btnConfirm = document.getElementById('modal-confirm-btn');
        const btnCancel = document.getElementById('modal-cancel-btn');

        if (!modal) return;

        title.textContent = 'ชำระเงิน';
        btnCancel.classList.remove('hidden');
        btnCancel.textContent = 'ยกเลิก';
        btnConfirm.textContent = 'บันทึกชำระเงิน';

        const calcs = posService.calculateTotals();
        let currentNetCents = calcs.totalNetCents;
        let redeemedDiscountCents = 0;
        let activeMember = null;
        let pointsDelta = 0; // Final points change (Earned - Redeemed)

        // Pre-fill phone if reservation has it
        let reservationPhone = '';
        if (posService.activeReservationId) {
            // Find active reservation's phone number if cached or via DOM
            const reservationRow = document.querySelector(`[data-reservation-id="${posService.activeReservationId}"]`);
            if (reservationRow) {
                reservationPhone = reservationRow.dataset.phone || '';
            }
        }

        const renderHTML = () => {
            message.innerHTML = `
                <div class="p-5 w-full space-y-4 text-left bg-[#F2F2F7] max-h-[65vh] overflow-y-auto custom-scroll">
                    <div class="ios-card bg-white p-4 flex justify-between items-center shadow-sm">
                        <span class="text-sm font-bold text-gray-800">ยอดรวมสุทธิ</span>
                        <div class="text-right">
                            ${redeemedDiscountCents > 0 ? `<div class="text-xs text-gray-400 line-through">${Utils.formatCurrency(calcs.totalNetCents)}</div>` : ''}
                            <span class="text-xl font-black text-[#FF9500]" id="checkout-net-display">${Utils.formatCurrency(currentNetCents)}</span>
                        </div>
                    </div>

                    <!-- LOYALTY CRM PANEL -->
                    <div class="ios-card bg-white p-4 space-y-3 shadow-sm">
                        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider">ระบบสมาชิกสะสมแต้ม (Loyalty CRM)</label>
                        <div class="flex gap-2">
                            <input id="loyalty-phone-input" type="text" class="ios-input flex-grow" placeholder="กรอกเบอร์โทรศัพท์ (เช่น 0891234567)" value="${activeMember ? activeMember.phone : (reservationPhone || '')}">
                            <button id="btn-loyalty-search" type="button" class="bg-[#007AFF] hover:bg-[#007AFF]/90 text-white text-xs font-bold px-4 py-3.5 rounded-2xl transition shadow-md shrink-0">ค้นหา/สมัคร</button>
                        </div>
                        
                        <!-- Dynamic member info -->
                        <div id="loyalty-member-info" class="${activeMember ? '' : 'hidden'} text-xs bg-[#F2F2F7] p-3 rounded-2xl border border-gray-150 flex flex-col gap-1.5 text-gray-600">
                            ${activeMember ? `
                                <div class="flex justify-between items-center font-bold text-gray-800">
                                    <span>👤 สมาชิก: ${activeMember.name}</span>
                                    <span class="text-[#34C759]">📱 ${activeMember.phone}</span>
                                </div>
                                <div class="flex justify-between mt-1 text-[11px]">
                                    <span>แต้มสะสมปัจจุบัน: <strong>${activeMember.points} แต้ม</strong></span>
                                    <span>แต้มที่จะได้รับบิลนี้: <strong class="text-[#007AFF]">+${Math.floor(currentNetCents / 1000)} แต้ม</strong></span>
                                </div>
                                ${activeMember.points >= 100 && redeemedDiscountCents === 0 ? `
                                    <button id="btn-redeem-points" type="button" class="w-full mt-2 bg-[#FF9500] hover:bg-[#FF9500]/95 text-white font-bold py-2 px-3 rounded-xl transition text-[11px] shadow-sm flex items-center justify-center gap-1">
                                        <i class="fas fa-gift"></i> หัก 100 แต้ม แลกส่วนลด 50 บาท
                                    </button>
                                ` : ''}
                                ${redeemedDiscountCents > 0 ? `
                                    <div class="mt-2 flex justify-between items-center bg-[#FFEAEA] border border-[#FF3B30]/10 p-2 rounded-xl text-[#FF3B30] font-bold text-[11px]">
                                        <span>🎁 หักแต้มรับส่วนลด: -฿ ${Number(redeemedDiscountCents / 100).toFixed(2)}</span>
                                        <button id="btn-cancel-redemption" type="button" class="text-xs hover:underline text-[#007AFF]">ยกเลิกหักแต้ม</button>
                                    </div>
                                ` : ''}
                            ` : ''}
                        </div>
                        <div id="loyalty-register-form" class="hidden text-xs bg-[#FFEAEA]/40 p-3 rounded-2xl border border-orange-200/50 flex flex-col gap-2">
                            <span class="font-bold text-orange-700">ไม่พบเบอร์โทรศัพท์นี้ ต้องการสมัครสมาชิกใหม่หรือไม่?</span>
                            <div class="flex gap-2">
                                <input id="new-member-name" type="text" class="ios-input flex-grow" placeholder="กรอกชื่อ-นามสกุล">
                                <button id="btn-loyalty-register" type="button" class="bg-[#34C759] hover:bg-green-600 text-white font-bold px-4 py-2.5 rounded-xl transition shrink-0">ลงทะเบียน</button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ช่องทางการชำระเงิน</label>
                        <div class="grid grid-cols-2 gap-2.5" id="payment-methods-grid">
                            <button type="button" data-value="CASH" class="ios-card py-3 px-4 text-sm flex flex-col items-center justify-center gap-1"><i class="fas fa-money-bill-wave text-base"></i> เงินสด</button>
                            <button type="button" data-value="TRANSFER" class="ios-card py-3 px-4 text-sm flex flex-col items-center justify-center gap-1"><i class="fas fa-mobile-alt text-base"></i> โอนเงิน / PromptPay</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">หมายเหตุท้ายบิล (ไม่บังคับ)</label>
                        <input id="checkout-notes-input" type="text" class="ios-input font-medium" placeholder="เช่น ขอจานเพิ่ม, เผ็ดน้อย">
                    </div>
                </div>
            `;
            bindLoyaltyEvents();
            updatePaymentUI();
        };

        let selectedMethod = 'CASH';
        const updatePaymentUI = () => {
            message.querySelectorAll('#payment-methods-grid button').forEach(btn => {
                if (btn.dataset.value === selectedMethod) {
                    btn.className = 'ios-card py-3 px-4 text-sm flex flex-col items-center justify-center gap-1 border-2 border-[#007AFF] bg-blue-50/50 text-[#007AFF] font-bold';
                } else {
                    btn.className = 'ios-card py-3 px-4 text-sm flex flex-col items-center justify-center gap-1 border-2 border-transparent bg-white text-gray-600 hover:bg-gray-50';
                }
            });
        };

        const bindLoyaltyEvents = () => {
            const btnSearch = message.querySelector('#btn-search-loyalty') || message.querySelector('#btn-loyalty-search');
            const phoneInput = message.querySelector('#loyalty-phone-input');
            const infoBox = message.querySelector('#loyalty-member-info');
            const registerBox = message.querySelector('#loyalty-register-form');

            // Search Member
            btnSearch?.addEventListener('click', async () => {
                const phone = phoneInput.value.trim();
                if (!phone) {
                    alert('กรุณากรอกเบอร์โทรศัพท์');
                    return;
                }

                // Query Supabase for member
                const { data, error } = await supabase
                    .from('members')
                    .select('*')
                    .eq('phone', phone)
                    .eq('company_id', window.app?.companyId || '00000000-0000-0000-0000-000000000000')
                    .single();

                if (error || !data) {
                    // Not found, show registration box
                    infoBox?.classList.add('hidden');
                    registerBox?.classList.remove('hidden');
                } else {
                    // Found, update state and re-render
                    activeMember = data;
                    registerBox?.classList.add('hidden');
                    renderHTML();
                }
            });

            // Register Member
            const btnRegister = message.querySelector('#btn-loyalty-register');
            btnRegister?.addEventListener('click', async () => {
                const phone = phoneInput.value.trim();
                const name = message.querySelector('#new-member-name').value.trim();
                if (!name) {
                    alert('กรุณากรอกชื่อสมาชิกร่วมด้วย');
                    return;
                }

                const { data, error } = await supabase
                    .from('members')
                    .insert({
                        company_id: window.app?.companyId || '00000000-0000-0000-0000-000000000000',
                        phone: phone,
                        name: name,
                        points: 0
                    })
                    .select()
                    .single();

                if (error) {
                    alert('ไม่สามารถลงทะเบียนได้: ' + error.message);
                } else {
                    activeMember = data;
                    registerBox?.classList.add('hidden');
                    renderHTML();
                }
            });

            // Redeem points
            const btnRedeem = message.querySelector('#btn-redeem-points');
            btnRedeem?.addEventListener('click', () => {
                if (!activeMember || activeMember.points < 100) return;
                redeemedDiscountCents = 5000; // 50.00 Baht discount
                currentNetCents = Math.max(0, calcs.totalNetCents - redeemedDiscountCents);
                renderHTML();
            });

            // Cancel redemption
            const btnCancelRedeem = message.querySelector('#btn-cancel-redemption');
            btnCancelRedeem?.addEventListener('click', () => {
                redeemedDiscountCents = 0;
                currentNetCents = calcs.totalNetCents;
                renderHTML();
            });
        };

        // Payment selections delegation
        message.addEventListener('click', (e) => {
            const btn = e.target.closest('#payment-methods-grid button');
            if (btn) {
                selectedMethod = btn.dataset.value;
                updatePaymentUI();
            }
        });

        // Confirm Checkout Click
        btnConfirm.onclick = async () => {
            const notesInput = message.querySelector('#checkout-notes-input');
            const notes = notesInput ? notesInput.value.trim() : '';

            // Calculate points delta
            let pointsDelta = 0;
            let memberPhone = null;

            if (activeMember) {
                memberPhone = activeMember.phone;
                const pointsEarned = Math.floor(currentNetCents / 1000); // 10 Baht = 1 point
                const pointsRedeemed = redeemedDiscountCents > 0 ? 100 : 0;
                pointsDelta = pointsEarned - pointsRedeemed;
            }

            modal.classList.add('hidden');
            if (onCheckoutCallback) {
                await onCheckoutCallback(selectedMethod, notes, memberPhone, pointsDelta, redeemedDiscountCents);
            }
        };

        renderHTML();
        modal.classList.remove('hidden');

        // Automatically trigger search if preorder has pre-filled phone number
        if (reservationPhone) {
            setTimeout(() => {
                message.querySelector('#btn-loyalty-search')?.click();
            }, 300);
        }
    }
}
