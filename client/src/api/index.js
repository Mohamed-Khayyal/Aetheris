import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

/* ── Resolve Local Image Path ── */
export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  if (apiBase.startsWith('http')) {
    try {
      const backendOrigin = new URL(apiBase).origin;
      return `${backendOrigin}${url}`;
    } catch {
      return url;
    }
  }
  return url;
};

/* ── Auth ── */
export const register    = (data) => API.post('/auth/register', data);
export const login       = (data) => API.post('/auth/login', data);
export const logout      = ()     => API.post('/auth/logout');
export const getMe       = ()     => API.get('/auth/me');
export const updateProfile = (data) => API.patch('/auth/update-profile', data, {
  headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});
export const updatePassword = (data) => API.patch('/auth/update-password', data);
export const createAdmin = (data) => API.post('/auth/admin/create', data);
export const getUsers    = ()     => API.get('/auth/users');
export const deleteUser  = (id)   => API.delete(`/auth/users/${id}`);

/* ── Topics ── */
export const getTopics    = (params) => API.get('/topics', { params });
export const getTopicById = (id)     => API.get(`/topics/${id}`);
export const createTopic  = (data)   => API.post('/topics', data, {
  headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
});
export const updateTopic  = (id, d)  => API.patch(`/topics/${id}`, d);
export const uploadTopicImage = (data) => API.post('/topics/upload-image', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteTopic  = (id)     => API.delete(`/topics/${id}`);
export const getCategories = ()      => API.get('/topics/categories');
export const likeTopic    = (id)     => API.post(`/topics/${id}/like`);

/* ── Comments ── */
export const getComments   = (topicId, params) => API.get(`/topics/${topicId}/comments`, { params });
export const createComment = (topicId, data)   => API.post(`/topics/${topicId}/comments`, data);
export const updateComment = (id, data)         => API.patch(`/comments/${id}`, data);
export const deleteComment = (id)               => API.delete(`/comments/${id}`);

export default API;
