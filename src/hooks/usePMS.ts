import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { socket } from '../utils/socket';
import type { Room, Booking, FolioExtraItem, BookingPayment, HousekeepingStatus } from '../types';

export function usePMS() {
  const queryClient = useQueryClient();

  // Socket.io real-time subscriptions
  useEffect(() => {
    const handleRoomStatus = () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    };
    const handleBookingUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    };

    socket.on('roomStatusChanged', handleRoomStatus);
    socket.on('bookingCreated', handleBookingUpdate);
    socket.on('bookingUpdated', handleBookingUpdate);
    socket.on('bookingDeleted', handleBookingUpdate);

    return () => {
      socket.off('roomStatusChanged', handleRoomStatus);
      socket.off('bookingCreated', handleBookingUpdate);
      socket.off('bookingUpdated', handleBookingUpdate);
      socket.off('bookingDeleted', handleBookingUpdate);
    };
  }, [queryClient]);

  // ---- ROOMS ----
  const roomsQuery = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: async () => (await apiClient.get('rooms')).data,
  });

  const updateRoomMut = useMutation({
    mutationFn: async (updatedRoom: Partial<Room> & { id: string }) => 
      (await apiClient.put(`rooms/${updatedRoom.id}`, updatedRoom)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const updateHousekeepingMut = useMutation({
    mutationFn: async ({ roomId, status }: { roomId: string; status: HousekeepingStatus }) => 
      (await apiClient.put(`rooms/${roomId}/housekeeping`, { status })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  // ---- BOOKINGS ----
  const bookingsQuery = useQuery<Booking[]>({
    queryKey: ['bookings'],
    queryFn: async () => (await apiClient.get('rooms/reservations')).data,
  });

  const createBookingMut = useMutation({
    mutationFn: async (newBooking: Partial<Booking>) => 
      (await apiClient.post('rooms/reservations', newBooking)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const updateBookingMut = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Booking> & { id: string }) => 
      (await apiClient.put(`rooms/reservations/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const deleteBookingMut = useMutation({
    mutationFn: async (id: string) => 
      (await apiClient.delete(`rooms/reservations/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const checkInGuestMut = useMutation({
    mutationFn: async (bookingId: string) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return (await apiClient.put(`rooms/reservations/${bookingId}`, {
        status: 'checked_in',
        checkInTime: timeStr,
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const checkOutGuestMut = useMutation({
    mutationFn: async (bookingId: string) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return (await apiClient.put(`rooms/reservations/${bookingId}`, {
        status: 'checked_out',
        checkOutTime: timeStr,
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const cancelBookingMut = useMutation({
    mutationFn: async (bookingId: string) => 
      (await apiClient.put(`rooms/reservations/${bookingId}`, { status: 'cancelled' })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  const addFolioChargeMut = useMutation({
    mutationFn: async ({ bookingId, charge }: { bookingId: string; charge: Partial<FolioExtraItem> }) => 
      (await apiClient.post(`rooms/reservations/${bookingId}/folio`, charge)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const removeFolioChargeMut = useMutation({
    mutationFn: async ({ bookingId, folioId }: { bookingId: string; folioId: string }) => 
      (await apiClient.delete(`rooms/reservations/${bookingId}/folio/${folioId}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const addBookingPaymentMut = useMutation({
    mutationFn: async ({ bookingId, payment }: { bookingId: string; payment: Partial<BookingPayment> }) => 
      (await apiClient.post(`rooms/reservations/${bookingId}/payments`, payment)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  return {
    rooms: roomsQuery.data ?? [],
    isLoadingRooms: roomsQuery.isLoading,
    updateRoom: updateRoomMut.mutate,
    updateRoomAsync: updateRoomMut.mutateAsync,
    updateHousekeepingStatus: (roomId: string, status: HousekeepingStatus) => 
      updateHousekeepingMut.mutate({ roomId, status }),
    
    bookings: bookingsQuery.data ?? [],
    isLoadingBookings: bookingsQuery.isLoading,
    createBooking: createBookingMut.mutate,
    createBookingAsync: createBookingMut.mutateAsync,
    updateBooking: updateBookingMut.mutate,
    updateBookingAsync: updateBookingMut.mutateAsync,
    deleteBooking: deleteBookingMut.mutate,
    deleteBookingAsync: deleteBookingMut.mutateAsync,
    checkInGuest: (id: string) => checkInGuestMut.mutate(id),
    checkOutGuest: (id: string) => checkOutGuestMut.mutate(id),
    cancelBooking: (id: string) => cancelBookingMut.mutate(id),
    
    addFolioCharge: (bookingId: string, charge: Partial<FolioExtraItem>) => 
      addFolioChargeMut.mutate({ bookingId, charge }),
    removeFolioItem: (bookingId: string, folioId: string) => 
      removeFolioChargeMut.mutate({ bookingId, folioId }),
    addBookingPayment: (bookingId: string, payment: Partial<BookingPayment>) => 
      addBookingPaymentMut.mutate({ bookingId, payment }),
  };
}
