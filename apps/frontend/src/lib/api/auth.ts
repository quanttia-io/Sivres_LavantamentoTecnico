import { api } from './client';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/login', { email, password }),

  me: () => api.get<{ id: string; name: string; email: string; role: string }>('/auth/me'),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),
};
