import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Settings } from '@tracearr/shared';
import { toast } from 'sonner';
import { api } from '@/lib/api';

// API Key queries and mutations
export function useApiKey() {
  return useQuery({
    queryKey: ['apiKey'],
    queryFn: api.settings.getApiKey,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRegenerateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.settings.regenerateApiKey,
    onSuccess: (data) => {
      queryClient.setQueryData(['apiKey'], data);
      toast.success('API Key Generated', { description: 'Your new API key is ready to use.' });
    },
    onError: (err) => {
      toast.error('Failed to Generate API Key', { description: err.message });
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: api.settings.get,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

interface UpdateSettingsOptions {
  silent?: boolean;
}

export function useUpdateSettings(options: UpdateSettingsOptions = {}) {
  const { silent = false } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Settings>) => api.settings.update(data),
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: ['settings'] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<Settings>(['settings']);

      // Optimistically update to the new value
      queryClient.setQueryData<Settings>(['settings'], (old) => {
        if (!old) return old;
        return { ...old, ...newSettings };
      });

      return { previousSettings };
    },
    onError: (err, newSettings, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(['settings'], context.previousSettings);
      }
      if (!silent) {
        toast.error('Failed to Update Settings', { description: err.message });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['settings'] });
      if (!silent) {
        toast.success('Settings Updated', { description: 'Your settings have been saved.' });
      }
    },
  });
}
