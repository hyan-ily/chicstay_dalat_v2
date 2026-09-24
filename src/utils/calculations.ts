import { Booking } from '../types';

/**
 * Format currency VND with standard thousands separator
 */
export function formatVND(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate the number of nights between two date strings (YYYY-MM-DD)
 */
export function calculateNights(checkInDate: string, checkOutDate: string): number {
  if (!checkInDate || !checkOutDate) return 1;
  const inDate = new Date(checkInDate + 'T00:00:00');
  const outDate = new Date(checkOutDate + 'T00:00:00');
  const diffTime = outDate.getTime() - inDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
}

/**
 * Business Rule #4:
 * Tiền cọc bắt buộc = Đúng 30% Tiền phòng (TUYỆT ĐỐI KHÔNG tính tiền dịch vụ vào tiền cọc).
 * Làm tròn đến 1.000 VNĐ.
 */
export function calculateDeposit(roomTotal: number): number {
  if (roomTotal <= 0) return 0;
  const rawDeposit = roomTotal * 0.3;
  return Math.round(rawDeposit / 1000) * 1000;
}

/**
 * Business Rule #6:
 * Trả phòng sau 12:00: Phụ thu 100.000đ/giờ (làm tròn lên theo giờ, ví dụ trễ 15 phút tính 1 giờ).
 */
export function calculateLateCheckoutFee(hoursLate: number): number {
  if (hoursLate <= 0) return 0;
  const roundedHours = Math.ceil(hoursLate);
  return roundedHours * 100000;
}

/**
 * Business Rule #7:
 * Quyết toán: Số tiền còn phải thu = (Tiền phòng + Tiền dịch vụ + Phụ phí trễ) - Tiền đã cọc.
 */
export function calculateBalanceDue(
  roomTotal: number,
  servicesTotal: number,
  lateFee: number,
  depositPaid: number
): number {
  const gross = roomTotal + servicesTotal + lateFee;
  return Math.max(0, gross - depositPaid);
}

/**
 * Business Rule #2: Anti-overbooking
 * Một phòng không được có 2 đơn giao thoa khoảng ngày [Check-in, Check-out).
 * Interval [A, B) intersects [C, D) iff max(A, C) < min(B, D)
 */
export function checkOverbooking(
  roomId: string,
  newCheckIn: string,
  newCheckOut: string,
  existingBookings: Booking[],
  excludeBookingId?: string
): { hasConflict: boolean; conflictingBooking?: Booking } {
  const activeBookings = existingBookings.filter(
    (b) =>
      b.roomId === roomId &&
      (b.status === 'confirmed' || b.status === 'in_house' || b.status === 'pending_deposit') &&
      b.id !== excludeBookingId
  );

  const newStart = new Date(newCheckIn + 'T14:00:00').getTime();
  const newEnd = new Date(newCheckOut + 'T12:00:00').getTime();

  for (const b of activeBookings) {
    const existingStart = new Date(b.checkInDate + 'T14:00:00').getTime();
    const existingEnd = new Date(b.checkOutDate + 'T12:00:00').getTime();

    // Check overlap of intervals [existingStart, existingEnd) and [newStart, newEnd)
    if (Math.max(newStart, existingStart) < Math.min(newEnd, existingEnd)) {
      return { hasConflict: true, conflictingBooking: b };
    }
  }

  return { hasConflict: false };
}

/**
 * Business Rule #8:
 * Chính sách hủy: Hủy trước giờ nhận >= 48h được đánh dấu "Hoàn cọc thủ công"; hủy < 48h báo "Mất cọc".
 */
export function evaluateCancellationPolicy(
  checkInDate: string,
  customNow?: Date
): {
  isEligibleForRefund: boolean;
  hoursRemaining: number;
  policyMessage: string;
  statusBadge: 'Hoàn cọc thủ công' | 'Mất cọc';
} {
  const now = customNow || new Date();
  // Homestay standard check-in is 14:00
  const checkInDateTime = new Date(`${checkInDate}T14:00:00`);
  const diffHours = (checkInDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours >= 48) {
    return {
      isEligibleForRefund: true,
      hoursRemaining: Math.round(diffHours),
      statusBadge: 'Hoàn cọc thủ công',
      policyMessage: `Thời gian hủy trước giờ nhận là ${Math.round(
        diffHours
      )} giờ (>= 48h). Khách đủ điều kiện hoàn 100% tiền cọc. Bộ phận lễ tân/kế toán sẽ xử lý hoàn cọc thủ công vào số tài khoản của khách.`,
    };
  } else {
    return {
      isEligibleForRefund: false,
      hoursRemaining: Math.max(0, Math.round(diffHours)),
      statusBadge: 'Mất cọc',
      policyMessage: `Thời gian hủy trước giờ nhận là ${Math.max(
        0,
        Math.round(diffHours)
      )} giờ (< 48h). Theo quy chế ChicStay Đà Lạt, khách không được hoàn tiền cọc (Mất cọc) do đơn hủy sát ngày nhận.`,
    };
  }
}
