import React, { useState } from 'react';
import { Room, Booking, Customer } from '../types';
import { formatVND, calculateNights, calculateDeposit } from '../utils/calculations';
import { LogIn, UserCheck, Calendar } from 'lucide-react';

interface WalkInModalProps {
  room: Room;
  onClose: () => void;
  onConfirmWalkIn: (booking: Booking, customer: Customer) => void;
}

export const WalkInModal: React.FC<WalkInModalProps> = ({
  room,
  onClose,
  onConfirmWalkIn,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>(todayStr);
  const [checkOutDate, setCheckOutDate] = useState<string>(tomorrowStr);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('Khách nhận phòng tại quầy (Walk-in)');

  const nights = calculateNights(checkInDate, checkOutDate);
  const roomTotal = room.pricePerNight * nights;
  const standardDeposit = calculateDeposit(roomTotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) {
      alert('Vui lòng nhập tên và số điện thoại khách hàng!');
      return;
    }

    const bookingId = `CS-WI-${Date.now().toString().slice(-5)}`;
    const depositToRecord = depositAmount > 0 ? depositAmount : standardDeposit;

    const newBooking: Booking = {
      id: bookingId,
      roomId: room.id,
      roomName: room.name,
      roomCategoryName: room.categoryName,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestEmail: `${guestPhone.trim()}@walkin.chicstay.vn`,
      checkInDate,
      checkOutDate,
      nights,
      guestCount,
      roomRateSnapshot: room.pricePerNight,
      roomTotal,
      depositRequired: standardDeposit,
      depositPaid: depositToRecord,
      services: [],
      servicesTotal: 0,
      lateCheckoutHours: 0,
      lateCheckoutFee: 0,
      totalAmount: roomTotal,
      balanceDue: Math.max(0, roomTotal - depositToRecord),
      status: 'in_house', // Direct check-in to in-house
      notes: notes.trim(),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      checkedInAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    const newCustomer: Customer = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      name: guestName.trim(),
      phone: guestPhone.trim(),
      email: `${guestPhone.trim()}@walkin.chicstay.vn`,
      totalSpend: depositToRecord,
      staysCount: 1,
      lastStayDate: checkInDate,
      tier: 'Mới',
      notes: notes.trim(),
    };

    onConfirmWalkIn(newBooking, newCustomer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-[#F8F6F0] dark:bg-neutral-800/60">
          <div>
            <h3 className="font-bold text-base text-[#2D5A43] dark:text-[#E2E8F0]">
              Nhận Phòng Trực Tiếp Tại Quầy (Walk-in)
            </h3>
            <p className="text-xs text-neutral-500">
              Phòng: <strong>{room.id} ({room.categoryName})</strong> · {formatVND(room.pricePerNight)}/đêm
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
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Tên khách hàng *
              </label>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn B"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Số điện thoại *
              </label>
              <input
                type="tel"
                required
                placeholder="09..."
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Ngày nhận phòng
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Ngày trả phòng
              </label>
              <input
                type="date"
                value={checkOutDate}
                min={checkInDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Số khách lưu trú
              </label>
              <input
                type="number"
                min={1}
                max={room.capacity + 1}
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Tiền cọc đã thu tại quầy
              </label>
              <input
                type="number"
                step={50000}
                placeholder={`Đề xuất: ${standardDeposit}`}
                value={depositAmount || ''}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">Tiền phòng ({nights} đêm):</span>
              <span className="font-mono font-semibold">{formatVND(roomTotal)}</span>
            </div>
            <div className="flex justify-between text-amber-700 dark:text-amber-400">
              <span>Đề xuất cọc 30%:</span>
              <span className="font-mono font-bold">{formatVND(standardDeposit)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
            >
              Hủy
            </button>

            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-[#2D5A43] hover:bg-[#234634] text-white shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Giao chìa khóa & Check-in ngay</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
