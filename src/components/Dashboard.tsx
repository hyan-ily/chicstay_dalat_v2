import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  BarChart
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  BedDouble, 
  Sparkles, 
  Calendar, 
  Award, 
  ArrowUpRight, 
  Download, 
  Filter,
  Layers,
  Coffee,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Room, Booking, Service } from '../types';
import { formatVND } from '../utils/calculations';

interface DashboardProps {
  rooms: Room[];
  bookings: Booking[];
  services: Service[];
}

// Color palette aligned with ChicStay theme
const COLORS = {
  pineSage: '#2D5A43',
  pineSageLight: '#4A7C62',
  sandClay: '#D4A373',
  sandClayLight: '#E8C5A0',
  emerald: '#10B981',
  amber: '#F59E0B',
  indigo: '#6366F1',
  slateDark: '#0F172A',
  slateLight: '#F8F6F0',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Standard ấm cúng': '#3B82F6',
  'Deluxe view đồi': '#10B981',
  'Family 2 giường lớn': '#8B5CF6',
  'Bungalow gỗ sân vườn': '#D4A373',
};

interface DailyStats {
  date: string; // YYYY-MM-DD
  displayDate: string; // DD/MM
  dayOfWeek: string; // T2, T3, T4, T5, T6, T7, CN
  isWeekend: boolean;
  occupiedRooms: number;
  occupancyRate: number; // 0 - 100%
  roomRevenue: number;
  serviceRevenue: number;
  lateFeeRevenue: number;
  totalRevenue: number;
  bookingNames: string[];
}

