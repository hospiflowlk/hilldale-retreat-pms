import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import type { LoginResult, UserProfile } from '../types';

export function useAuth() {
  const queryClient = useQueryClient();

  // Login via credentials (username + pin)
  const loginMut = useMutation({
    mutationFn: async ({ identifier, pinCode }: { identifier: string; pinCode: string }): Promise<LoginResult> => {
      try {
        const response = await apiClient.post('auth/login', { username: identifier, pin: pinCode });
        const { token, user } = response.data;
        
        // Map backend user to UserProfile
        const mappedUser: UserProfile = {
          id: `usr-${user.id}`,
          username: user.username,
          name: user.name,
          email: user.email || '',
          phone: user.phone || '',
          role: user.role.toLowerCase(),
          department: user.department || '',
          designation: user.designation || '',
          avatarColor: user.avatar_color || '#cccccc',
          allowedModules: user.access ? user.access.map((a: any) => a.module) : [],
          canManageUsers: user.can_manage_users,
          canExportReports: user.can_export_reports,
          canDeleteRecords: user.can_delete_records,
          isActive: user.is_active,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return { success: true, user: mappedUser, token };
      } catch (err: any) {
        return { success: false, error: err.response?.data?.error || 'Login failed' };
      }
    }
  });

  // Login via quick PIN pad (user selected + PIN)
  const pinLoginMut = useMutation({
    mutationFn: async ({ userId, pinCode }: { userId: string; pinCode: string }): Promise<LoginResult> => {
      try {
        const response = await apiClient.post('auth/pin-login', { userId, pin: pinCode });
        const { token, user } = response.data;
        
        // Map backend user to UserProfile
        const mappedUser: UserProfile = {
          id: `usr-${user.id}`,
          username: user.username,
          name: user.name,
          email: user.email || '',
          phone: user.phone || '',
          role: user.role.toLowerCase(),
          department: user.department || '',
          designation: user.designation || '',
          avatarColor: user.avatar_color || '#cccccc',
          allowedModules: user.access ? user.access.map((a: any) => a.module) : [],
          canManageUsers: user.can_manage_users,
          canExportReports: user.can_export_reports,
          canDeleteRecords: user.can_delete_records,
          isActive: user.is_active,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return { success: true, user: mappedUser, token };
      } catch (err: any) {
        return { success: false, error: err.response?.data?.error || 'PIN Login failed' };
      }
    }
  });

  // Verify PIN for lock screen
  const verifyPinMut = useMutation({
    mutationFn: async (pin: string): Promise<boolean> => {
      try {
        await apiClient.post('auth/verify-pin', { pin });
        return true;
      } catch (err) {
        return false;
      }
    }
  });

  return {
    login: loginMut.mutateAsync,
    pinLogin: pinLoginMut.mutateAsync,
    verifyPin: verifyPinMut.mutateAsync,
    isLoggingIn: loginMut.isPending || pinLoginMut.isPending,
  };
}
