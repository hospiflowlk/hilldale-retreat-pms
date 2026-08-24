import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

export interface CartItem {
  id: string;
  cartId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedSides?: string[];
  notes?: string;
  isVegetarian?: boolean;
}

export interface Cart {
  id: string;
  userId: string;
  name: string;
  discountPercent: number;
  notes: string;
  status: 'active' | 'parked';
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

export const useCart = () => {
  const queryClient = useQueryClient();
  
  // Track active cart ID in local storage
  const [activeCartId, setActiveCartId] = useState<string | null>(() => {
    return localStorage.getItem('activeCartId');
  });

  const setAndSaveCartId = (id: string | null) => {
    setActiveCartId(id);
    if (id) {
      localStorage.setItem('activeCartId', id);
    } else {
      localStorage.removeItem('activeCartId');
    }
  };

  useEffect(() => {
    socket.on('cartUpdated', (data: { cartId: string }) => {
      // Invalidate specific cart
      queryClient.invalidateQueries({ queryKey: ['cart', data.cartId] });
      // Also invalidate carts list
      queryClient.invalidateQueries({ queryKey: ['carts'] });
    });

    return () => {
      socket.off('cartUpdated');
    };
  }, [queryClient]);

  // Fetch all carts (useful for loading parked carts)
  const { data: allCarts = [], isLoading: isLoadingCarts } = useQuery<Cart[]>({
    queryKey: ['carts'],
    queryFn: async () => {
      const res = await apiClient.get('/carts');
      return res.data;
    },
  });

  // Fetch active cart details
  const { data: activeCart, isLoading: isLoadingActiveCart } = useQuery<Cart>({
    queryKey: ['cart', activeCartId],
    queryFn: async () => {
      if (!activeCartId) return null;
      try {
        const res = await apiClient.get(`/carts/${activeCartId}`);
        if (!res.data) return null;
        return {
          ...res.data,
          discountPercent: Number(res.data.discountPercent) || 0,
          items: (res.data.items || []).map((item: any) => ({
            ...item,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
          })),
        };
      } catch (e) {
        setAndSaveCartId(null);
        return null;
      }
    },
    enabled: !!activeCartId,
  });

  // Mutations
  const createCart = useMutation({
    mutationFn: async (data: Partial<Cart>) => {
      const res = await apiClient.post('/carts', data);
      return res.data;
    },
    onSuccess: (newCart) => {
      setAndSaveCartId(newCart.id);
      queryClient.invalidateQueries({ queryKey: ['carts'] });
    },
  });

  const updateCart = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Cart> }) => {
      const res = await apiClient.put(`/carts/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['carts'] });
    },
  });

  const addItem = useMutation({
    mutationFn: async ({ cartId, item }: { cartId: string; item: Partial<CartItem> }) => {
      const res = await apiClient.post(`/carts/${cartId}/items`, item);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.cartId] });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ cartId, itemId, data }: { cartId: string; itemId: string; data: Partial<CartItem> }) => {
      const res = await apiClient.put(`/carts/${cartId}/items/${itemId}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.cartId] });
    },
  });

  const removeItem = useMutation({
    mutationFn: async ({ cartId, itemId }: { cartId: string; itemId: string }) => {
      await apiClient.delete(`/carts/${cartId}/items/${itemId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cart', variables.cartId] });
    },
  });

  const deleteCart = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/carts/${id}`);
    },
    onSuccess: (_, id) => {
      if (activeCartId === id) {
        setAndSaveCartId(null);
      }
      queryClient.invalidateQueries({ queryKey: ['cart', id] });
      queryClient.invalidateQueries({ queryKey: ['carts'] });
    },
  });

  return {
    allCarts,
    activeCart,
    activeCartId,
    setAndSaveCartId,
    isLoadingCarts,
    isLoadingActiveCart,
    createCart: createCart.mutate,
    createCartAsync: createCart.mutateAsync,
    updateCart: updateCart.mutate,
    updateCartAsync: updateCart.mutateAsync,
    addItem: addItem.mutate,
    addItemAsync: addItem.mutateAsync,
    updateItem: updateItem.mutate,
    removeItem: removeItem.mutate,
    deleteCart: deleteCart.mutate,
  };
};
