import api from './api';

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  changePassword: async (old_password, new_password) => {
    const response = await api.post('/auth/change-password', { old_password, new_password });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/auth/account');
    return response.data;
  }
};

export default authService;
