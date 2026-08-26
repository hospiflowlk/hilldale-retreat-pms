import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import type { MasterCategory, MasterItem, MasterCustomer, MasterSupplier, MasterBusinessSource } from '../types';

// Generic hook factory
function createMasterHooks<T>(endpoint: string, queryKey: string) {
  return {
    useGetAll: () => {
      const query = useQuery<T[]>({
        queryKey: [queryKey],
        queryFn: async () => (await apiClient.get(endpoint)).data,
      });
      return { ...query, data: query.data ?? ([] as unknown as T[]) } as typeof query & { data: T[] };
    },
    
    useCreate: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (data: Partial<T>) => (await apiClient.post(endpoint, data)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
      });
    },

    useUpdate: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async ({ id, ...data }: Partial<T> & { id: number | string }) => 
          (await apiClient.put(`${endpoint}/${id}`, data)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
      });
    },

    useDelete: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (id: number | string) => (await apiClient.delete(`${endpoint}/${id}`)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
      });
    },

    useDeleteAll: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async () => (await apiClient.delete(endpoint)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
      });
    },
  };
}

export const useItems = createMasterHooks<MasterItem>('masters/items', 'items');
export const useCategories = createMasterHooks<MasterCategory>('masters/categories', 'categories');
export const useCustomers = createMasterHooks<MasterCustomer>('masters/customers', 'customers');
export const useSuppliers = createMasterHooks<MasterSupplier>('masters/suppliers', 'suppliers');
export const useBusinessSources = createMasterHooks<MasterBusinessSource>('masters/business-sources', 'business-sources');
