import api from './api';

const normalizePaper = (paper) => {
  if (!paper) return paper;

  return {
    ...paper,
    file_name: paper.file_name ?? paper.fileName,
    upload_date: paper.upload_date ?? paper.uploadDate,
    page_count: paper.page_count ?? paper.pageCount,
    total_chunks: paper.total_chunks ?? paper.totalChunks,
    processing_status: paper.processing_status ?? paper.processingStatus ?? paper.status,
    summary_status: paper.summary_status ?? paper.summaryStatus,
    created_at: paper.created_at ?? paper.createdAt,
  };
};

const paperService = {
  uploadPaper: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/papers/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
    return normalizePaper(response.data);
  },
  
  getPapers: async (params) => {
    const response = await api.get('/papers', { params });
    return {
      ...response.data,
      papers: (response.data.papers || []).map(normalizePaper),
    };
  },
  
  getPaper: async (id) => {
    const response = await api.get(`/papers/${id}`);
    return normalizePaper(response.data);
  },
  
  deletePaper: async (id) => {
    const response = await api.delete(`/papers/${id}`);
    return response.data;
  },
  
  getPaperPdf: async (id) => {
    const response = await api.get(`/papers/${id}/pdf`, { responseType: 'blob' });
    return URL.createObjectURL(response.data);
  },

  getPaperText: async (id) => {
    const response = await api.get(`/papers/${id}/text`);
    return response.data;
  },
  
  summarizePaper: async (id, forceRegenerate = false) => {
    const response = await api.post(`/papers/${id}/summarize`, { force_regenerate: forceRegenerate });
    return response.data;
  },

  getSummary: async (id) => {
    const response = await api.get(`/papers/${id}/summary`);
    const summary = response.data;
    return {
      ...summary,
      research_objective: summary.research_objective ?? summary.objective,
      problem_statement: summary.problem_statement ?? summary.problemStatement,
      future_scope: summary.future_scope ?? summary.futureScope,
      key_contributions: summary.key_contributions ?? summary.keyContributions,
      generated_at: summary.generated_at ?? summary.generatedAt,
    };
  },

  saveClientSummary: async (id, summary) => {
    const response = await api.post(`/papers/${id}/summary/client`, summary);
    return response.data;
  },

  reprocessPaper: async (id) => {
    const response = await api.post(`/papers/${id}/reprocess`);
    return normalizePaper(response.data);
  }
};

export default paperService;