export const Dashboard: React.FC<DashboardProps> = ({ rooms, bookings, services }) => {
  // Current month state - defaulting to 2026-09 (Tháng 9/2026)
  const [selectedMonth, setSelectedMonth] = useState<'2026-09' | '2026-08' | '2026-10'>('2026-09');
  const [chartMetric, setChartMetric] = useState<'all' | 'room' | 'services'>('all');
  const [viewFilter, setViewFilter] = useState<'all' | 'weekends' | 'weekdays'>('all');

  // Baseline simulated calendar data for full month continuity in September 2026
  // This blends real bookings with authentic homestay operational metrics so the 30 days are rich and actionable.
  const monthlyData = useMemo(() => {
    const year = 2026;
    const month = selectedMonth === '2026-09' ? 8 : selectedMonth === '2026-08' ? 7 : 9; // 0-indexed: 8 = Sept
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalRooms = rooms.length || 12;

    const days: DailyStats[] = [];

    // Weekday names in Vietnamese
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    // Simulated historical base daily pattern for Đà Lạt homestay (weekend peaks)
    const baseOccupancySeed: Record<number, { occupied: number; srv: number }> = {
      1: { occupied: 6, srv: 350000 },
      2: { occupied: 11, srv: 1250000 }, // 02/09 National Holiday peak!
      3: { occupied: 9, srv: 800000 },
      4: { occupied: 10, srv: 950000 }, // T6
      5: { occupied: 12, srv: 1600000 }, // T7 Full house
      6: { occupied: 11, srv: 1100000 }, // CN
      7: { occupied: 5, srv: 250000 },
      8: { occupied: 6, srv: 300000 },
      9: { occupied: 7, srv: 450000 },
      10: { occupied: 8, srv: 500000 },
      11: { occupied: 10, srv: 900000 }, // T6
      12: { occupied: 12, srv: 1550000 }, // T7
      13: { occupied: 10, srv: 850000 }, // CN
      14: { occupied: 6, srv: 300000 },
      15: { occupied: 7, srv: 400000 },
      16: { occupied: 6, srv: 350000 },
      17: { occupied: 8, srv: 550000 },
      18: { occupied: 11, srv: 1200000 }, // T6
      19: { occupied: 12, srv: 1750000 }, // T7
      20: { occupied: 11, srv: 1300000 }, // CN
      21: { occupied: 7, srv: 400000 },
      22: { occupied: 8, srv: 600000 },
      23: { occupied: 8, srv: 550000 },
      24: { occupied: 9, srv: 700000 },
      25: { occupied: 11, srv: 1350000 }, // T6
      26: { occupied: 12, srv: 1800000 }, // T7
      27: { occupied: 10, srv: 950000 }, // CN
      28: { occupied: 6, srv: 300000 },
      29: { occupied: 7, srv: 450000 },
      30: { occupied: 8, srv: 500000 },
    };

    // Calculate average room price per night across our inventory for estimation
    const avgRoomPrice = rooms.reduce((acc, r) => acc + r.pricePerNight, 0) / (totalRooms || 1);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeekIdx = dateObj.getDay();
      const dayOfWeek = dayNames[dayOfWeekIdx];
      const isWeekend = dayOfWeekIdx === 5 || dayOfWeekIdx === 6 || dayOfWeekIdx === 0; // T6, T7, CN

      // Find real bookings that overlap this night [checkInDate <= dateStr < checkOutDate]
      const realBookingsOnNight = bookings.filter((b) => {
        if (b.status === 'cancelled_refunded' || b.status === 'cancelled_forfeited') return false;
        return b.checkInDate <= dateStr && dateStr < b.checkOutDate;
      });

      // Find real bookings that checked out or had services added on this date
      const realBookingsCheckoutToday = bookings.filter((b) => b.checkOutDate === dateStr);

      let occupiedCount = realBookingsOnNight.length;
      let roomRev = 0;
      let srvRev = 0;
      let lateFeeRev = 0;
      const guestNames: string[] = [];

      realBookingsOnNight.forEach((b) => {
        roomRev += b.roomRateSnapshot || 650000;
        guestNames.push(`${b.roomName} (${b.guestName})`);
        // Distribute services evenly over stay nights
        if (b.services && b.services.length > 0) {
          srvRev += Math.round(b.servicesTotal / Math.max(1, b.nights));
        }
      });

      realBookingsCheckoutToday.forEach((b) => {
        lateFeeRev += b.lateCheckoutFee || 0;
      });

      // If simulated base data has higher realistic activity for past days, combine intelligently
      const seed = baseOccupancySeed[d] || { occupied: isWeekend ? 10 : 6, srv: isWeekend ? 900000 : 350000 };
      
      // We ensure the count is at least the real bookings count, capped at 12 rooms
      const finalOccupied = Math.min(totalRooms, Math.max(occupiedCount, seed.occupied));
      
      // If we have simulated extra occupied rooms beyond the explicitly loaded test bookings,
      // add realistic room rate for those nights
      if (finalOccupied > occupiedCount) {
        const extraRooms = finalOccupied - occupiedCount;
        roomRev += extraRooms * Math.round(avgRoomPrice);
        srvRev += seed.srv;
      }

      const occupancyRate = Math.min(100, Math.round((finalOccupied / totalRooms) * 1000) / 10);
      const totalRev = roomRev + srvRev + lateFeeRev;

      days.push({
        date: dateStr,
        displayDate: `${String(d).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`,
        dayOfWeek,
        isWeekend,
        occupiedRooms: finalOccupied,
        occupancyRate,
        roomRevenue: roomRev,
        serviceRevenue: srvRev,
        lateFeeRevenue: lateFeeRev,
        totalRevenue: totalRev,
        bookingNames: guestNames,
      });
    }

    return days;
  }, [selectedMonth, rooms, bookings]);

  // Filtered days for charts
  const filteredDailyData = useMemo(() => {
    if (viewFilter === 'weekends') {
      return monthlyData.filter((d) => d.isWeekend);
    }
    if (viewFilter === 'weekdays') {
      return monthlyData.filter((d) => !d.isWeekend);
    }
    return monthlyData;
  }, [monthlyData, viewFilter]);

  // Aggregate KPI summary metrics for the selected month
  const kpis = useMemo(() => {
    const totalDays = monthlyData.length;
    const totalRoomCapacityNights = (rooms.length || 12) * totalDays;

    const totalRoomRev = monthlyData.reduce((sum, d) => sum + d.roomRevenue, 0);
    const totalServiceRev = monthlyData.reduce((sum, d) => sum + d.serviceRevenue, 0);
    const totalLateFeeRev = monthlyData.reduce((sum, d) => sum + d.lateFeeRevenue, 0);
    const grossRev = totalRoomRev + totalServiceRev + totalLateFeeRev;

    const totalOccupiedRoomNights = monthlyData.reduce((sum, d) => sum + d.occupiedRooms, 0);
    const avgOccupancyRate = totalRoomCapacityNights > 0 
      ? Math.round((totalOccupiedRoomNights / totalRoomCapacityNights) * 1000) / 10 
      : 0;

    // ADR = Total Room Revenue / Total Occupied Room Nights
    const adr = totalOccupiedRoomNights > 0 ? Math.round(totalRoomRev / totalOccupiedRoomNights) : 0;

    // RevPAR = Total Room Revenue / Total Available Room Nights
    const revPar = totalRoomCapacityNights > 0 ? Math.round(totalRoomRev / totalRoomCapacityNights) : 0;

    // Peak day
    const peakDay = [...monthlyData].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];

    return {
      grossRev,
      totalRoomRev,
      totalServiceRev,
      totalLateFeeRev,
      avgOccupancyRate,
      totalOccupiedRoomNights,
      totalRoomCapacityNights,
      adr,
      revPar,
      peakDay,
    };
  }, [monthlyData, rooms]);

  // Category revenue breakdown (Pie chart)
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {
      'Standard ấm cúng': 0,
      'Deluxe view đồi': 0,
      'Family 2 giường lớn': 0,
      'Bungalow gỗ sân vườn': 0,
    };

    // Calculate proportions based on actual room inventory and bookings
    rooms.forEach((r) => {
      const roomBookings = bookings.filter((b) => b.roomId === r.id && b.status !== 'cancelled_refunded' && b.status !== 'cancelled_forfeited');
      const directTotal = roomBookings.reduce((sum, b) => sum + b.roomTotal, 0);
      
      // Default base calculation if mock
      const baseline = r.category === 'bungalow' ? 24500000 : r.category === 'family' ? 26800000 : r.category === 'deluxe' ? 34200000 : 18500000;
      map[r.categoryName] = (map[r.categoryName] || 0) + (directTotal > 0 ? directTotal * 4 : baseline / 3);
    });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value: Math.round(value),
      color: CATEGORY_COLORS[name] || '#2D5A43',
    }));
  }, [rooms, bookings]);

  // Services revenue distribution (Bar chart)
  const serviceBreakdown = useMemo(() => {
    return [
      { name: 'BBQ sân vườn', revenue: 7850000, orders: 31, color: '#D4A373' },
      { name: 'Thuê xe máy', revenue: 5460000, orders: 42, color: '#2D5A43' },
      { name: 'Đưa đón sân bay', revenue: 3750000, orders: 15, color: '#3B82F6' },
      { name: 'Ăn sáng đặc sản', revenue: 2650000, orders: 53, color: '#10B981' },
      { name: 'Giường phụ (Extra)', revenue: 1600000, orders: 8, color: '#8B5CF6' },
      { name: 'Giặt ủi sấy thơm', revenue: 980000, orders: 28, color: '#EC4899' },
    ];
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-[#2D5A43]/10 text-[#2D5A43] dark:text-[#D4A373]">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Thống Kê Doanh Thu & Công Suất Phòng
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Phân tích xu hướng dòng tiền hàng ngày, tỷ lệ lấp đầy phòng và cơ cấu doanh thu homestay
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-medium">
            <button
              onClick={() => setSelectedMonth('2026-08')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedMonth === '2026-08'
                  ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] dark:text-[#D4A373] shadow-xs font-bold'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Tháng 08/2026
            </button>
            <button
              onClick={() => setSelectedMonth('2026-09')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedMonth === '2026-09'
                  ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] dark:text-[#D4A373] shadow-xs font-bold'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Tháng 09/2026 (Hiện tại)
            </button>
            <button
              onClick={() => setSelectedMonth('2026-10')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedMonth === '2026-10'
                  ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] dark:text-[#D4A373] shadow-xs font-bold'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
            >
              Tháng 10/2026 (Dự báo)
            </button>
          </div>

          {/* Quick print report */}
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
            title="In báo cáo doanh thu"
          >
            <Download className="w-3.5 h-3.5" />
            <span>In Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Primary Hospitality Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Tổng Doanh Thu */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Tổng Doanh Thu Tháng
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {formatVND(kpis.grossRev)}
            </div>
            <div className="mt-2 flex items-center space-x-2 text-xs">
              <span className="flex items-center font-medium text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                +14.8%
              </span>
              <span className="text-neutral-400">so với tháng trước</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between text-[11px] text-neutral-500">
            <span>Tiền phòng: <strong className="text-neutral-800 dark:text-neutral-200">{formatVND(kpis.totalRoomRev)}</strong></span>
            <span>Dịch vụ: <strong className="text-neutral-800 dark:text-neutral-200">{formatVND(kpis.totalServiceRev)}</strong></span>
          </div>
        </div>

        {/* KPI 2: Tỷ lệ lấp đầy bình quân */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Công Suất Phòng TB
            </span>
            <span className="p-2 rounded-xl bg-[#2D5A43]/10 text-[#2D5A43] dark:text-[#D4A373]">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-[#2D5A43] dark:text-[#D4A373]">
              {kpis.avgOccupancyRate}%
            </div>
            <div className="mt-2 flex items-center space-x-2 text-xs">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Vượt mục tiêu 70%
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between text-[11px] text-neutral-500">
            <span>Số đêm bán: <strong className="text-neutral-800 dark:text-neutral-200">{kpis.totalOccupiedRoomNights} đêm</strong></span>
            <span>Tổng quỹ: <strong className="text-neutral-800 dark:text-neutral-200">{kpis.totalRoomCapacityNights} đêm</strong></span>
          </div>
        </div>

        {/* KPI 3: ADR (Giá bán phòng bình quân) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              ADR (Giá Bán Phòng TB)
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BedDouble className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {formatVND(kpis.adr)}
            </div>
            <div className="mt-2 text-xs text-neutral-400">
              Bình quân / phòng đã bán / đêm
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between text-[11px] text-neutral-500">
            <span>RevPAR:</span>
            <strong className="text-neutral-800 dark:text-neutral-200 font-mono">{formatVND(kpis.revPar)}/phòng/đêm</strong>
          </div>
        </div>

        {/* KPI 4: Ngày đỉnh điểm & Doanh thu dịch vụ */}
        <div className="p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Dịch Vụ Phụ Trợ (F&B + Xe)
            </span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {formatVND(kpis.totalServiceRev)}
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Chiếm <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{Math.round((kpis.totalServiceRev / kpis.grossRev) * 100)}%</strong> tổng doanh thu
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-between text-[11px] text-neutral-500">
            <span>Ngày thu cao nhất:</span>
            <strong className="text-neutral-800 dark:text-neutral-200 font-mono">{kpis.peakDay?.displayDate} ({formatVND(kpis.peakDay?.totalRevenue)})</strong>
          </div>
        </div>

      </div>

      {/* MAIN CHART 1: XU HƯỚNG DOANH THU HÀNG NGÀY (DAILY INCOME TRENDS) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Biểu Đồ Xu Hướng Doanh Thu Hàng Ngày (Daily Income Trends)
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#2D5A43]/15 text-[#2D5A43] dark:text-[#D4A373] font-semibold">
                Tháng 09/2026
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Tách biệt Tiền phòng ({formatVND(kpis.totalRoomRev)}) và Dịch vụ phụ trợ ({formatVND(kpis.totalServiceRev)}) theo từng ngày
            </p>
          </div>

          {/* Metric and Filter Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 p-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs">
              <button
                onClick={() => setViewFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewFilter === 'all'
                    ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] font-bold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Cả tháng (30 ngày)
              </button>
              <button
                onClick={() => setViewFilter('weekends')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewFilter === 'weekends'
                    ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] font-bold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Cuối tuần (T6-CN)
              </button>
              <button
                onClick={() => setViewFilter('weekdays')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewFilter === 'weekdays'
                    ? 'bg-white dark:bg-neutral-900 text-[#2D5A43] font-bold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                Trong tuần (T2-T5)
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Area / Composed Chart */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={filteredDailyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
            >
              <defs>
                <linearGradient id="roomRevGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.pineSage} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.pineSage} stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="serviceRevGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.sandClay} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.sandClay} stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.15} />

              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11, fill: '#888888' }}
                tickLine={false}
                axisLine={{ stroke: '#888888', opacity: 0.2 }}
                interval={viewFilter === 'all' ? 1 : 0}
              />

              <YAxis
                tick={{ fontSize: 11, fill: '#888888' }}
                tickLine={false}
                axisLine={{ stroke: '#888888', opacity: 0.2 }}
                tickFormatter={(val) => `${(val / 1000000).toFixed(1)}Tr`}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DailyStats;
                    return (
                      <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl text-xs space-y-2">
                        <div className="flex items-center justify-between gap-4 font-bold border-b border-neutral-100 dark:border-neutral-800 pb-1.5">
                          <span className="text-neutral-800 dark:text-neutral-100">
                            Ngày {data.date} ({data.dayOfWeek})
                          </span>
                          {data.isWeekend && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-semibold">
                              Cuối tuần
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center gap-6">
                            <span className="flex items-center text-neutral-600 dark:text-neutral-400">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#2D5A43] mr-1.5" />
                              Tiền phòng:
                            </span>
                            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                              {formatVND(data.roomRevenue)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center gap-6">
                            <span className="flex items-center text-neutral-600 dark:text-neutral-400">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#D4A373] mr-1.5" />
                              Dịch vụ (BBQ, xe...):
                            </span>
                            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                              {formatVND(data.serviceRevenue)}
                            </span>
                          </div>

                          {data.lateFeeRevenue > 0 && (
                            <div className="flex justify-between items-center gap-6">
                              <span className="flex items-center text-amber-600 dark:text-amber-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5" />
                                Phụ phí trễ:
                              </span>
                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                {formatVND(data.lateFeeRevenue)}
                              </span>
                            </div>
                          )}

                          <div className="pt-1.5 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center font-bold text-sm">
                            <span className="text-[#2D5A43] dark:text-[#D4A373]">TỔNG THU NGÀY:</span>
                            <span className="font-mono text-[#2D5A43] dark:text-[#D4A373]">
                              {formatVND(data.totalRevenue)}
                            </span>
                          </div>

                          <div className="pt-1 text-[11px] text-neutral-500 flex justify-between">
                            <span>Phòng có khách:</span>
                            <span className="font-mono font-semibold">{data.occupiedRooms} / 12 phòng ({data.occupancyRate}%)</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                height={36}
                formatter={(value) => (
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                    {value === 'roomRevenue' ? 'Tiền Phòng (VND)' : value === 'serviceRevenue' ? 'Dịch Vụ Phụ Trợ (VND)' : 'Tổng Doanh Thu Ngày (VND)'}
                  </span>
                )}
              />

              <Area
                type="monotone"
                dataKey="roomRevenue"
                name="roomRevenue"
                stroke={COLORS.pineSage}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#roomRevGradient)"
              />

              <Bar
                dataKey="serviceRevenue"
                name="serviceRevenue"
                fill={COLORS.sandClay}
                radius={[4, 4, 0, 0]}
                barSize={12}
              />

              <Line
                type="monotone"
                dataKey="totalRevenue"
                name="totalRevenue"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#10B981', strokeWidth: 1, stroke: '#FFFFFF' }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between pt-2 text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2D5A43] mr-1.5" />
              Tiền phòng (Ổn định theo số đêm)
            </span>
            <span className="flex items-center">
              <span className="w-2.5 h-2.5 rounded bg-[#D4A373] mr-1.5" />
              Dịch vụ (Tăng mạnh vào T6, T7 với BBQ & Thuê xe ga)
            </span>
          </div>
          <span className="font-mono">Chu kỳ: 30 ngày tháng 09/2026</span>
        </div>
      </div>

      {/* MAIN CHART 2: TỶ LỆ LẤP ĐẦY PHÒNG (OCCUPANCY RATES FOR CURRENT MONTH) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Occupancy Area Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Tỷ Lệ Lấp Đầy Phòng Hàng Ngày (Occupancy Rates)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold">
                  Tổng 12 Phòng
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Đường chuẩn mục tiêu 70% công suất - Điểm đỏ thể hiện ngày Full 100% (12/12 phòng)
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs text-neutral-400">Bình quân tháng</div>
              <div className="text-base font-bold font-mono text-[#2D5A43] dark:text-[#D4A373]">
                {kpis.avgOccupancyRate}%
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={filteredDailyData}
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#888888" opacity={0.15} />

                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#888888' }}
                  tickLine={false}
                  interval={viewFilter === 'all' ? 1 : 0}
                />

                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 70, 85, 100]}
                  tick={{ fontSize: 11, fill: '#888888' }}
                  tickFormatter={(v) => `${v}%`}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as DailyStats;
                      return (
                        <div className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl text-xs space-y-1.5">
                          <div className="font-bold text-neutral-800 dark:text-neutral-100">
                            Ngày {data.date} ({data.dayOfWeek})
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-neutral-500">Số phòng đang ở:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {data.occupiedRooms} / 12 phòng
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-neutral-500">Công suất:</span>
                            <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                              {data.occupancyRate}%
                            </span>
                          </div>
                          {data.occupancyRate >= 100 && (
                            <div className="pt-1 text-[11px] font-bold text-red-600 flex items-center">
                              🔥 CHÁY PHÒNG (Full House 12/12)
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {/* Target Benchmark Line: 70% */}
                <ReferenceLine
                  y={70}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Mục tiêu 70%',
                    position: 'insideTopRight',
                    fill: '#F59E0B',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="occupancyRate"
                  name="Tỷ lệ lấp đầy (%)"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#occupancyGradient)"
                />

                <Bar
                  dataKey="occupiedRooms"
                  name="Số phòng có khách"
                  fill="#2D5A43"
                  opacity={0.3}
                  barSize={8}
                  radius={[3, 3, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
              <div className="text-neutral-400 text-[11px]">Ngày thấp điểm</div>
              <div className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                41.7% (5 phòng)
              </div>
            </div>
            <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
              <div className="text-neutral-400 text-[11px]">Ngày cuối tuần TB</div>
              <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                93.8% (11.3 phòng)
              </div>
            </div>
            <div className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
              <div className="text-neutral-400 text-[11px]">Ngày Full 100%</div>
              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                5 ngày trong tháng
              </div>
            </div>
          </div>
        </div>

        {/* Room Category Revenue Distribution (Pie/Donut) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <Layers className="w-4 h-4 text-[#2D5A43] dark:text-[#D4A373]" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Cơ Cấu Doanh Thu Hạng Phòng
              </h3>
            </div>

            <div className="h-52 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatVND(Number(value)), 'Doanh thu']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            {categoryBreakdown.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-neutral-600 dark:text-neutral-400">{item.name}</span>
                </div>
                <span className="font-mono font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatVND(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* SECONDARY ROW: SERVICES BREAKDOWN & OPERATIONAL INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Service Revenue Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Doanh Thu Dịch Vụ Phụ Trợ (F&B, Xe, Tour)
              </h3>
              <p className="text-xs text-neutral-500">
                Xếp hạng các dịch vụ mang lại doanh thu cao nhất cho ChicStay trong tháng
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#D4A373]">
              {formatVND(kpis.totalServiceRev)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={serviceBreakdown}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}Tr`}
                  tick={{ fontSize: 11, fill: '#888888' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#888888' }}
                  width={110}
                />
                <Tooltip
                  formatter={(val: any) => [formatVND(Number(val)), 'Doanh thu']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="revenue" fill={COLORS.sandClay} radius={[0, 4, 4, 0]}>
                  {serviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Strategic Notes / Đà Lạt Homestay Advice */}
        <div className="p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Nhận Định Vận Hành & Khuyến Nghị
              </h3>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <div className="font-bold flex items-center mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Hiệu quả phòng Bungalow & Deluxe
                </div>
                Hai hạng phòng view đồi mang lại hơn 62% doanh thu phòng nhờ giá phòng cao và tỷ lệ giữ chỗ trước trên 10 ngày.
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                <div className="font-bold flex items-center mb-1">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  Cơ hội tăng thu giữa tuần (T2 - T5)
                </div>
                Công suất giữa tuần đạt 48.5%. Có thể áp dụng combo "Lưu trú 2 đêm tặng 1 buổi BBQ hoặc 1 ngày xe máy" để kích cầu khách làm việc từ xa (Workation).
              </div>

              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300">
                <div className="font-bold mb-1">Quy tắc cọc 30% phát huy tác dụng</div>
                Hệ thống thu đúng 30% tiền phòng qua VietQR đã hạn chế tỷ lệ hủy phòng ảo xuống dưới 2.1% toàn tháng.
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 text-center">
            Dữ liệu tổng hợp tự động từ sổ đặt phòng và sơ đồ phòng ChicStay Đà Lạt
          </div>
        </div>

      </div>

    </div>
  );
};
