import React, { useState } from 'react';
import { Room, Booking, Service, RoomStatus } from '../types';
import { formatVND } from '../utils/calculations';
import { 
  Building2, 
  UserCheck, 
  LogIn, 
  LogOut, 
  PlusCircle, 
  Sparkles, 
  Bed, 
  Users, 
  Clock, 
  Receipt, 
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

interface RoomRackProps {
  rooms: Room[];
  bookings: Booking[];
  services: Service[];
  onCheckIn: (bookingId: string) => void;
  onOpenCheckOut: (booking: Booking, room: Room) => void;
  onOpenAddService: (booking: Booking, room: Room) => void;
  onMarkCleaned: (roomId: string) => void;
  onOpenWalkIn: (room: Room) => void;
}

export const RoomRack: React.FC<RoomRackProps> = ({
  rooms,
  bookings,
  services,
  onCheckIn,
  onOpenCheckOut,
  onOpenAddService,
  onMarkCleaned,
  onOpenWalkIn,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Status stats calculation
  const totalRooms = rooms.length;
  const availableCount = rooms.filter((r) => r.status === 'available').length;
  const bookedCount = rooms.filter((r) => r.status === 'booked').length;
  const inHouseCount = rooms.filter((r) => r.status === 'in_house').length;
  const cleaningCount = rooms.filter((r) => r.status === 'cleaning').length;
  const occupancyRate = Math.round(((inHouseCount + bookedCount) / totalRooms) * 100);

  // Helper to get active booking for room
  const getActiveBooking = (room: Room): Booking | undefined => {
    if (room.currentBookingId) {
      const found = bookings.find((b) => b.id === room.currentBookingId);
      if (found) return found;
    }
    // Fallback: search for in_house or confirmed booking on this room
    return bookings.find(
      (b) => b.roomId === room.id && (b.status === 'in_house' || b.status === 'confirmed')
    );
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesFilter = filterStatus === 'all' || room.status === filterStatus;
    const activeBooking = getActiveBooking(room);
    const matchesSearch =
      room.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activeBooking && activeBooking.guestName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Overview Stat Counters (Ergonomic WCAG compliant) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs">
          <div className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Tổng số phòng</div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">{totalRooms}</span>
            <span className="text-xs text-neutral-400">phòng</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20">
          <div className="text-[11px] text-emerald-800 dark:text-emerald-400 uppercase tracking-wider font-semibold flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Trống sẵn sàng</span>
          </div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-300">{availableCount}</span>
            <span className="text-xs text-emerald-600/70">phòng</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20">
          <div className="text-[11px] text-amber-800 dark:text-amber-400 uppercase tracking-wider font-semibold flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Đã đặt (Cọc 30%)</span>
          </div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-300">{bookedCount}</span>
            <span className="text-xs text-amber-600/70">phòng</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-teal-500/20 bg-teal-500/5 dark:bg-teal-950/20">
          <div className="text-[11px] text-teal-800 dark:text-teal-400 uppercase tracking-wider font-semibold flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span>Đang ở (In-House)</span>
          </div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-teal-700 dark:text-teal-300">{inHouseCount}</span>
            <span className="text-xs text-teal-600/70">phòng</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/20">
          <div className="text-[11px] text-purple-800 dark:text-purple-400 uppercase tracking-wider font-semibold flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>Chờ dọn / Tạm khóa</span>
          </div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-purple-700 dark:text-purple-300">{cleaningCount}</span>
            <span className="text-xs text-purple-600/70">phòng</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-[#2D5A43]/20 bg-[#2D5A43]/5 dark:bg-[#2D5A43]/20">
          <div className="text-[11px] text-[#2D5A43] dark:text-[#D4A373] uppercase tracking-wider font-semibold">Tỷ lệ lấp đầy</div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#2D5A43] dark:text-[#D4A373]">{occupancyRate}%</span>
            <span className="text-xs text-neutral-500">công suất</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
        
        {/* Status Tab buttons */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-[#2D5A43] text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Tất cả ({totalRooms})
          </button>
          <button
            onClick={() => setFilterStatus('available')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              filterStatus === 'available'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Trống ({availableCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('booked')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              filterStatus === 'booked'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Đã đặt ({bookedCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('in_house')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              filterStatus === 'in_house'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            <span>Đang ở ({inHouseCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('cleaning')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
              filterStatus === 'cleaning'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            <span>Chờ dọn ({cleaningCount})</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Tìm theo mã phòng, khách..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-1 focus:ring-[#2D5A43]"
          />
        </div>
      </div>

      {/* Room Rack Grid (12 Rooms) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRooms.map((room) => {
          const booking = getActiveBooking(room);

          // Card accent styling according to WCAG AAA colors
          let statusBorder = 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/15';
          let statusBadgeText = 'Trống sẵn sàng';
          let statusBadgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300';
          let dotColor = 'bg-emerald-500';

          if (room.status === 'booked') {
            statusBorder = 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/15';
            statusBadgeText = 'Đã đặt (Cọc 30%)';
            statusBadgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300';
            dotColor = 'bg-amber-500';
          } else if (room.status === 'in_house') {
            statusBorder = 'border-teal-500/40 bg-teal-500/5 dark:bg-teal-950/15';
            statusBadgeText = 'Đang ở (In-House)';
            statusBadgeColor = 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300';
            dotColor = 'bg-teal-500';
          } else if (room.status === 'cleaning') {
            statusBorder = 'border-purple-500/40 bg-purple-500/5 dark:bg-purple-950/15';
            statusBadgeText = 'Tạm khóa / Chờ dọn';
            statusBadgeColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300';
            dotColor = 'bg-purple-500';
          }

          return (
            <div
              key={room.id}
              className={`rounded-2xl border ${statusBorder} p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between`}
            >
              {/* Room Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {room.id}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                        · {room.floor}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#2D5A43] dark:text-[#D4A373]">
                      {room.name}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadgeColor}`}>
                    <span className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`}></span>
                    <span>{statusBadgeText}</span>
                  </span>
                </div>

                {/* Room Specs & Pricing */}
                <div className="mt-3 pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">{room.categoryName}</span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                      {formatVND(room.pricePerNight)}<span className="font-normal text-[11px] text-neutral-400">/đêm</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3 h-3 text-neutral-400" />
                      <span>Tối đa {room.capacity} khách</span>
                    </span>
                    <span>{room.bedDescription.split('(')[0]}</span>
                  </div>
                </div>

                {/* Active Booking Info if Occupied or Booked */}
                {booking && (room.status === 'in_house' || room.status === 'booked') && (
                  <div className="mt-3 p-2.5 rounded-lg bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {booking.guestName}
                      </span>
                      <span className="font-mono text-[11px] text-neutral-500">
                        {booking.guestPhone}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>{booking.checkInDate} → {booking.checkOutDate}</span>
                      <span className="font-mono">({booking.nights} đêm)</span>
                    </div>

                    {booking.services && booking.services.length > 0 && (
                      <div className="pt-1 text-[11px] text-teal-700 dark:text-teal-400 flex items-center justify-between">
                        <span>{booking.services.length} dịch vụ kèm theo</span>
                        <span className="font-mono tabular-nums">+{formatVND(booking.servicesTotal)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notice for Cleaning / Maintenance */}
                {room.status === 'cleaning' && (
                  <div className="mt-3 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 text-xs text-purple-800 dark:text-purple-300 flex items-start space-x-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-semibold">Đang chờ bộ phận buồng phòng</div>
                      <div className="text-[11px] text-purple-700 dark:text-purple-400">
                        Thay drap giường, khử khuẩn phòng và kiểm tra mini bar.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Container */}
              <div className="mt-4 pt-3 border-t border-neutral-200/60 dark:border-neutral-800/60">
                
                {/* 1. ROOM AVAILABLE: Walk-in */}
                {room.status === 'available' && (
                  <button
                    onClick={() => onOpenWalkIn(room)}
                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-[#2D5A43] hover:bg-[#234634] text-white shadow-xs transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Đặt phòng tại quầy (Walk-in)</span>
                  </button>
                )}

                {/* 2. ROOM BOOKED: Check-in */}
                {room.status === 'booked' && booking && (
                  <button
                    onClick={() => onCheckIn(booking.id)}
                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Nhận phòng (Check-in)</span>
                  </button>
                )}

                {/* 3. ROOM IN_HOUSE: Add Service & Check-out */}
                {room.status === 'in_house' && booking && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onOpenAddService(booking, room)}
                      className="flex items-center justify-center space-x-1 px-2.5 py-2 text-xs font-medium rounded-lg border border-teal-600/40 text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Thêm DV</span>
                    </button>
                    <button
                      onClick={() => onOpenCheckOut(booking, room)}
                      className="flex items-center justify-center space-x-1 px-2.5 py-2 text-xs font-semibold rounded-lg bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Quyết toán</span>
                    </button>
                  </div>
                )}

                {/* 4. ROOM CLEANING: Mark Cleaned */}
                {room.status === 'cleaning' && (
                  <button
                    onClick={() => onMarkCleaned(room.id)}
                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Xác nhận đã dọn xong</span>
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
