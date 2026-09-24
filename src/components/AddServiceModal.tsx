import React, { useState } from 'react';
import { Room, Booking, Service, BookingServiceItem } from '../types';
import { formatVND } from '../utils/calculations';
import { PlusCircle, ShoppingBag, Check } from 'lucide-react';

interface AddServiceModalProps {
  booking: Booking;
  room: Room;
  services: Service[];
  onClose: () => void;
  onAddService: (bookingId: string, item: BookingServiceItem) => void;
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  booking,
  room,
  services,
  onClose,
  onAddService,
}) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || 'D001');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');

  const activeService = services.find((s) => s.id === selectedServiceId) || services[0];
  const subtotal = activeService ? activeService.price * quantity : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeService || quantity <= 0) return;

    // Snapshot price at time of adding (Business Rule #5)
    const item: BookingServiceItem = {
      serviceId: activeService.id,
      serviceName: activeService.name,
      priceSnapshot: activeService.price,
      unit: activeService.unit,
      quantity,
      addedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      note: note.trim() || undefined,
    };

    onAddService(booking.id, item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-[#F8F6F0] dark:bg-neutral-800/60">
          <div>
            <h3 className="font-bold text-base text-[#2D5A43] dark:text-[#E2E8F0]">
              Thêm Dịch Vụ Phát Sinh (In-House)
            </h3>
            <p className="text-xs text-neutral-500">
              Phòng: <strong>{room.id} ({room.name})</strong> · Khách: {booking.guestName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Chọn danh mục dịch vụ (D001 - D009)
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.id}] {s.name} - {formatVND(s.price)}/{s.unit}
                </option>
              ))}
            </select>
            {activeService && (
              <p className="mt-1 text-[11px] text-neutral-400">
                {activeService.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Số lượng ({activeService?.unit})
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center py-1.5 text-xs font-mono font-bold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-[#2D5A43] text-white font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Thành tiền tạm tính
              </label>
              <div className="py-2 px-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-mono font-bold text-[#2D5A43] dark:text-[#D4A373]">
                {formatVND(subtotal)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Ghi chú thêm (Biển số xe, món ăn, giờ phục vụ...)
            </label>
            <input
              type="text"
              placeholder="VD: Thuê xe 2 ngày, set BBQ 19:00 tối nay..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
            />
          </div>

          {/* Current services list preview */}
          {booking.services && booking.services.length > 0 && (
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
              <div className="font-semibold text-neutral-500 mb-1">
                Dịch vụ phòng đang sử dụng ({booking.services.length} món):
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {booking.services.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
                    <span>{item.serviceName} ({item.quantity} {item.unit})</span>
                    <span className="font-mono">{formatVND(item.priceSnapshot * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-teal-700 hover:bg-teal-800 text-white shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Ghi nhận dịch vụ ({formatVND(subtotal)})</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
