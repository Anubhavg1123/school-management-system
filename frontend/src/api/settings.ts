import { apiClient } from './client';

export const settingsApi = {
  getSettings: async () => {
    const res = await apiClient.get('/settings');
    return res.data;
  },
  getByKey: async (key: string) => {
    const res = await apiClient.get(`/settings/${key}`);
    return res.data;
  },
  updateSetting: async (key: string, value: string) => {
    const res = await apiClient.put(`/settings/${key}`, { value });
    return res.data;
  },
};
