import client from './client';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  category: string;
}

export const featureFlagsApi = {
  getFlags: async () => {
    const res = await client.get<{ data: { flags: FeatureFlag[] } }>('/features');
    return res.data;
  },

  updateFlag: async (key: string, isEnabled: boolean, reason?: string) => {
    const res = await client.patch(`/features/${key}`, { isEnabled, reason });
    return res.data;
  },

  getConfigHistory: async () => {
    const res = await client.get('/features/config-history');
    return res.data;
  },
};
