import React, { useState } from 'react';
import { Room, Booking, Service, Customer } from '../types';
import { 
  formatVND, 
  calculateNights, 
  calculateDeposit, 
  checkOverbooking, 
  evaluateCancellationPolicy 
} from '../utils/calculations';
import { HOMESTAY_BANK_INFO, getVietQRImageUrl } from '../utils/vietqr';
import { 
  Search, 
  Calendar, 
  Users, 
  CheckCircle, 
  CreditCard, 
  QrCode, 
  Copy, 
  Check, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  ReceiptText,
  FileText,
  RotateCcw
} from 'lucide-react';

interface CustomerPortalProps {
  rooms: Room[];
  services: Service[];
  bookings: Booking[];
  onAddBooking: (booking: Booking, customer: Customer) => void;
  onCancelBooking: (bookingId: string) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  rooms,
  services,
  bookings,
  onAddBooking,
  onCancelBooking,
}) => {
  // Navigation inside Customer Portal: 'book' | 'my_bookings'
  const [subTab, setSubTab] = useState<'book' | 'my_bookings'>('book');

  // Search & Filter State
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [checkInDate, setCheckInDate] = useState<string>(todayStr);
  const [checkOutDate, setCheckOutDate] = useState<string>(tomorrowStr);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Booking Flow State
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [step, setStep] = useState<'form' | 'vietqr' | 'success'>('form');

  // Form Inputs
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestNotes, setGuestNotes] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<{ [serviceId: string]: number }>({});

  // Active / Placed Booking
  const [activeBookingResult, setActiveBookingResult] = useState<Booking | null>(null);
  const [copiedBankInfo, setCopiedBankInfo] = useState<boolean>(false);

  // My Bookings lookup
  const [searchPhone, setSearchPhone] = useState<string>('');
  const [lookupResults, setLookupResults] = useState<Booking[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Calculations for current selection
  const nights = calculateNights(checkInDate, checkOutDate);
  const roomTotal = selectedRoom ? selectedRoom.pricePerNight * nights : 0;
  // BUSINESS RULE 4: Exactly 30% of room total, NO services included, rounded to 1000 VNĐ
  const depositRequired = calculateDeposit(roomTotal);

  // Selected services total
  const servicesItems = Object.entries(selectedServices)
    .filter(([_, qty]) => qty > 0)
    .map(([serviceId, qty]) => {
      const s = services.find((srv) => srv.id === serviceId)!;
      return {
        serviceId: s.id,
        serviceName: s.name,
        priceSnapshot: s.price,
        unit: s.unit,
        quantity: qty,
        addedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
    });

  const servicesTotal = servicesItems.reduce((acc, curr) => acc + curr.priceSnapshot * curr.quantity, 0);
  const estimatedGrossTotal = roomTotal + servicesTotal;

  // Filter available rooms without overbooking
  const availableRooms = rooms.filter((r) => {
    // 1. Capacity filter
    if (r.capacity < guestCount) return false;
    // 2. Category filter
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    // 3. Anti-overbooking check
    const { hasConflict } = checkOverbooking(r.id, checkInDate, checkOutDate, bookings);
    if (hasConflict) return false;
    // 4. Physical status check: if check-in is today and room is currently cleaning or in_house, it's not ready
    if (checkInDate === todayStr && (r.status === 'in_house' || r.status === 'cleaning')) {
      return false;
    }
    return true;
  });

  const handleOpenBookingModal = (room: Room) => {
    setSelectedRoom(room);
    setStep('form');
    setSelectedServices({});
  };

  const handleCreatePendingBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    if (!guestName.trim() || !guestPhone.trim()) {
      alert('Vui lòng nhập Họ tên và Số điện thoại liên hệ!');
      return;
    }

    // Double check anti-overbooking right before booking
    const { hasConflict, conflictingBooking } = checkOverbooking(
      selectedRoom.id,
      checkInDate,
      checkOutDate,
      bookings
    );

    if (hasConflict) {
      alert(
        `Phòng ${selectedRoom.id} vừa bị trùng lịch với đơn khác (${conflictingBooking?.guestName} từ ${conflictingBooking?.checkInDate} đến ${conflictingBooking?.checkOutDate}). Vui lòng chọn phòng khác!`
      );
      return;
    }

    const bookingId = `CS-${Date.now().toString().slice(-6)}`;
    const newBooking: Booking = {
      id: bookingId,
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      roomCategoryName: selectedRoom.categoryName,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      guestEmail: guestEmail.trim() || `${guestPhone.trim()}@guest.chicstay.vn`,
      checkInDate,
      checkOutDate,
      nights,
      guestCount,
      roomRateSnapshot: selectedRoom.pricePerNight,
      roomTotal,
      depositRequired,
      depositPaid: 0,
      services: servicesItems,
      servicesTotal,
      lateCheckoutHours: 0,
      lateCheckoutFee: 0,
      totalAmount: estimatedGrossTotal,
      balanceDue: estimatedGrossTotal,
      status: 'pending_deposit',
      notes: guestNotes.trim(),
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setActiveBookingResult(newBooking);
    setStep('vietqr');
  };

  const handleConfirmTransfer = () => {
    if (!activeBookingResult || !selectedRoom) return;

    // Transition to confirmed
    const confirmedBooking: Booking = {
      ...activeBookingResult,
      depositPaid: activeBookingResult.depositRequired,
      balanceDue: activeBookingResult.totalAmount - activeBookingResult.depositRequired,
      status: 'confirmed',
    };

    const newCustomer: Customer = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      name: confirmedBooking.guestName,
      phone: confirmedBooking.guestPhone,
      email: confirmedBooking.guestEmail,
      totalSpend: confirmedBooking.depositPaid,
      staysCount: 1,
      lastStayDate: confirmedBooking.checkInDate,
      tier: 'Mới',
      notes: confirmedBooking.notes,
    };

    onAddBooking(confirmedBooking, newCustomer);
    setActiveBookingResult(confirmedBooking);
    setStep('success');
  };

  const handleSearchMyBookings = () => {
    if (!searchPhone.trim()) {
      alert('Vui lòng nhập Số điện thoại hoặc Mã đặt phòng để tra cứu');
      return;
    }
    const q = searchPhone.trim().toLowerCase();
    const results = bookings.filter(
      (b) => b.guestPhone.toLowerCase().includes(q) || b.id.toLowerCase().includes(q)
    );
    setLookupResults(results);
    setHasSearched(true);
  };

  const copyBankDetails = () => {
    if (!activeBookingResult) return;
    const memo = `CHICSTAY ${activeBookingResult.id} ${activeBookingResult.guestName}`;
    const text = `Ngân hàng: ${HOMESTAY_BANK_INFO.bankName}\nSố tài khoản: ${HOMESTAY_BANK_INFO.accountNumber}\nChủ tài khoản: ${HOMESTAY_BANK_INFO.accountHolder}\nSố tiền cọc: ${formatVND(activeBookingResult.depositRequired)}\nNội dung: ${memo}`;
    navigator.clipboard.writeText(text);
    setCopiedBankInfo(true);
    setTimeout(() => setCopiedBankInfo(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Subtab Toggle */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-[#2D5A43] dark:text-[#E2E8F0]">
            Cổng Đặt Phòng Trực Tuyến ChicStay
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Tìm phòng trống tức thì, chống trùng lịch (Anti-overbooking), cọc đúng 30% qua VietQR tự động.
          </p>
        </div>

        <div className="flex items-center space-x-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
          <button
            onClick={() => setSubTab('book')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              subTab === 'book'
                ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] dark:text-[#D4A373] shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Tìm & Đặt Phòng
          </button>
          <button
            onClick={() => setSubTab('my_bookings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              subTab === 'my_bookings'
                ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] dark:text-[#D4A373] shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            Tra Cứu / Hủy Đơn
          </button>
        </div>
      </div>

      {/* TAB 1: BOOKING WORKFLOW */}
      {subTab === 'book' && (
        <>
          {/* Search Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Ngày nhận phòng (Check-in 14:00)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="date"
                    value={checkInDate}
                    min={todayStr}
                    onChange={(e) => {
                      setCheckInDate(e.target.value);
                      if (e.target.value >= checkOutDate) {
                        const nextD = new Date(e.target.value);
                        nextD.setDate(nextD.getDate() + 1);
                        setCheckOutDate(nextD.toISOString().split('T')[0]);
                      }
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Ngày trả phòng (Check-out 12:00)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <input
                    type="date"
                    value={checkOutDate}
                    min={checkInDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Số lượng khách
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value={1}>1 Người lớn</option>
                    <option value={2}>2 Người lớn (Tiêu chuẩn)</option>
                    <option value={3}>3 Người (Bungalow / Phụ trội)</option>
                    <option value={4}>4 Người (Family 2 giường lớn)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Hạng phòng
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="all">Tất cả 4 hạng phòng</option>
                  <option value="standard">Standard ấm cúng (450k)</option>
                  <option value="deluxe">Deluxe view đồi (650k)</option>
                  <option value="family">Family 2 giường (1.100k)</option>
                  <option value="bungalow">Bungalow gỗ sân vườn (1.400k)</option>
                </select>
              </div>

            </div>

            {/* Filter Summary */}
            <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-neutral-500">
              <div className="flex items-center space-x-2">
                <span>Khoảng thời gian:</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {checkInDate} → {checkOutDate} ({nights} đêm)
                </span>
                <span>·</span>
                <span>Số khách:</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{guestCount} khách</span>
              </div>
              <div className="text-[#2D5A43] dark:text-[#D4A373] font-medium">
                Tìm thấy {availableRooms.length} phòng trống không bị trùng lịch
              </div>
            </div>
          </div>

          {/* Available Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRooms.map((room) => {
              const estimatedTotal = room.pricePerNight * nights;
              const depositEst = calculateDeposit(estimatedTotal);

              return (
                <div
                  key={room.id}
                  className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs flex flex-col justify-between hover:border-[#2D5A43]/50 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs uppercase font-bold tracking-wider text-[#D4A373]">
                          {room.categoryName}
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                          {room.id} - {room.name}
                        </h3>
                        <p className="text-xs text-neutral-500">{room.floor}</p>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-lg font-bold text-[#2D5A43] dark:text-[#D4A373]">
                          {formatVND(room.pricePerNight)}
                        </div>
                        <div className="text-[11px] text-neutral-400">mỗi đêm</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                      <div className="flex items-center space-x-2">
                        <Users className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Sức chứa: Tối đa {room.capacity} khách</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#F8F6F0] dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50 text-[11px] space-y-1">
                        <div><strong>Giường:</strong> {room.bedDescription}</div>
                        <div><strong>Điểm nổi bật:</strong> {room.viewDescription}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Tiền phòng ({nights} đêm):</span>
                      <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                        {formatVND(estimatedTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-700 dark:text-amber-400 font-medium">Cọc bắt buộc (30%):</span>
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                        {formatVND(depositEst)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenBookingModal(room)}
                      className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#2D5A43] hover:bg-[#234634] text-white transition-colors shadow-xs"
                    >
                      <span>Chọn phòng này & Tiến hành đặt</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {availableRooms.length === 0 && (
            <div className="p-10 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
              <div className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                Không tìm thấy phòng trống phù hợp cho khoảng thời gian này
              </div>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Tất cả các phòng trong hạng đã chọn đều đã có khách đặt hoặc đang có người ở. Quý khách vui lòng đổi ngày nhận/trả hoặc liên hệ hotline lễ tân để được sắp xếp thêm.
              </p>
            </div>
          )}
        </>
      )}

      {/* TAB 2: MY BOOKINGS LOOKUP & CANCELLATION */}
      {subTab === 'my_bookings' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Tra cứu thông tin đơn đặt phòng
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập số điện thoại đặt phòng (vd: 0912345678) hoặc mã CS-..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchMyBookings()}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
              <button
                onClick={handleSearchMyBookings}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2D5A43] text-white hover:bg-[#234634]"
              >
                Tra cứu
              </button>
            </div>
          </div>

          {/* Results list */}
          {hasSearched && (
            <div className="space-y-3">
              {lookupResults.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  Không tìm thấy đơn đặt phòng nào với thông tin vừa nhập.
                </div>
              ) : (
                lookupResults.map((bk) => {
                  const policy = evaluateCancellationPolicy(bk.checkInDate);
                  const isCancelable = bk.status === 'confirmed' || bk.status === 'pending_deposit';

                  return (
                    <div
                      key={bk.id}
                      className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-base text-neutral-900 dark:text-neutral-100">
                              {bk.id}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-[#2D5A43]/10 text-[#2D5A43] dark:text-[#D4A373]">
                              {bk.roomName} ({bk.roomId})
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            Khách hàng: <strong className="text-neutral-800 dark:text-neutral-200">{bk.guestName}</strong> · SĐT: {bk.guestPhone}
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                              bk.status === 'confirmed'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                                : bk.status === 'in_house'
                                ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300'
                                : bk.status === 'completed'
                                ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300'
                                : bk.status === 'cancelled_refunded'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300'
                                : bk.status === 'cancelled_forfeited'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {bk.status === 'confirmed' && 'Đã xác nhận (Đã cọc 30%)'}
                            {bk.status === 'in_house' && 'Đang ở homestay'}
                            {bk.status === 'completed' && 'Đã hoàn tất lưu trú'}
                            {bk.status === 'cancelled_refunded' && 'Đã hủy (Hoàn cọc thủ công)'}
                            {bk.status === 'cancelled_forfeited' && 'Đã hủy (Mất cọc)'}
                            {bk.status === 'pending_deposit' && 'Chờ cọc VietQR'}
                          </span>
                        </div>
                      </div>

                      {/* Financial info */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-xs">
                        <div>
                          <div className="text-neutral-400">Thời gian lưu trú</div>
                          <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {bk.checkInDate} → {bk.checkOutDate} ({bk.nights} đêm)
                          </div>
                        </div>
                        <div>
                          <div className="text-neutral-400">Tiền phòng</div>
                          <div className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                            {formatVND(bk.roomTotal)}
                          </div>
                        </div>
                        <div>
                          <div className="text-neutral-400">Đã cọc 30%</div>
                          <div className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                            {formatVND(bk.depositPaid)}
                          </div>
                        </div>
                        <div>
                          <div className="text-neutral-400">Còn phải thanh toán</div>
                          <div className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                            {formatVND(bk.balanceDue)}
                          </div>
                        </div>
                      </div>

                      {/* Services breakdown if any */}
                      {bk.services && bk.services.length > 0 && (
                        <div className="text-xs text-neutral-600 dark:text-neutral-400">
                          <span className="font-semibold">Dịch vụ đã chọn: </span>
                          {bk.services.map((s) => `${s.serviceName} (${s.quantity} ${s.unit})`).join(', ')}
                        </div>
                      )}

                      {/* Cancellation policy inspection */}
                      {isCancelable && (
                        <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                              Chính sách hủy phòng áp dụng:
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                policy.isEligibleForRefund
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              }`}
                            >
                              {policy.statusBadge}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500">
                            {policy.policyMessage}
                          </p>
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Bạn có chắc chắn muốn hủy đơn ${bk.id}?\n\nĐánh giá chính sách: ${policy.statusBadge}\n${policy.policyMessage}`
                                  )
                                ) {
                                  onCancelBooking(bk.id);
                                  handleSearchMyBookings();
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors"
                            >
                              Yêu cầu hủy phòng ({policy.statusBadge})
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* BOOKING MODAL & VIETQR WIZARD */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-[#F8F6F0] dark:bg-neutral-800/50">
              <div>
                <h3 className="font-bold text-base text-[#2D5A43] dark:text-[#E2E8F0]">
                  {step === 'form' && `Đặt phòng ${selectedRoom.id} - ${selectedRoom.name}`}
                  {step === 'vietqr' && `Thanh toán chuyển cọc 30% qua VietQR`}
                  {step === 'success' && `Đặt phòng thành công!`}
                </h3>
                <p className="text-xs text-neutral-500">
                  {selectedRoom.categoryName} · {checkInDate} đến {checkOutDate} ({nights} đêm)
                </p>
              </div>

              {step !== 'vietqr' && (
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* STEP 1: FORM & SERVICES */}
            {step === 'form' && (
              <form onSubmit={handleCreatePendingBooking} className="p-6 space-y-5">
                
                {/* Customer Information */}
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-500 mb-3">
                    1. Thông tin người đặt phòng
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Họ và tên khách hàng *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Số điện thoại liên hệ *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0912345678"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Địa chỉ Email
                      </label>
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Ghi chú / Yêu cầu đặc biệt
                      </label>
                      <input
                        type="text"
                        placeholder="Giờ đến dự kiến, xe đưa đón..."
                        value={guestNotes}
                        onChange={(e) => setGuestNotes(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      />
                    </div>
                  </div>
                </div>

                {/* 9 Add-on Services (D001-D009) */}
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-neutral-500 mb-2">
                    2. Dịch vụ đính kèm đặt trước (Tùy chọn)
                  </h4>
                  <p className="text-[11px] text-neutral-400 mb-3">
                    Lưu ý: Tiền dịch vụ KHÔNG tính vào tiền cọc 30% mà thanh toán khi sử dụng hoặc quyết toán lúc trả phòng.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {services.map((srv) => {
                      const qty = selectedServices[srv.id] || 0;
                      return (
                        <div
                          key={srv.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs bg-neutral-50/50 dark:bg-neutral-800/40"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                              {srv.name}
                            </div>
                            <div className="text-[11px] text-neutral-500">
                              {formatVND(srv.price)}/{srv.unit}
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (qty > 0) {
                                  setSelectedServices({ ...selectedServices, [srv.id]: qty - 1 });
                                }
                              }}
                              className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-mono font-semibold">{qty}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedServices({ ...selectedServices, [srv.id]: qty + 1 });
                              }}
                              className="w-6 h-6 rounded bg-[#2D5A43] text-white flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Auto Calculated Pro-Forma Invoice */}
                <div className="p-4 rounded-xl bg-[#F8F6F0] dark:bg-neutral-800 border border-[#2D5A43]/20 space-y-2 text-xs">
                  <div className="font-bold text-[#2D5A43] dark:text-[#D4A373] text-xs uppercase tracking-wider">
                    Bảng Tạm Tính Đơn Đặt Phòng
                  </div>

                  <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
                    <span>Tiền phòng ({nights} đêm x {formatVND(selectedRoom.pricePerNight)}):</span>
                    <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                      {formatVND(roomTotal)}
                    </span>
                  </div>

                  <div className="flex justify-between text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900/40">
                    <span>Tiền cọc bắt buộc (Đúng 30% tiền phòng):</span>
                    <span className="font-mono text-sm">
                      {formatVND(depositRequired)}
                    </span>
                  </div>

                  {servicesTotal > 0 && (
                    <div className="flex justify-between text-neutral-500">
                      <span>Dịch vụ kèm theo ({servicesItems.length} mục):</span>
                      <span className="font-mono">+{formatVND(servicesTotal)} (thu sau)</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-neutral-300 dark:border-neutral-700 flex justify-between font-bold text-sm text-neutral-900 dark:text-neutral-100">
                    <span>Tổng tiền đơn dự kiến:</span>
                    <span className="font-mono text-[#2D5A43] dark:text-[#D4A373]">
                      {formatVND(estimatedGrossTotal)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRoom(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    className="flex items-center space-x-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-[#2D5A43] hover:bg-[#234634] text-white shadow-sm transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Tạo mã VietQR chuyển cọc 30%</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: DYNAMIC VIETQR SCREEN */}
            {step === 'vietqr' && activeBookingResult && (
              <div className="p-6 space-y-6">
                <div className="text-center space-y-1">
                  <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                    Quét Mã VietQR Chuyển Tiền Cọc 30%
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Đơn đặt phòng <span className="font-mono font-bold text-[#2D5A43]">{activeBookingResult.id}</span>
                  </p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                  {/* VietQR Code Rendering */}
                  <div className="flex flex-col items-center p-3 rounded-2xl bg-white border border-neutral-200 shadow-md">
                    <img
                      src={getVietQRImageUrl(
                        activeBookingResult.depositRequired,
                        `CHICSTAY ${activeBookingResult.id}`
                      )}
                      alt="VietQR ChicStay"
                      className="w-56 h-auto rounded-lg object-contain"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback in case of network issues
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="mt-2 text-[10px] text-neutral-500 font-mono text-center">
                      Quét bằng ứng dụng của bất kỳ ngân hàng nào
                    </div>
                  </div>

                  {/* Transfer Details Card */}
                  <div className="w-full md:w-64 space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 space-y-1.5">
                      <div className="text-[11px] text-neutral-400">Ngân hàng thụ hưởng</div>
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {HOMESTAY_BANK_INFO.bankName}
                      </div>

                      <div className="text-[11px] text-neutral-400 pt-1">Số tài khoản</div>
                      <div className="font-mono font-bold text-sm text-[#2D5A43] dark:text-[#D4A373]">
                        {HOMESTAY_BANK_INFO.accountNumber}
                      </div>

                      <div className="text-[11px] text-neutral-400 pt-1">Chủ tài khoản</div>
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {HOMESTAY_BANK_INFO.accountHolder}
                      </div>

                      <div className="text-[11px] text-neutral-400 pt-1">Số tiền cọc bắt buộc (30%)</div>
                      <div className="font-mono font-bold text-base text-amber-700 dark:text-amber-400">
                        {formatVND(activeBookingResult.depositRequired)}
                      </div>

                      <div className="text-[11px] text-neutral-400 pt-1">Nội dung chuyển khoản (Memo)</div>
                      <div className="font-mono font-bold text-xs bg-white dark:bg-neutral-900 p-1.5 rounded border border-neutral-200 dark:border-neutral-700">
                        CHICSTAY {activeBookingResult.id} {activeBookingResult.guestName}
                      </div>
                    </div>

                    <button
                      onClick={copyBankDetails}
                      className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition-colors"
                    >
                      {copiedBankInfo ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBankInfo ? 'Đã sao chép thông tin!' : 'Sao chép thông tin chuyển khoản'}</span>
                    </button>
                  </div>
                </div>

                {/* Important note */}
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center space-x-1">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Lưu ý về chính sách hoàn cọc:</span>
                  </div>
                  <div>
                    - Hủy phòng trước giờ nhận &gt;= 48h: Đủ điều kiện hoàn cọc 100% thủ công.
                  </div>
                  <div>
                    - Hủy phòng &lt; 48h: Mất cọc theo quy định ChicStay Đà Lạt.
                  </div>
                </div>

                {/* Confirm deposit button */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setStep('form')}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
                  >
                    Quay lại sửa đơn
                  </button>

                  <button
                    onClick={handleConfirmTransfer}
                    className="flex items-center space-x-2 px-6 py-2.5 text-xs font-semibold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Xác nhận đã chuyển cọc {formatVND(activeBookingResult.depositRequired)}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION */}
            {step === 'success' && activeBookingResult && (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                  <CheckCircle className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    Đặt Phòng Đã Được Xác Nhận!
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Hệ thống đã tự động khóa phòng trên sơ đồ Rack và cập nhật khoản cọc 30%.
                  </p>
                </div>

                <div className="max-w-md mx-auto p-4 rounded-xl bg-[#F8F6F0] dark:bg-neutral-800 border border-[#2D5A43]/20 text-xs text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Mã đặt phòng:</span>
                    <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{activeBookingResult.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Phòng:</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{activeBookingResult.roomName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Người đặt:</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{activeBookingResult.guestName} ({activeBookingResult.guestPhone})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Thời gian:</span>
                    <span>{activeBookingResult.checkInDate} đến {activeBookingResult.checkOutDate}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold pt-1 border-t border-neutral-300 dark:border-neutral-700">
                    <span>Đã nhận tiền cọc 30%:</span>
                    <span className="font-mono">{formatVND(activeBookingResult.depositPaid)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600 dark:text-neutral-300">
                    <span>Số tiền còn lại khi check-out:</span>
                    <span className="font-mono">{formatVND(activeBookingResult.balanceDue)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRoom(null)}
                  className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-[#2D5A43] text-white hover:bg-[#234634]"
                >
                  Hoàn tất & Đóng cửa sổ
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
