import React, { useState, useEffect } from 'react';
import { Room, Booking, Customer, Service, BookingServiceItem } from './types';
import { 
  loadStoredRooms, 
  saveStoredRooms, 
  loadStoredBookings, 
  saveStoredBookings, 
  loadStoredCustomers, 
  saveStoredCustomers, 
  resetToDefaultData 
} from './utils/storage';
import { INITIAL_SERVICES } from './data/masterData';
import { evaluateCancellationPolicy } from './utils/calculations';
import { downloadStandaloneHtml } from './utils/exportHtml';

import { Header } from './components/Header';
import { RoomRack } from './components/RoomRack';
import { CustomerPortal } from './components/CustomerPortal';
import { CheckOutModal } from './components/CheckOutModal';
import { AddServiceModal } from './components/AddServiceModal';
import { WalkInModal } from './components/WalkInModal';
import { CrmView } from './components/CrmView';
import { ChicStayBot } from './components/ChicStayBot';
import { Dashboard } from './components/Dashboard';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('chicstay_theme') === 'dark';
  });

  // Active module navigation: 'customer' | 'receptionist' | 'dashboard' | 'crm' | 'chat'
  const [activeTab, setActiveTab] = useState<'receptionist' | 'customer' | 'dashboard' | 'crm' | 'chat'>(
    'receptionist'
  );

  // Core Data States
  const [rooms, setRooms] = useState<Room[]>(() => loadStoredRooms());
  const [bookings, setBookings] = useState<Booking[]>(() => loadStoredBookings());
  const [customers, setCustomers] = useState<Customer[]>(() => loadStoredCustomers());
  const services: Service[] = INITIAL_SERVICES;

  // Modals
  const [checkoutData, setCheckoutData] = useState<{ booking: Booking; room: Room } | null>(null);
  const [addServiceData, setAddServiceData] = useState<{ booking: Booking; room: Room } | null>(null);
  const [walkInData, setWalkInData] = useState<Room | null>(null);

  // Sync to local storage
  useEffect(() => {
    saveStoredRooms(rooms);
  }, [rooms]);

  useEffect(() => {
    saveStoredBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    saveStoredCustomers(customers);
  }, [customers]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('chicstay_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('chicstay_theme', 'light');
    }
  }, [isDark]);

  // Receptionist Actions
  const handleCheckIn = (bookingId: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    
    // 1. Update Booking
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'in_house', checkedInAt: nowStr } : b))
    );

    // 2. Update Room
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (targetBooking) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === targetBooking.roomId
            ? { ...r, status: 'in_house', currentBookingId: targetBooking.id }
            : r
        )
      );
    }
  };

  const handleMarkCleaned = (roomId: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, status: 'available', currentBookingId: undefined } : r))
    );
  };

  const handleCompleteCheckOut = (
    bookingId: string,
    lateHours: number,
    lateFee: number,
    finalBalance: number
  ) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;

    const gross = target.roomTotal + target.servicesTotal + lateFee;

    // 1. Mark booking completed
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              lateCheckoutHours: lateHours,
              lateCheckoutFee: lateFee,
              totalAmount: gross,
              balanceDue: 0,
              status: 'completed',
              checkedOutAt: nowStr,
            }
          : b
      )
    );

    // 2. Transition Room: in_house -> cleaning (Tạm khóa / Chờ dọn)
    setRooms((prev) =>
      prev.map((r) => (r.id === target.roomId ? { ...r, status: 'cleaning' } : r))
    );

    // 3. Update or increment CRM stats for this customer
    setCustomers((prev) => {
      const existing = prev.find((c) => c.phone.replace(/\s+/g, '') === target.guestPhone.replace(/\s+/g, ''));
      if (existing) {
        const newTotalSpend = existing.totalSpend + gross;
        const newStays = existing.staysCount + 1;
        const tier = newTotalSpend >= 5000000 ? 'VIP' : newStays >= 2 ? 'Thân thiết' : 'Mới';
        return prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                totalSpend: newTotalSpend,
                staysCount: newStays,
                lastStayDate: target.checkOutDate,
                tier,
              }
            : c
        );
      } else {
        const tier = gross >= 5000000 ? 'VIP' : 'Mới';
        const newCust: Customer = {
          id: `CUST-${Date.now().toString().slice(-4)}`,
          name: target.guestName,
          phone: target.guestPhone,
          email: target.guestEmail,
          totalSpend: gross,
          staysCount: 1,
          lastStayDate: target.checkOutDate,
          tier,
        };
        return [newCust, ...prev];
      }
    });

    setCheckoutData(null);
  };

  const handleAddService = (bookingId: string, item: BookingServiceItem) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const updatedServices = [...b.services, item];
        const newServicesTotal = updatedServices.reduce(
          (sum, s) => sum + s.priceSnapshot * s.quantity,
          0
        );
        const gross = b.roomTotal + newServicesTotal + b.lateCheckoutFee;
        const newBalance = Math.max(0, gross - b.depositPaid);
        return {
          ...b,
          services: updatedServices,
          servicesTotal: newServicesTotal,
          totalAmount: gross,
          balanceDue: newBalance,
        };
      })
    );
  };

  const handleAddBooking = (newBooking: Booking, newCustomer: Customer) => {
    // Add booking
    setBookings((prev) => [newBooking, ...prev]);

    // If booking is confirmed or in_house, update the room's status & pointer
    if (newBooking.status === 'confirmed') {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === newBooking.roomId
            ? { ...r, status: 'booked', currentBookingId: newBooking.id }
            : r
        )
      );
    } else if (newBooking.status === 'in_house') {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === newBooking.roomId
            ? { ...r, status: 'in_house', currentBookingId: newBooking.id }
            : r
        )
      );
    }

    // Add / Update CRM
    setCustomers((prev) => {
      const existing = prev.find(
        (c) => c.phone.replace(/\s+/g, '') === newCustomer.phone.replace(/\s+/g, '')
      );
      if (existing) {
        return prev.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                totalSpend: c.totalSpend + newBooking.depositPaid,
                staysCount: c.staysCount + 1,
                lastStayDate: newBooking.checkInDate,
              }
            : c
        );
      } else {
        return [newCustomer, ...prev];
      }
    });
  };

  const handleCancelBooking = (bookingId: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;

    const policy = evaluateCancellationPolicy(target.checkInDate);
    const newStatus = policy.isEligibleForRefund ? 'cancelled_refunded' : 'cancelled_forfeited';

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: newStatus,
              cancellationNotice: policy.statusBadge,
            }
          : b
      )
    );

    // If room currently linked to this booking, release to available
    setRooms((prev) =>
      prev.map((r) =>
        r.id === target.roomId && r.currentBookingId === target.id
          ? { ...r, status: 'available', currentBookingId: undefined }
          : r
      )
    );
  };

  const handleResetData = () => {
    const res = resetToDefaultData();
    setRooms(res.rooms);
    setBookings(res.bookings);
    setCustomers(res.customers);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F0] dark:bg-[#0F172A] text-neutral-900 dark:text-neutral-100 transition-colors duration-200">
      
      {/* Header with Navigation and System Controls */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        setIsDark={setIsDark}
        onResetData={handleResetData}
        onExportHtml={downloadStandaloneHtml}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Module 1: Room Rack (Lễ tân & Quản lý) */}
        {activeTab === 'receptionist' && (
          <RoomRack
            rooms={rooms}
            bookings={bookings}
            services={services}
            onCheckIn={handleCheckIn}
            onOpenCheckOut={(b, r) => setCheckoutData({ booking: b, room: r })}
            onOpenAddService={(b, r) => setAddServiceData({ booking: b, room: r })}
            onMarkCleaned={handleMarkCleaned}
            onOpenWalkIn={(r) => setWalkInData(r)}
          />
        )}

        {/* Module: Dashboard Revenue & Occupancy Analytics */}
        {activeTab === 'dashboard' && (
          <Dashboard
            rooms={rooms}
            bookings={bookings}
            services={services}
          />
        )}

        {/* Module 2: Customer Portal (Cổng Khách Hàng) */}
        {activeTab === 'customer' && (
          <CustomerPortal
            rooms={rooms}
            services={services}
            bookings={bookings}
            onAddBooking={handleAddBooking}
            onCancelBooking={handleCancelBooking}
          />
        )}

        {/* Module 3: CRM Customer Management */}
        {activeTab === 'crm' && (
          <CrmView customers={customers} bookings={bookings} />
        )}

        {/* Module 4: Chatbot FAQ & State lookup */}
        {activeTab === 'chat' && (
          <ChicStayBot rooms={rooms} bookings={bookings} services={services} />
        )}

      </main>

      {/* Footer */}
      <footer className="no-print border-t border-neutral-200 dark:border-neutral-800/80 bg-white/50 dark:bg-neutral-900/50 py-4 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-[#2D5A43] dark:text-[#D4A373]">ChicStay Đà Lạt MIS</span>
            <span>·</span>
            <span>Phiên bản Quản lý Trạm Cục bộ (Local Station Web App)</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>Chống mỏi mắt WCAG AAA</span>
            <span>·</span>
            <span>Lưu trữ LocalStorage độc lập</span>
            <span>·</span>
            <button
              onClick={downloadStandaloneHtml}
              className="hover:text-[#2D5A43] dark:hover:text-[#D4A373] underline font-medium cursor-pointer"
            >
              Tải file index.html offline
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Check-out Settlement Modal */}
      {checkoutData && (
        <CheckOutModal
          booking={checkoutData.booking}
          room={checkoutData.room}
          onClose={() => setCheckoutData(null)}
          onCompleteCheckOut={handleCompleteCheckOut}
        />
      )}

      {/* MODAL 2: Add In-House Service Modal */}
      {addServiceData && (
        <AddServiceModal
          booking={addServiceData.booking}
          room={addServiceData.room}
          services={services}
          onClose={() => setAddServiceData(null)}
          onAddService={handleAddService}
        />
      )}

      {/* MODAL 3: Walk-in Reception Check-in Modal */}
      {walkInData && (
        <WalkInModal
          room={walkInData}
          onClose={() => setWalkInData(null)}
          onConfirmWalkIn={(booking, customer) => {
            handleAddBooking(booking, customer);
          }}
        />
      )}

    </div>
  );
}
