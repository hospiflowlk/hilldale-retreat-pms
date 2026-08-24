import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { Settings } from '../types';
import { useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

export const useSettings = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    socket.on('settingsUpdated', (updatedSettings: Settings) => {
      queryClient.setQueryData(['settings'], updatedSettings);
    });

    return () => {
      socket.off('settingsUpdated');
    };
  }, [queryClient]);

  const { data: settings, isLoading, error } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await apiClient.get('/settings');
      return res.data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<Settings>) => {
      const res = await apiClient.put('/settings', newSettings);
      return res.data;
    },
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(['settings'], updatedSettings);
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettings.mutate,
    updateSettingsAsync: updateSettings.mutateAsync,
  };
};
