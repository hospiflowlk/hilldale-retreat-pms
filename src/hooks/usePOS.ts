import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { socket } from '../utils/socket';
import type { Order, WalkInSession } from '../types';

export function usePOS() {
  const queryClient = useQueryClient();

  // Socket.io real-time subscriptions
  useEffect(() => {
    const handleOrderChange = () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['masters', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    };
    const handleWalkInChange = () => {
      queryClient.invalidateQueries({ queryKey: ['walk-ins'] });
    };

    socket.on('orderCreated', handleOrderChange);
    socket.on('orderUpdated', handleOrderChange);
    socket.on('orderDeleted', handleOrderChange);
    socket.on('walkInCreated', handleWalkInChange);
    socket.on('walkInUpdated', handleWalkInChange);

    return () => {
      socket.off('orderCreated', handleOrderChange);
      socket.off('orderUpdated', handleOrderChange);
      socket.off('orderDeleted', handleOrderChange);
      socket.off('walkInCreated', handleWalkInChange);
      socket.off('walkInUpdated', handleWalkInChange);
    };
  }, [queryClient]);

  // ---- ORDERS ----
  const ordersQuery = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => (await apiClient.get('pos/orders')).data,
  });

  const createOrderMut = useMutation({
    mutationFn: async (newOrder: Partial<Order>) => 
      (await apiClient.post('pos/orders', newOrder)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['masters', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const updateOrderMut = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Order> & { id: string }) => 
      (await apiClient.put(`pos/orders/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const deleteOrderMut = useMutation({
    mutationFn: async (id: string) => 
      (await apiClient.delete(`pos/orders/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // ---- WALK-IN SESSIONS ----
  const walkInsQuery = useQuery<WalkInSession[]>({
    queryKey: ['walk-ins'],
    queryFn: async () => (await apiClient.get('pos/walk-ins')).data,
  });

  const createWalkInMut = useMutation({
    mutationFn: async (session: Partial<WalkInSession>) => 
      (await apiClient.post('pos/walk-ins', session)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walk-ins'] });
    },
  });

  const updateWalkInMut = useMutation({
    mutationFn: async ({ id, ...data }: Partial<WalkInSession> & { id: string }) => 
      (await apiClient.put(`pos/walk-ins/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walk-ins'] });
    },
  });

  const checkoutWalkInMut = useMutation({
    mutationFn: async (id: string) => 
      (await apiClient.post(`pos/walk-ins/${id}/checkout`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walk-ins'] });
    },
  });

  return {
    orders: ordersQuery.data ?? [],
    isLoadingOrders: ordersQuery.isLoading,
    createOrder: createOrderMut.mutate,
    createOrderAsync: createOrderMut.mutateAsync,
    updateOrder: updateOrderMut.mutate,
    updateOrderAsync: updateOrderMut.mutateAsync,
    deleteOrder: deleteOrderMut.mutate,
    deleteOrderAsync: deleteOrderMut.mutateAsync,
    
    walkInSessions: walkInsQuery.data ?? [],
    isLoadingWalkIns: walkInsQuery.isLoading,
    createWalkInSession: createWalkInMut.mutate,
    createWalkInSessionAsync: createWalkInMut.mutateAsync,
    updateWalkInSession: updateWalkInMut.mutate,
    checkoutWalkInSession: checkoutWalkInMut.mutate,
  };
}
