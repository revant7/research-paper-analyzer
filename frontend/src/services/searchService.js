import api from './api';

const searchService = {
  search: async (query, filters = {}) => {
    const response = await api.post('/search', { query, ...filters });
    return response.data;
  },
  
  getSearchHistory: async () => {
    const response = await api.get('/search/history');
    return response.data;
  }
};

export default searchService;
