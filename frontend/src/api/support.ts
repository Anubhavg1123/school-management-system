import { apiClient } from './client';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  assignedToUserId?: string;
  resolution?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: { firstName: string; lastName: string; email: string; activeRole: string };
  assignedTo?: { firstName: string; lastName: string; email: string };
  _count?: { comments: number };
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  comment: string;
  isInternal: boolean;
  createdAt: string;
  user?: { firstName: string; lastName: string; activeRole: string };
}

export const supportApi = {
  createTicket: (data: { category: string; description: string; priority?: string }) =>
    apiClient.post('/support', data).then((r) => r.data.data),

  getTickets: (params?: { status?: string; category?: string; priority?: string; page?: number; limit?: number }) =>
    apiClient.get('/support', { params }).then((r) => r.data.data),

  getTicketById: (id: string) =>
    apiClient.get(`/support/${id}`).then((r) => r.data.data),

  updateTicket: (id: string, data: { status?: string; assignedToUserId?: string; resolution?: string }) =>
    apiClient.patch(`/support/${id}`, data).then((r) => r.data.data),

  addComment: (id: string, data: { comment: string; isInternal?: boolean }) =>
    apiClient.post(`/support/${id}/comments`, data).then((r) => r.data.data),

  getStats: () =>
    apiClient.get('/support/stats').then((r) => r.data.data),
};
