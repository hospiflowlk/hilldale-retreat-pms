import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { socket } from '../utils/socket';
import type { Expense } from '../types';

export function useExpenses() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleExpenseChange = () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    };

    socket.on('expenseCreated', handleExpenseChange);
    socket.on('expenseUpdated', handleExpenseChange);
    socket.on('expenseDeleted', handleExpenseChange);

    return () => {
      socket.off('expenseCreated', handleExpenseChange);
      socket.off('expenseUpdated', handleExpenseChange);
      socket.off('expenseDeleted', handleExpenseChange);
    };
  }, [queryClient]);

  const expensesQuery = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => (await apiClient.get('expenses')).data,
  });

  const createExpenseMut = useMutation({
    mutationFn: async (exp: Partial<Expense>) => 
      (await apiClient.post('expenses', exp)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const updateExpenseMut = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Expense> & { id: string }) => 
      (await apiClient.put(`expenses/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const deleteExpenseMut = useMutation({
    mutationFn: async (id: string) => 
      (await apiClient.delete(`expenses/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  return {
    expenses: expensesQuery.data ?? [],
    isLoadingExpenses: expensesQuery.isLoading,
    createExpense: createExpenseMut.mutate,
    createExpenseAsync: createExpenseMut.mutateAsync,
    updateExpense: updateExpenseMut.mutate,
    updateExpenseAsync: updateExpenseMut.mutateAsync,
    deleteExpense: deleteExpenseMut.mutate,
    deleteExpenseAsync: deleteExpenseMut.mutateAsync,
  };
}
