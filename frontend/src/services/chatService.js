import api from './api';

const chatService = {
  sendMessage: async (payload, conversationId, paperId, paperIds) => {
    let body;
    if (typeof payload === 'object' && payload !== null && 'message' in payload) {
      body = payload;
    } else {
      body = {
        message: payload,
        conversation_id: conversationId,
        paper_id: paperId,
        paper_ids: paperIds
      };
    }
    const response = await api.post('/chat', body);
    return response.data;
  },
  
  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },
  
  getConversation: async (id) => {
    const response = await api.get(`/chat/${id}`);
    return response.data;
  },
  
  deleteConversation: async (id) => {
    const response = await api.delete(`/chat/${id}`);
    return response.data;
  }
};

export default chatService;
