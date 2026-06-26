import { posService } from '../../../services/POSService.js';
import { Utils } from '../../../utils.js';

export class POSBillPanel {
    static getHTML(pendingOrders, currentTableId) {
        let html = `
      <div id="btn-new-order" class="ios-card bg-white p-4 rounded-xl mb-3 cursor-pointer hover:bg-gray-50 transition flex items-center justify-center text-[#007AFF] border-2 border-dashed border-[#007AFF]/30 ${currentTableId === 'ออเดอร์ใหม่' && !posService.activeOrderId ? 'border-[#007AFF] bg-blue-50/20 ring-1 ring-[#007AFF]/20' : ''}">
        <div class="font-bold flex items-center pointer-events-none text-sm">
          <i class="fas fa-plus mr-2"></i> เปิดออเดอร์ใหม่
        </div>
      </div>
    `;

        if (pendingOrders.length === 0) {
            html += '<div class="text-center text-gray-400 py-10 text-xs italic">ไม่มีบิลที่พักไว้ในระบบ</div>';
        } else {
            html += pendingOrders.map(order => {
                const isActive = posService.activeOrderId === order.id;
                const totalBaht = Utils.centsToBaht(order.total_net_cents);
                const itemsCount = order.order_items ? order.order_items.length : 0;
                const timeStr = Utils.formatDateTime(order.created_at, { timeStyle: 'short' });
                return `
            <div data-action="select-order" data-id="${order.id}" class="ios-card bg-white p-4 mb-3 cursor-pointer transition relative overflow-hidden ${isActive ? 'border-[#007AFF] ring-1 ring-[#007AFF]/20 bg-blue-50/20' : 'hover:bg-gray-50'}">
              ${isActive ? '<div class="absolute top-0 right-0 bg-[#007AFF] text-white text-[9px] px-2 py-0.5 rounded-bl-lg font-bold pointer-events-none">กำลังใช้งาน</div>' : ''}
              <div class="flex justify-between items-center mb-2 pointer-events-none">
                <div class="font-bold text-base text-gray-900">${order.table_id || 'ไม่ได้ระบุโต๊ะ/ลูกค้า'}</div>
                <div class="font-bold text-lg text-[#FF9500]">฿${totalBaht.toLocaleString()}</div>
              </div>
              <div class="flex justify-between text-xs text-gray-500 pointer-events-none">
                <span>${itemsCount} รายการ</span>
                <span>เวลา: ${timeStr}</span>
              </div>
            </div>
          `;
            }).join('');
        }
        return html;
    }

    static bindEvents(container, { onSelectOrder, onNewOrder }) {
        // Pending Bill Select
        const orderCards = container.querySelectorAll('[data-action="select-order"]');
        orderCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const orderId = e.currentTarget.dataset.id;
                if (onSelectOrder) onSelectOrder(orderId);
            });
        });

        // New Order Button
        const btnNewOrder = container.querySelector('#btn-new-order');
        if (btnNewOrder && onNewOrder) {
            btnNewOrder.addEventListener('click', onNewOrder);
        }
    }
}
