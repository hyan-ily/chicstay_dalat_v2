import React, { useState } from 'react';
import { Customer, Booking } from '../types';
import { formatVND } from '../utils/calculations';
import { 
  Users, 
  Search, 
  Award, 
  Phone, 
  Mail, 
  Calendar, 
  CreditCard, 
  History, 
  Eye, 
  Plus, 
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

interface CrmViewProps {
  customers: Customer[];
  bookings: Booking[];
}

export const CrmView: React.FC<CrmViewProps> = ({ customers, bookings }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = customers.filter((c) => {
    const matchesTier = tierFilter === 'all' || c.tier === tierFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const getCustomerBookings = (customerPhone: string) => {
    return bookings.filter(
      (b) => b.guestPhone.replace(/\s+/g, '') === customerPhone.replace(/\s+/g, '')
    );
  };

  const totalRevenueAll = customers.reduce((sum, c) => sum + c.totalSpend, 0);
  const vipCount = customers.filter((c) => c.tier === 'VIP').length;

  return (
    <div className="space-y-6">
      
      {/* CRM Metric Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Tổng hồ sơ khách hàng (CRM)
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">{customers.length}</span>
            <span className="text-xs text-neutral-400">khách đã lưu</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#D4A373]/30 bg-[#D4A373]/10 dark:bg-[#D4A373]/15">
          <div className="text-[11px] font-semibold text-amber-800 dark:text-[#D4A373] uppercase tracking-wider">
            Khách VIP & Thân thiết
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-amber-900 dark:text-[#D4A373]">
              {vipCount + customers.filter((c) => c.tier === 'Thân thiết').length}
            </span>
            <span className="text-xs text-amber-700/80 dark:text-amber-300">khách trung thành</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[#2D5A43]/20 bg-[#2D5A43]/5 dark:bg-[#2D5A43]/20">
          <div className="text-[11px] font-semibold text-[#2D5A43] dark:text-[#D4A373] uppercase tracking-wider">
            Tổng doanh thu tích lũy từ khách
          </div>
          <div className="mt-1 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-[#2D5A43] dark:text-[#D4A373]">
              {formatVND(totalRevenueAll)}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setTierFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              tierFilter === 'all'
                ? 'bg-[#2D5A43] text-white'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Tất cả ({customers.length})
          </button>
          <button
            onClick={() => setTierFilter('VIP')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              tierFilter === 'VIP'
                ? 'bg-amber-600 text-white'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            Khách VIP ({vipCount})
          </button>
          <button
            onClick={() => setTierFilter('Thân thiết')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              tierFilter === 'Thân thiết'
                ? 'bg-teal-600 text-white'
                : 'text-teal-700 dark:text-teal-400 hover:bg-teal-50'
            }`}
          >
            Thân thiết
          </button>
          <button
            onClick={() => setTierFilter('Mới')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              tierFilter === 'Mới'
                ? 'bg-neutral-600 text-white'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100'
            }`}
          >
            Khách Mới
          </button>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT khách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8F6F0] dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Liên hệ (SĐT / Email)</th>
                <th className="py-3 px-4 text-center">Phân hạng</th>
                <th className="py-3 px-4 text-center">Lượt ở</th>
                <th className="py-3 px-4 text-right">Tổng chi tiêu</th>
                <th className="py-3 px-4">Lưu trú gần nhất</th>
                <th className="py-3 px-4">Ghi chú sở thích</th>
                <th className="py-3 px-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredCustomers.map((cust) => {
                const custBookings = getCustomerBookings(cust.phone);
                return (
                  <tr key={cust.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">
                      {cust.name}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-neutral-800 dark:text-neutral-200">{cust.phone}</div>
                      <div className="text-[11px] text-neutral-400">{cust.email}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          cust.tier === 'VIP'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/50'
                            : cust.tier === 'Thân thiết'
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                      >
                        {cust.tier}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-medium">
                      {cust.staysCount} lần
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-[#2D5A43] dark:text-[#D4A373]">
                      {formatVND(cust.totalSpend)}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                      {cust.lastStayDate}
                    </td>

                    <td className="py-3 px-4 text-neutral-500 max-w-xs truncate text-[11px]">
                      {cust.notes || '—'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs inline-flex items-center space-x-1"
                        title="Xem lịch sử đặt phòng"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#2D5A43] dark:text-[#D4A373]" />
                        <span>Lịch sử ({custBookings.length})</span>
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Inspection Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-[#F8F6F0] dark:bg-neutral-800/60">
              <div>
                <h3 className="font-bold text-base text-[#2D5A43] dark:text-[#E2E8F0]">
                  Lịch Sử Lưu Trú: {selectedCustomer.name}
                </h3>
                <p className="text-xs text-neutral-500">
                  SĐT: {selectedCustomer.phone} · Phân hạng: <strong>{selectedCustomer.tier}</strong> · Tổng chi: {formatVND(selectedCustomer.totalSpend)}
                </p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-neutral-400 hover:text-neutral-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {getCustomerBookings(selectedCustomer.phone).length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs">
                  Không tìm thấy đơn đặt phòng chi tiết trong phiên lưu trữ hiện tại.
                </div>
              ) : (
                getCustomerBookings(selectedCustomer.phone).map((bk) => (
                  <div
                    key={bk.id}
                    className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {bk.id} · Phòng {bk.roomId} ({bk.roomName})
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                        {bk.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                      <div>
                        <span>Khoảng ngày:</span> <strong>{bk.checkInDate} → {bk.checkOutDate}</strong>
                      </div>
                      <div>
                        <span>Số đêm:</span> <strong>{bk.nights} đêm</strong>
                      </div>
                      <div>
                        <span>Tiền phòng:</span> <strong>{formatVND(bk.roomTotal)}</strong>
                      </div>
                      <div>
                        <span>Tổng thanh toán:</span> <strong>{formatVND(bk.totalAmount)}</strong>
                      </div>
                    </div>

                    {bk.services && bk.services.length > 0 && (
                      <div className="text-[11px] text-teal-700 dark:text-teal-400">
                        Dịch vụ đã gọi: {bk.services.map((s) => `${s.serviceName} (${s.quantity} ${s.unit})`).join(', ')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-800 text-right bg-neutral-50 dark:bg-neutral-800/30">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#2D5A43] text-white"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
