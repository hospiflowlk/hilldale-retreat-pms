import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { socket } from '../utils/socket';
import type { Account, AccountTransaction, FundTransferRequest } from '../types';

export function useAccounts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleAccountChange = () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    };

    socket.on('accountCreated', handleAccountChange);
    socket.on('accountUpdated', handleAccountChange);
    socket.on('accountDeleted', handleAccountChange);
    socket.on('transactionCreated', handleAccountChange);

    return () => {
      socket.off('accountCreated', handleAccountChange);
      socket.off('accountUpdated', handleAccountChange);
      socket.off('accountDeleted', handleAccountChange);
      socket.off('transactionCreated', handleAccountChange);
    };
  }, [queryClient]);

  const accountsQuery = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => (await apiClient.get('accounts')).data,
  });

  const transactionsQuery = useQuery<AccountTransaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => (await apiClient.get('accounts/transactions')).data,
  });

  const createAccountMut = useMutation({
    mutationFn: async (acc: Partial<Account>) => 
      (await apiClient.post('accounts', acc)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const updateAccountMut = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Account> & { id: string }) => 
      (await apiClient.put(`accounts/${id}`, data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const deleteAccountMut = useMutation({
    mutationFn: async (id: string) => 
      (await apiClient.delete(`accounts/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const transferFundsMut = useMutation({
    mutationFn: async (req: FundTransferRequest) => 
      (await apiClient.post('accounts/transfer', req)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const recordTransactionMut = useMutation({
    mutationFn: async (tx: Partial<AccountTransaction>) => 
      (await apiClient.post('accounts/transactions', tx)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return {
    accounts: accountsQuery.data ?? [],
    isLoadingAccounts: accountsQuery.isLoading,
    transactions: transactionsQuery.data ?? [],
    isLoadingTransactions: transactionsQuery.isLoading,
    createAccount: createAccountMut.mutate,
    createAccountAsync: createAccountMut.mutateAsync,
    updateAccount: updateAccountMut.mutate,
    updateAccountAsync: updateAccountMut.mutateAsync,
    deleteAccount: deleteAccountMut.mutate,
    deleteAccountAsync: deleteAccountMut.mutateAsync,
    transferFunds: transferFundsMut.mutate,
    transferFundsAsync: transferFundsMut.mutateAsync,
    recordTransaction: recordTransactionMut.mutate,
    recordTransactionAsync: recordTransactionMut.mutateAsync,
  };
}
