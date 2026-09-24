import React, { useState } from 'react';
import { Room, Booking } from '../types';
import { formatVND, calculateLateCheckoutFee, calculateBalanceDue } from '../utils/calculations';
import { 
  Printer, 
  CheckCircle, 
  Clock, 
  FileText, 
  Receipt, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface CheckOutModalProps {
  booking: Booking;
  room: Room;
  onClose: () => void;
  onCompleteCheckOut: (bookingId: string, lateHours: number, lateFee: number, finalBalance: number) => void;
}

export const CheckOutModal: React.FC<CheckOutModalProps> = ({
  booking,
  room,
  onClose,
  onCompleteCheckOut,
}) => {
  const [lateHours, setLateHours] = useState<number>(booking.lateCheckoutHours || 0);

  // Business Rule 6: Trả phòng sau 12:00: Phụ thu 100.000đ/giờ (làm tròn lên theo giờ)
  const lateFee = calculateLateCheckoutFee(lateHours);
  
  // Business Rule 7: Quyết toán = (Tiền phòng + Dịch vụ + Phụ phí trễ) - Tiền đã cọc
  const finalBalance = calculateBalanceDue(
    booking.roomTotal,
    booking.servicesTotal,
    lateFee,
    booking.depositPaid
  );

  const grossTotal = booking.roomTotal + booking.servicesTotal + lateFee;

  const handlePrint = () => {
    window.print();
  };

  const handleConfirm = () => {
    onCompleteCheckOut(booking.id, lateHours, lateFee, finalBalance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden my-8">
        
        {/* Modal Top Bar (Hidden during print) */}
        <div className="no-print px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-[#F8F6F0] dark:bg-neutral-800/60">
          <div>
            <h3 className="font-bold text-base text-[#2D5A43] dark:text-[#E2E8F0]">
              Quyết Toán & Trả Phòng (Check-out)
            </h3>
            <p className="text-xs text-neutral-500">
              Phòng: <strong className="text-neutral-800 dark:text-neutral-200">{room.id} - {room.name}</strong> · Khách: <strong>{booking.guestName}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-6 space-y-5 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
          
          {/* Bill Header */}
          <div className="flex items-start justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div>
              <div className="text-lg font-bold text-[#2D5A43] dark:text-[#E2E8F0]">
                HOMESTAY CHICSTAY ĐÀ LẠT
              </div>
              <div className="text-xs text-neutral-500">
                Địa chỉ: 18 Khởi Nghĩa Bắc Sơn, Phường 10, TP. Đà Lạt, Lâm Đồng
              </div>
              <div className="text-xs text-neutral-500">
                Hotline: 0909.123.456 · Email: contact@chicstay.vn
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs uppercase font-bold tracking-wider text-[#D4A373]">
                HÓA ĐƠN QUYẾT TOÁN
              </div>
              <div className="font-mono text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Mã đơn: {booking.id}
              </div>
              <div className="text-[11px] text-neutral-400">
                Ngày: {new Date().toLocaleDateString('vi-VN')}
              </div>
            </div>
          </div>

          {/* Guest and Stay Details */}
          <div className="grid grid-cols-2 gap-4 text-xs p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-800">
            <div>
              <div><span className="text-neutral-500">Khách hàng:</span> <strong>{booking.guestName}</strong></div>
              <div><span className="text-neutral-500">Số điện thoại:</span> {booking.guestPhone}</div>
              <div><span className="text-neutral-500">Số lượng khách:</span> {booking.guestCount} người</div>
            </div>
            <div>
              <div><span className="text-neutral-500">Phòng:</span> <strong>{booking.roomId} - {booking.roomCategoryName}</strong></div>
              <div><span className="text-neutral-500">Thời gian lưu trú:</span> {booking.checkInDate} → {booking.checkOutDate} ({booking.nights} đêm)</div>
            </div>
          </div>

          {/* Late Check-out Controls (Interactive in screen, clean in print) */}
          <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-900 dark:text-amber-300 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Quy định giờ trả phòng (Check-out trước 12:00 trưa)</span>
              </span>
              <span className="text-[11px] text-amber-700 dark:text-amber-400 font-mono">
                Phụ thu 100.000đ/giờ
              </span>
            </div>

            <div className="no-print flex items-center space-x-2 pt-1">
              <span className="text-neutral-600 dark:text-neutral-400">Số giờ trễ sau 12:00:</span>
              <div className="flex items-center space-x-1">
                {[0, 1, 2, 3, 4, 5].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setLateHours(h)}
                    className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border ${
                      lateHours === h
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {h === 0 ? 'Đúng giờ' : `+${h} giờ`}
                  </button>
                ))}
              </div>
            </div>

            {lateHours > 0 && (
              <div className="text-xs text-amber-800 dark:text-amber-300 flex justify-between pt-1">
                <span>Phụ phí trả phòng muộn ({lateHours} giờ):</span>
                <span className="font-mono font-bold">+{formatVND(lateFee)}</span>
              </div>
            )}
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-400 font-semibold text-left">
                  <th className="py-2">Khoản mục thanh toán</th>
                  <th className="py-2 text-center">Số lượng</th>
                  <th className="py-2 text-right">Đơn giá</th>
                  <th className="py-2 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                
                {/* 1. Room Charge */}
                <tr>
                  <td className="py-2.5">
                    <div className="font-semibold">Tiền phòng ({room.categoryName})</div>
                    <div className="text-[11px] text-neutral-500">{booking.checkInDate} đến {booking.checkOutDate}</div>
                  </td>
                  <td className="py-2.5 text-center font-mono">{booking.nights} đêm</td>
                  <td className="py-2.5 text-right font-mono">{formatVND(booking.roomRateSnapshot)}</td>
                  <td className="py-2.5 text-right font-mono font-semibold">{formatVND(booking.roomTotal)}</td>
                </tr>

                {/* 2. Additional Services */}
                {booking.services.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2">
                      <div className="font-medium text-neutral-800 dark:text-neutral-200">{item.serviceName}</div>
                      {item.note && <div className="text-[10px] text-neutral-400">{item.note}</div>}
                    </td>
                    <td className="py-2 text-center font-mono">{item.quantity} {item.unit}</td>
                    <td className="py-2 text-right font-mono">{formatVND(item.priceSnapshot)}</td>
                    <td className="py-2 text-right font-mono">{formatVND(item.priceSnapshot * item.quantity)}</td>
                  </tr>
                ))}

                {/* 3. Late Checkout Fee */}
                {lateFee > 0 && (
                  <tr>
                    <td className="py-2 text-amber-700 dark:text-amber-400 font-medium">
                      Phụ thu trả phòng muộn sau 12:00 ({lateHours} giờ)
                    </td>
                    <td className="py-2 text-center font-mono">{lateHours} giờ</td>
                    <td className="py-2 text-right font-mono">100.000 ₫</td>
                    <td className="py-2 text-right font-mono font-semibold text-amber-700 dark:text-amber-400">
                      {formatVND(lateFee)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Final Financial Settlement Breakdown */}
          <div className="p-4 rounded-xl bg-[#F8F6F0] dark:bg-neutral-800/80 border border-[#2D5A43]/20 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Tổng cộng các dịch vụ & phòng (Gross Total):</span>
              <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                {formatVND(grossTotal)}
              </span>
            </div>

            <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
              <span>Khấu trừ tiền cọc đã nhận trước (30% Tiền phòng):</span>
              <span className="font-mono font-bold">
                - {formatVND(booking.depositPaid)}
              </span>
            </div>

            <div className="pt-2 border-t border-neutral-300 dark:border-neutral-700 flex justify-between items-baseline font-bold text-sm">
              <span className="text-[#2D5A43] dark:text-[#D4A373] text-base">
                SỐ TIỀN CÒN PHẢI THU (BALANCE DUE):
              </span>
              <span className="font-mono text-xl text-[#2D5A43] dark:text-[#D4A373]">
                {formatVND(finalBalance)}
              </span>
            </div>
          </div>

          {/* Footer for print signature */}
          <div className="pt-4 grid grid-cols-2 text-center text-xs text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700">
            <div>
              <div className="font-semibold text-neutral-800 dark:text-neutral-200">Khách hàng ký nhận</div>
              <div className="text-[11px] text-neutral-400 italic">(Ký & ghi rõ họ tên)</div>
              <div className="h-14"></div>
            </div>
            <div>
              <div className="font-semibold text-neutral-800 dark:text-neutral-200">Lễ tân ChicStay</div>
              <div className="text-[11px] text-neutral-400 italic">(Đã thu đủ tiền quyết toán)</div>
              <div className="h-14"></div>
            </div>
          </div>

        </div>

        {/* Modal Actions (No Print) */}
        <div className="no-print px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-800/40">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Hóa Đơn</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
            >
              Đóng
            </button>

            <button
              onClick={handleConfirm}
              className="flex items-center space-x-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Xác nhận thu {formatVND(finalBalance)} & Chuyển sang chờ dọn</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
