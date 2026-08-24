import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { socket } from '../utils/socket';
import type { UserProfile } from '../types';

export function useUsers() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUsersChange = () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    };

    socket.on('userCreated', handleUsersChange);
    socket.on('userUpdated', handleUsersChange);
    socket.on('userDeleted', handleUsersChange);

    return () => {
      socket.off('userCreated', handleUsersChange);
      socket.off('userUpdated', handleUsersChange);
      socket.off('userDeleted', handleUsersChange);
    };
  }, [queryClient]);

  const usersQuery = useQuery<UserProfile[]>({
    queryKey: ['users'],
    queryFn: async () => (await apiClient.get('users')).data,
  });

  // Future mutators can be added here
  
  return {
    users: usersQuery.data ?? [],
    isLoading: usersQuery.isLoading,
  };
}
