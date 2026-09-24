export type RoomStatus = 'available' | 'booked' | 'in_house' | 'cleaning';

export type RoomCategory = 'standard' | 'deluxe' | 'family' | 'bungalow';

export interface Room {
  id: string; // P101, BG01, etc.
  name: string;
  category: RoomCategory;
  categoryName: string;
  capacity: number;
  pricePerNight: number;
  floor: string;
  bedDescription: string;
  viewDescription: string;
  status: RoomStatus;
  currentBookingId?: string;
}

export interface Service {
  id: string; // D001 - D009
  name: string;
  price: number;
  unit: string;
  description: string;
  iconName: string;
}

export interface BookingServiceItem {
  serviceId: string;
  serviceName: string;
  priceSnapshot: number;
  unit: string;
  quantity: number;
  addedAt: string;
  note?: string;
}

export type BookingStatus = 
  | 'pending_deposit' 
  | 'confirmed' 
  | 'in_house' 
  | 'completed' 
  | 'cancelled_refunded' 
  | 'cancelled_forfeited';

export interface Booking {
  id: string; // e.g. CS-202609-101
  roomId: string;
  roomName: string;
  roomCategoryName: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  nights: number;
  guestCount: number;
  roomRateSnapshot: number;
  roomTotal: number;
  depositRequired: number; // 30% of roomTotal (rounded to 1000 VNĐ)
  depositPaid: number;
  services: BookingServiceItem[];
  servicesTotal: number;
  lateCheckoutHours: number;
  lateCheckoutFee: number;
  totalAmount: number; // roomTotal + servicesTotal + lateCheckoutFee
  balanceDue: number; // totalAmount - depositPaid
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  cancellationNotice?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  totalSpend: number;
  staysCount: number;
  lastStayDate: string;
  tier: 'VIP' | 'Thân thiết' | 'Mới';
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  quickActions?: { label: string; action: string }[];
}
