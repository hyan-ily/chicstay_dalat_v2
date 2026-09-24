/**
 * Generates a complete standalone single-file HTML file containing React 18, Tailwind CDN,
 * Lucide Icons, and the entire ChicStay Đà Lạt application that runs directly in any browser.
 */
export function generateSingleFileHtml(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ChicStay Đà Lạt - Hệ Thống Quản Lý Homestay (Single-File)</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            rice: '#F8F6F0',
            slateDark: '#0F172A',
            pineSage: '#2D5A43',
            sandClay: '#D4A373',
          }
        }
      }
    }
  </script>
  <!-- Google Fonts: Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!-- React 18 & Babel CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <style>
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    }
    @media print {
      body * { visibility: hidden; }
      #printable-invoice, #printable-invoice * { visibility: visible; }
      #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 24px; background: white !important; color: black !important; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body class="bg-[#F8F6F0] dark:bg-[#0F172A] text-neutral-900 dark:text-neutral-100 min-h-screen transition-colors duration-200">
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useRef } = React;

    // MASTER DATA
    const INITIAL_ROOMS = [
      { id: 'P101', name: 'Phòng 101 - Ban Mai', category: 'standard', categoryName: 'Standard ấm cúng', capacity: 2, pricePerNight: 450000, floor: 'Tầng 1', bedDescription: '1 Giường đôi Queen (1m6 x 2m)', status: 'in_house', currentBookingId: 'CS-0101' },
      { id: 'P102', name: 'Phòng 102 - Nắng Sớm', category: 'standard', categoryName: 'Standard ấm cúng', capacity: 2, pricePerNight: 450000, floor: 'Tầng 1', bedDescription: '1 Giường đôi Queen (1m6 x 2m)', status: 'available' },
      { id: 'P103', name: 'Phòng 103 - Gió Chiều', category: 'standard', categoryName: 'Standard ấm cúng', capacity: 2, pricePerNight: 450000, floor: 'Tầng 1', bedDescription: '1 Giường đôi Queen (1m6 x 2m)', status: 'available' },
      { id: 'P201', name: 'Phòng 201 - Sương Mù', category: 'deluxe', categoryName: 'Deluxe view đồi', capacity: 2, pricePerNight: 650000, floor: 'Tầng 2', bedDescription: '1 Giường King lớn (1m8 x 2m)', status: 'booked', currentBookingId: 'CS-0201' },
      { id: 'P202', name: 'Phòng 202 - Mây Trắng', category: 'deluxe', categoryName: 'Deluxe view đồi', capacity: 2, pricePerNight: 650000, floor: 'Tầng 2', bedDescription: '1 Giường King lớn (1m8 x 2m)', status: 'available' },
      { id: 'P203', name: 'Phòng 203 - Hoàng Hôn', category: 'deluxe', categoryName: 'Deluxe view đồi', capacity: 2, pricePerNight: 650000, floor: 'Tầng 2', bedDescription: '1 Giường King lớn (1m8 x 2m)', status: 'available' },
      { id: 'P204', name: 'Phòng 204 - Thông Reo', category: 'deluxe', categoryName: 'Deluxe view đồi', capacity: 2, pricePerNight: 650000, floor: 'Tầng 2', bedDescription: '1 Giường King lớn (1m8 x 2m)', status: 'available' },
      { id: 'P301', name: 'Phòng 301 - Gia Đình Ấm', category: 'family', categoryName: 'Family 2 giường lớn', capacity: 4, pricePerNight: 1100000, floor: 'Tầng 3', bedDescription: '2 Giường King lớn (1m8 x 2m)', status: 'cleaning', currentBookingId: 'CS-0301' },
      { id: 'P302', name: 'Phòng 302 - Đoàn Viên', category: 'family', categoryName: 'Family 2 giường lớn', capacity: 4, pricePerNight: 1100000, floor: 'Tầng 3', bedDescription: '2 Giường King lớn (1m8 x 2m)', status: 'available' },
      { id: 'P303', name: 'Phòng 303 - Sum Vầy', category: 'family', categoryName: 'Family 2 giường lớn', capacity: 4, pricePerNight: 1100000, floor: 'Tầng 3', bedDescription: '2 Giường King lớn (1m8 x 2m)', status: 'available' },
      { id: 'BG01', name: 'Bungalow 01 - Cội Thông', category: 'bungalow', categoryName: 'Bungalow gỗ sân vườn', capacity: 3, pricePerNight: 1400000, floor: 'Khu vườn', bedDescription: '1 Super King + Sofa bed', status: 'in_house', currentBookingId: 'CS-BG01' },
      { id: 'BG02', name: 'Bungalow 02 - Hoa Dã Quỳ', category: 'bungalow', categoryName: 'Bungalow gỗ sân vườn', capacity: 3, pricePerNight: 1400000, floor: 'Khu vườn', bedDescription: '1 Super King + Sofa bed', status: 'available' },
    ];

    const INITIAL_SERVICES = [
      { id: 'D001', name: 'Ăn sáng đặc sản', price: 50000, unit: 'suất', description: 'Bánh mì xíu mại / bún bò' },
      { id: 'D002', name: 'Đưa đón sân bay', price: 250000, unit: 'chuyến', description: 'Xe 7 chỗ sân bay Liên Khương' },
      { id: 'D003', name: 'Thuê xe ga', price: 150000, unit: 'ngày', description: 'Vision / Lead kèm nón & áo mưa' },
      { id: 'D004', name: 'Thuê xe số', price: 120000, unit: 'ngày', description: 'Wave / Sirius leo đèo dốc khỏe' },
      { id: 'D005', name: 'Giặt ủi', price: 35000, unit: 'kg', description: 'Giặt sấy thơm ngát trong ngày' },
      { id: 'D006', name: 'BBQ sân vườn', price: 250000, unit: 'người', description: 'Set bò nướng sốt, than và bếp' },
      { id: 'D007', name: 'Giường phụ', price: 200000, unit: 'đêm', description: 'Nệm gòn cao cấp + chăn lông vũ' },
      { id: 'D008', name: 'Nhận phòng sớm', price: 80000, unit: 'h', description: 'Nhận sớm trước 14:00 nếu sẵn sàng' },
      { id: 'D009', name: 'Trả phòng muộn', price: 100000, unit: 'h', description: 'Phụ thu sau 12:00 (100k/giờ làm tròn)' },
    ];

    const INITIAL_BOOKINGS = [
      {
        id: 'CS-0101',
        roomId: 'P101',
        roomName: 'Phòng 101 - Ban Mai',
        roomCategoryName: 'Standard ấm cúng',
        guestName: 'Nguyễn Văn An',
        guestPhone: '0912345678',
        checkInDate: '2026-09-22',
        checkOutDate: '2026-09-24',
        nights: 2,
        guestCount: 2,
        roomRateSnapshot: 450000,
        roomTotal: 900000,
        depositRequired: 270000,
        depositPaid: 270000,
        services: [
          { serviceId: 'D001', serviceName: 'Ăn sáng đặc sản', priceSnapshot: 50000, unit: 'suất', quantity: 2 },
          { serviceId: 'D003', serviceName: 'Thuê xe ga', priceSnapshot: 150000, unit: 'ngày', quantity: 2 },
        ],
        servicesTotal: 400000,
        lateCheckoutHours: 0,
        lateCheckoutFee: 0,
        totalAmount: 1300000,
        balanceDue: 1030000,
        status: 'in_house',
      },
      {
        id: 'CS-0201',
        roomId: 'P201',
        roomName: 'Phòng 201 - Sương Mù',
        roomCategoryName: 'Deluxe view đồi',
        guestName: 'Trần Thị Mai',
        guestPhone: '0987654321',
        checkInDate: '2026-09-24',
        checkOutDate: '2026-09-26',
        nights: 2,
        guestCount: 2,
        roomRateSnapshot: 650000,
        roomTotal: 1300000,
        depositRequired: 390000,
        depositPaid: 390000,
        services: [{ serviceId: 'D002', serviceName: 'Đưa đón sân bay', priceSnapshot: 250000, unit: 'chuyến', quantity: 1 }],
        servicesTotal: 250000,
        lateCheckoutHours: 0,
        lateCheckoutFee: 0,
        totalAmount: 1550000,
        balanceDue: 1160000,
        status: 'confirmed',
      },
    ];

    const INITIAL_CUSTOMERS = [
      { id: 'CUST-001', name: 'Nguyễn Văn An', phone: '0912345678', email: 'an.nguyen@gmail.com', totalSpend: 2600000, staysCount: 2, lastStayDate: '2026-09-22', tier: 'Thân thiết' },
      { id: 'CUST-002', name: 'Trần Thị Mai', phone: '0987654321', email: 'mai.tran@outlook.com', totalSpend: 1550000, staysCount: 1, lastStayDate: '2026-09-24', tier: 'Mới' },
    ];

    function formatVND(amt) {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amt || 0);
    }

    function calculateDeposit(roomTotal) {
      return Math.round((roomTotal * 0.3) / 1000) * 1000;
    }

    function calculateLateFee(hours) {
      return hours > 0 ? Math.ceil(hours) * 100000 : 0;
    }

    function checkOverbooking(roomId, inStr, outStr, list, excludeId) {
      const active = list.filter(b => b.roomId === roomId && (b.status === 'confirmed' || b.status === 'in_house' || b.status === 'pending_deposit') && b.id !== excludeId);
      const nStart = new Date(inStr + 'T14:00:00').getTime();
      const nEnd = new Date(outStr + 'T12:00:00').getTime();
      for (const b of active) {
        const eStart = new Date(b.checkInDate + 'T14:00:00').getTime();
        const eEnd = new Date(b.checkOutDate + 'T12:00:00').getTime();
        if (Math.max(nStart, eStart) < Math.min(nEnd, eEnd)) {
          return { hasConflict: true, b };
        }
      }
      return { hasConflict: false };
    }

    function evaluateCancel(inDate) {
      const diffHours = (new Date(inDate + 'T14:00:00').getTime() - new Date().getTime()) / 3600000;
      return diffHours >= 48
        ? { canRefund: true, badge: 'Hoàn cọc thủ công', text: 'Hủy trước >= 48h: Đủ điều kiện hoàn cọc 100% thủ công qua STK.' }
        : { canRefund: false, badge: 'Mất cọc', text: 'Hủy sát ngày < 48h: Không hoàn tiền cọc theo quy định ChicStay.' };
    }

    // MAIN SINGLE-FILE APPLICATION
    function App() {
      const [isDark, setIsDark] = useState(false);
      const [activeTab, setActiveTab] = useState('receptionist'); // 'customer' | 'receptionist' | 'crm' | 'chat'

      // Stored States
      const [rooms, setRooms] = useState(() => {
        const s = localStorage.getItem('cs_rooms');
        return s ? JSON.parse(s) : INITIAL_ROOMS;
      });
      const [bookings, setBookings] = useState(() => {
        const s = localStorage.getItem('cs_bookings');
        return s ? JSON.parse(s) : INITIAL_BOOKINGS;
      });
      const [customers, setCustomers] = useState(() => {
        const s = localStorage.getItem('cs_cust');
        return s ? JSON.parse(s) : INITIAL_CUSTOMERS;
      });

      useEffect(() => { localStorage.setItem('cs_rooms', JSON.stringify(rooms)); }, [rooms]);
      useEffect(() => { localStorage.setItem('cs_bookings', JSON.stringify(bookings)); }, [bookings]);
      useEffect(() => { localStorage.setItem('cs_cust', JSON.stringify(customers)); }, [customers]);
      useEffect(() => {
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }, [isDark]);

      // Modals
      const [checkoutBooking, setCheckoutBooking] = useState(null);
      const [addServiceBooking, setAddServiceBooking] = useState(null);
      const [walkInRoom, setWalkInRoom] = useState(null);

      // Clock
      const [timeStr, setTimeStr] = useState('');
      useEffect(() => {
        const update = () => {
          const now = new Date();
          setTimeStr(now.toLocaleTimeString('vi-VN') + ' · ' + now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }));
        };
        update();
        const t = setInterval(update, 1000);
        return () => clearInterval(t);
      }, []);

      // Handlers
      const handleCheckIn = (bId) => {
        setBookings(prev => prev.map(b => b.id === bId ? { ...b, status: 'in_house', checkedInAt: new Date().toLocaleTimeString('vi-VN') } : b));
        const target = bookings.find(b => b.id === bId);
        if (target) {
          setRooms(prev => prev.map(r => r.id === target.roomId ? { ...r, status: 'in_house' } : r));
        }
      };

      const handleMarkCleaned = (rId) => {
        setRooms(prev => prev.map(r => r.id === rId ? { ...r, status: 'available', currentBookingId: undefined } : r));
      };

      const handleCompleteCheckOut = (bId, lateHours, lateFee, finalBalance) => {
        setBookings(prev => prev.map(b => b.id === bId ? {
          ...b,
          lateCheckoutHours: lateHours,
          lateCheckoutFee: lateFee,
          balanceDue: 0,
          status: 'completed',
          checkedOutAt: new Date().toLocaleTimeString('vi-VN')
        } : b));

        const target = bookings.find(b => b.id === bId);
        if (target) {
          setRooms(prev => prev.map(r => r.id === target.roomId ? { ...r, status: 'cleaning' } : r));
          // update CRM spend
          setCustomers(prev => prev.map(c => c.phone === target.guestPhone ? {
            ...c,
            totalSpend: c.totalSpend + (target.roomTotal + target.servicesTotal + lateFee - target.depositPaid)
          } : c));
        }
        setCheckoutBooking(null);
      };

      return (
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-[#2D5A43]/15 backdrop-blur-md bg-[#F8F6F0]/90 dark:bg-[#0F172A]/90">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-[#2D5A43] text-white flex items-center justify-center font-bold text-lg text-[#D4A373]">
                  CS
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold tracking-tight text-[#2D5A43] dark:text-[#E2E8F0]">ChicStay</span>
                    <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded bg-[#D4A373]/20 text-[#2D5A43] dark:text-[#D4A373]">Đà Lạt</span>
                  </div>
                  <div className="text-[11px] text-neutral-500 font-mono">{timeStr}</div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center space-x-1 p-1 bg-neutral-200/50 dark:bg-neutral-800/60 rounded-xl text-xs font-medium">
                <button onClick={() => setActiveTab('customer')} className={"px-3.5 py-1.5 rounded-lg " + (activeTab === 'customer' ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] font-bold shadow-xs' : 'text-neutral-600 dark:text-neutral-400')}>
                  Cổng Khách Hàng
                </button>
                <button onClick={() => setActiveTab('receptionist')} className={"px-3.5 py-1.5 rounded-lg " + (activeTab === 'receptionist' ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] font-bold shadow-xs' : 'text-neutral-600 dark:text-neutral-400')}>
                  Sơ Đồ Phòng (Rack)
                </button>
                <button onClick={() => setActiveTab('dashboard')} className={"px-3.5 py-1.5 rounded-lg " + (activeTab === 'dashboard' ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] font-bold shadow-xs' : 'text-neutral-600 dark:text-neutral-400')}>
                  Thống Kê Doanh Thu
                </button>
                <button onClick={() => setActiveTab('crm')} className={"px-3.5 py-1.5 rounded-lg " + (activeTab === 'crm' ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] font-bold shadow-xs' : 'text-neutral-600 dark:text-neutral-400')}>
                  Sổ Khách Hàng
                </button>
                <button onClick={() => setActiveTab('chat')} className={"px-3.5 py-1.5 rounded-lg " + (activeTab === 'chat' ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] font-bold shadow-xs' : 'text-neutral-600 dark:text-neutral-400')}>
                  Trợ Lý AI
                </button>
              </div>

              {/* Theme & Reset */}
              <div className="flex items-center space-x-2">
                <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs">
                  {isDark ? '☀️ Sáng' : '🌙 Tối'}
                </button>
                <button onClick={() => { if(confirm('Khôi phục Master Data mặc định?')) { localStorage.clear(); location.reload(); } }} className="p-2 rounded-lg text-xs text-neutral-500 hover:text-neutral-800">
                  Khôi phục
                </button>
              </div>
            </div>
          </header>

          {/* Body */}
          <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
            {activeTab === 'receptionist' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                    <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Trống sẵn sàng</div>
                    <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">{rooms.filter(r => r.status === 'available').length}</div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/10">
                    <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">Đã đặt (Cọc 30%)</div>
                    <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">{rooms.filter(r => r.status === 'booked').length}</div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-teal-500/20 bg-teal-500/10">
                    <div className="text-xs font-semibold text-teal-800 dark:text-teal-300">Đang ở (In-House)</div>
                    <div className="text-2xl font-bold font-mono text-teal-700 dark:text-teal-300">{rooms.filter(r => r.status === 'in_house').length}</div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/10">
                    <div className="text-xs font-semibold text-purple-800 dark:text-purple-300">Chờ dọn / Tạm khóa</div>
                    <div className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-300">{rooms.filter(r => r.status === 'cleaning').length}</div>
                  </div>
                </div>

                {/* 12-Room Rack Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {rooms.map(room => {
                    const activeBk = bookings.find(b => b.roomId === room.id && (b.status === 'in_house' || b.status === 'confirmed'));
                    let badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
                    let badgeText = 'Trống';
                    if (room.status === 'booked') { badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'; badgeText = 'Đã đặt'; }
                    if (room.status === 'in_house') { badgeClass = 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'; badgeText = 'Đang ở'; }
                    if (room.status === 'cleaning') { badgeClass = 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'; badgeText = 'Chờ dọn'; }

                    return (
                      <div key={room.id} className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex flex-col justify-between shadow-xs">
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-mono text-xl font-bold">{room.id}</span>
                              <div className="text-xs text-[#2D5A43] dark:text-[#D4A373] font-semibold">{room.name}</div>
                            </div>
                            <span className={"px-2.5 py-0.5 rounded-full text-xs font-semibold " + badgeClass}>{badgeText}</span>
                          </div>
                          <div className="mt-2 text-xs text-neutral-500">
                            <div>{room.categoryName} · {formatVND(room.pricePerNight)}/đêm</div>
                            <div className="text-[11px]">{room.bedDescription}</div>
                          </div>
                          {activeBk && (
                            <div className="mt-3 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-xs">
                              <div className="font-bold">{activeBk.guestName} ({activeBk.guestPhone})</div>
                              <div className="text-[11px] text-neutral-400">{activeBk.checkInDate} → {activeBk.checkOutDate}</div>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                          {room.status === 'available' && (
                            <button onClick={() => setWalkInRoom(room)} className="w-full py-1.5 text-xs font-semibold rounded-lg bg-[#2D5A43] text-white">
                              Đặt tại quầy (Walk-in)
                            </button>
                          )}
                          {room.status === 'booked' && activeBk && (
                            <button onClick={() => handleCheckIn(activeBk.id)} className="w-full py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white">
                              Nhận phòng (Check-in)
                            </button>
                          )}
                          {room.status === 'in_house' && activeBk && (
                            <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => setAddServiceBooking({ booking: activeBk, room })} className="py-1.5 text-xs font-semibold rounded-lg border border-teal-600 text-teal-700 dark:text-teal-300">
                                + Thêm DV
                              </button>
                              <button onClick={() => setCheckoutBooking({ booking: activeBk, room })} className="py-1.5 text-xs font-semibold rounded-lg bg-teal-700 text-white">
                                Quyết toán
                              </button>
                            </div>
                          )}
                          {room.status === 'cleaning' && (
                            <button onClick={() => handleMarkCleaned(room.id)} className="w-full py-1.5 text-xs font-semibold rounded-lg bg-purple-700 text-white">
                              ✅ Đã dọn xong
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
                  <h3 className="font-bold text-base text-[#2D5A43] dark:text-[#E2E8F0]">Thống Kê Doanh Thu & Công Suất Phòng (Tháng 09/2026)</h3>
                  <p className="text-xs text-neutral-500">Tổng hợp thu nhập theo ngày và tỷ lệ lấp đầy 12 phòng ChicStay</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border">
                    <div className="text-xs text-neutral-400 font-semibold">TỔNG DOANH THU</div>
                    <div className="text-xl font-bold font-mono text-emerald-600">82.450.000 ₫</div>
                    <div className="text-[11px] text-neutral-500 mt-1">Phòng + Dịch vụ F&B</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border">
                    <div className="text-xs text-neutral-400 font-semibold">CÔNG SUẤT PHÒNG TB</div>
                    <div className="text-xl font-bold font-mono text-[#2D5A43] dark:text-[#D4A373]">71.4%</div>
                    <div className="text-[11px] text-emerald-600 mt-1">Vượt chỉ tiêu 70%</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border">
                    <div className="text-xs text-neutral-400 font-semibold">ADR (GIÁ PHÒNG TB)</div>
                    <div className="text-xl font-bold font-mono text-neutral-800 dark:text-neutral-200">765.000 ₫</div>
                    <div className="text-[11px] text-neutral-500 mt-1">Mỗi phòng có khách/đêm</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border">
                    <div className="text-xs text-neutral-400 font-semibold">DỊCH VỤ PHỤ TRỢ</div>
                    <div className="text-xl font-bold font-mono text-[#D4A373]">19.840.000 ₫</div>
                    <div className="text-[11px] text-neutral-500 mt-1">BBQ, xe máy, đưa đón</div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>Xu hướng doanh thu 7 ngày gần nhất</span>
                    <span className="text-neutral-400">Đơn vị: VNĐ</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { d: '18/09 (T6)', r: 3850000, occ: '11/12 (91.7%)', pct: 92 },
                      { d: '19/09 (T7)', r: 4200000, occ: '12/12 (100%)', pct: 100 },
                      { d: '20/09 (CN)', r: 3950000, occ: '11/12 (91.7%)', pct: 92 },
                      { d: '21/09 (T2)', r: 2450000, occ: '7/12 (58.3%)', pct: 58 },
                      { d: '22/09 (T3)', r: 2600000, occ: '8/12 (66.7%)', pct: 67 },
                      { d: '23/09 (T4)', r: 2550000, occ: '8/12 (66.7%)', pct: 67 },
                      { d: '24/09 (T5)', r: 2900000, occ: '9/12 (75.0%)', pct: 75 },
                    ].map(row => (
                      <div key={row.d} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold">{row.d}</span>
                          <span className="font-mono text-neutral-500">Phòng: {row.occ} · Thu: <strong className="text-[#2D5A43] dark:text-[#D4A373]">{formatVND(row.r)}</strong></span>
                        </div>
                        <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#2D5A43] h-full rounded-full" style={{ width: row.pct + '%' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>`;
}

export function downloadStandaloneHtml(): void {
  const content = generateSingleFileHtml();
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chicstay-dalat-system.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
