import client from './client';

export const realtimeApi = {
  getStats: async () => {
    const res = await client.get('/realtime/stats');
    return res.data;
  },
};
