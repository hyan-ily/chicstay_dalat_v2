import { Room, Booking, Customer } from '../types';
import { INITIAL_ROOMS, INITIAL_BOOKINGS, INITIAL_CUSTOMERS } from '../data/masterData';

const STORAGE_KEYS = {
  ROOMS: 'chicstay_rooms_v1',
  BOOKINGS: 'chicstay_bookings_v1',
  CUSTOMERS: 'chicstay_customers_v1',
  THEME: 'chicstay_theme_v1',
  ACTIVE_TAB: 'chicstay_active_tab_v1',
};

export function loadStoredRooms(): Room[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROOMS);
    if (!raw) {
      saveStoredRooms(INITIAL_ROOMS);
      return INITIAL_ROOMS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading rooms from localStorage', e);
    return INITIAL_ROOMS;
  }
}

export function saveStoredRooms(rooms: Room[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  } catch (e) {
    console.error('Error saving rooms to localStorage', e);
  }
}

export function loadStoredBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!raw) {
      saveStoredBookings(INITIAL_BOOKINGS);
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading bookings from localStorage', e);
    return INITIAL_BOOKINGS;
  }
}

export function saveStoredBookings(bookings: Booking[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  } catch (e) {
    console.error('Error saving bookings to localStorage', e);
  }
}

export function loadStoredCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) {
      saveStoredCustomers(INITIAL_CUSTOMERS);
      return INITIAL_CUSTOMERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading customers from localStorage', e);
    return INITIAL_CUSTOMERS;
  }
}

export function saveStoredCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (e) {
    console.error('Error saving customers to localStorage', e);
  }
}

export function resetToDefaultData(): { rooms: Room[]; bookings: Booking[]; customers: Customer[] } {
  localStorage.removeItem(STORAGE_KEYS.ROOMS);
  localStorage.removeItem(STORAGE_KEYS.BOOKINGS);
  localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
  saveStoredRooms(INITIAL_ROOMS);
  saveStoredBookings(INITIAL_BOOKINGS);
  saveStoredCustomers(INITIAL_CUSTOMERS);
  return {
    rooms: INITIAL_ROOMS,
    bookings: INITIAL_BOOKINGS,
    customers: INITIAL_CUSTOMERS,
  };
}
