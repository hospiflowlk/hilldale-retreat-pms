import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { socket } from '../utils/socket';
import type { MenuItem } from '../types';

export function useMenu() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleMenuChange = () => {
      queryClient.invalidateQueries({ queryKey: ['menuItems'] });
    };

    socket.on('menu-updated', handleMenuChange);

    return () => {
      socket.off('menu-updated', handleMenuChange);
    };
  }, [queryClient]);

  const menuQuery = useQuery<MenuItem[]>({
    queryKey: ['menuItems'],
    queryFn: async () => {
      const res = await apiClient.get('menu');
      return (res.data || []).map((item: any) => ({
        ...item,
        price: Number(item.price) || 0,
      }));
    },
  });

  const toggleAvailabilityMut = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      (await apiClient.put(`menu/${id}/availability`, { isAvailable })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menuItems'] }),
  });

  const updatePriceMut = useMutation({
    mutationFn: async ({ id, price }: { id: string; price: number }) =>
      (await apiClient.put(`menu/${id}/price`, { price })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menuItems'] }),
  });

  const createMenuItemMut = useMutation({
    mutationFn: async (item: Partial<MenuItem>) =>
      (await apiClient.post('menu', item)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menuItems'] }),
  });

  const deleteMenuItemMut = useMutation({
    mutationFn: async (id: string) =>
      (await apiClient.delete(`menu/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menuItems'] }),
  });

  return {
    menuItems: menuQuery.data ?? [],
    isLoading: menuQuery.isLoading,

    toggleAvailability: (id: string, isAvailable: boolean) =>
      toggleAvailabilityMut.mutateAsync({ id, isAvailable }),

    updatePrice: (id: string, price: number) =>
      updatePriceMut.mutateAsync({ id, price }),

    createMenuItem: (item: Partial<MenuItem>) =>
      createMenuItemMut.mutateAsync(item),

    deleteMenuItem: (id: string) =>
      deleteMenuItemMut.mutateAsync(id),
  };
}
