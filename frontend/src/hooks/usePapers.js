import { useState, useCallback } from 'react';
import paperService from '../services/paperService';
import toast from 'react-hot-toast';

export const usePapers = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPapers, setTotalPapers] = useState(0);

  const fetchPapers = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const data = await paperService.getPapers(params);
      setPapers(data.papers || data);
      setTotalPapers(data.total || data.length);
    } catch (error) {
      toast.error('Failed to fetch papers');
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePaper = async (id) => {
    try {
      await paperService.deletePaper(id);
      setPapers(prev => prev.filter(p => p.id !== id));
      setTotalPapers(prev => prev - 1);
      toast.success('Paper deleted successfully');
    } catch (error) {
      toast.error('Failed to delete paper');
      throw error;
    }
  };

  return { papers, loading, fetchPapers, deletePaper, totalPapers };
};

export default usePapers;
