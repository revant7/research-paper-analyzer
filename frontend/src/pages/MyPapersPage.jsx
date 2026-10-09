import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaSearch, FaThLarge, FaList, FaUpload, 
  FaTrash, FaEye, FaSpinner, FaCheckCircle, FaExclamationCircle, 
  FaClock, FaFilePdf, FaChevronLeft, FaChevronRight, FaRedo
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import paperService from '../services/paperService';

const PAGE_SIZE = 10;

const MyPapersPage = () => {
  const [papers, setPapers] = useState([]);
  const [totalPapers, setTotalPapers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [paperToDelete, setPaperToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reprocessingId, setReprocessingId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch papers when page or search changes
  useEffect(() => {
    fetchPapers();
  }, [currentPage, debouncedSearch]);

  const fetchPapers = async () => {
    setIsLoading(true);
    try {
      const skip = (currentPage - 1) * PAGE_SIZE;
      const params = {
        skip,
        limit: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined
      };
      const data = await paperService.getPapers(params);
      
      const paperList = data.papers || (Array.isArray(data) ? data : []);
      const total = data.total !== undefined ? data.total : paperList.length;
      
      setPapers(paperList);
      setTotalPapers(total);
    } catch (error) {
      console.error("Failed to fetch papers:", error);
      toast.error("Failed to fetch papers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (paper) => {
    setPaperToDelete(paper);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!paperToDelete) return;
    
    setIsDeleting(true);
    try {
      await paperService.deletePaper(paperToDelete.id);
      toast.success("Paper and vector embeddings deleted successfully");
      setShowDeleteModal(false);
      setPaperToDelete(null);
      fetchPapers();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(error.response?.data?.detail || "Failed to delete paper");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReprocess = async (e, paperId) => {
    e.stopPropagation();
    e.preventDefault();
    setReprocessingId(paperId);
    try {
      await paperService.reprocessPaper(paperId);
      toast.success("Reprocessing started. Status updated.");
      fetchPapers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to reprocess paper.");
    } finally {
      setReprocessingId(null);
    }
  };

  const totalPages = Math.ceil(totalPapers / PAGE_SIZE) || 1;

  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'completed': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><FaCheckCircle className="mr-1.5" /> Ready</span>;
      case 'processing': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><FaSpinner className="mr-1.5 animate-spin" /> Processing</span>;
      case 'failed': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><FaExclamationCircle className="mr-1.5" /> Failed</span>;
      case 'pending': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><FaClock className="mr-1.5" /> Pending</span>;
      default: 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">{status}</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Papers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and view your uploaded research papers.</p>
        </div>
        <Link to="/upload" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap">
          <FaUpload /> Upload New Paper
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search papers by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button 
            onClick={fetchPapers}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-sm font-medium"
            title="Refresh list"
          >
            <FaRedo className={isLoading ? "animate-spin text-xs" : "text-xs"} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
              title="List View"
            >
              <FaList />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 border-l border-gray-300 dark:border-gray-600 ${viewMode === 'grid' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
              title="Grid View"
            >
              <FaThLarge />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 animate-pulse flex h-24 items-center">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded mr-4"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : papers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 border-dashed rounded-xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-2xl mb-4">
            <FaFilePdf />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No papers found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
            {debouncedSearch ? "We couldn't find any papers matching your search query." : "You haven't uploaded any research papers yet."}
          </p>
          {!debouncedSearch && (
            <Link to="/upload" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Upload Your First Paper
            </Link>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paper</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Upload Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pages</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {papers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <FaFilePdf className="text-red-500 mt-1 mr-3 text-lg shrink-0" />
                        <div>
                          <Link to={`/papers/${paper.id}`} className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400">
                            {paper.title || paper.file_name}
                          </Link>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{paper.authors || 'Unknown authors'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(paper.upload_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={paper.processing_status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {paper.page_count ? `${paper.page_count} p` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end items-center gap-3">
                        {paper.processing_status === 'failed' && (
                          <button 
                            onClick={(e) => handleReprocess(e, paper.id)} 
                            disabled={reprocessingId === paper.id}
                            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 p-1" 
                            title="Reprocess Paper"
                          >
                            <FaRedo className={reprocessingId === paper.id ? "animate-spin" : ""} />
                          </button>
                        )}
                        <Link to={`/papers/${paper.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1" title="View Paper">
                          <FaEye className="text-base" />
                        </Link>
                        <button onClick={() => handleDeleteClick(paper)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1" title="Delete Paper">
                          <FaTrash className="text-base" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {papers.map((paper) => (
            <div key={paper.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 text-xl shrink-0">
                  <FaFilePdf />
                </div>
                <StatusBadge status={paper.processing_status} />
              </div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white line-clamp-2 mb-1 flex-1" title={paper.title}>
                {paper.title || paper.file_name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-4">{paper.authors || 'Unknown authors'}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                <span>{formatDate(paper.upload_date)}</span>
                <span>{paper.page_count ? `${paper.page_count} pages` : 'PDF'}</span>
              </div>
              
              <div className="flex gap-2">
                <Link to={`/papers/${paper.id}`} className="flex-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 py-2 rounded-lg text-sm font-medium text-center transition-colors">
                  View
                </Link>
                {paper.processing_status === 'failed' && (
                  <button 
                    onClick={(e) => handleReprocess(e, paper.id)}
                    disabled={reprocessingId === paper.id}
                    className="px-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 rounded-lg transition-colors"
                    title="Reprocess"
                  >
                    <FaRedo className={reprocessingId === paper.id ? "animate-spin text-xs" : "text-xs"} />
                  </button>
                )}
                <button onClick={() => handleDeleteClick(paper)} className="px-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors" title="Delete">
                  <FaTrash className="text-xs" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white dark:bg-gray-800 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, totalPapers)}</span> of <span className="font-medium">{totalPapers}</span> papers
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FaChevronLeft className="text-xs" />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FaChevronRight className="text-xs" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setShowDeleteModal(false)}>
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-100 dark:border-gray-700">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                  <FaExclamationCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Delete Paper</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Are you sure you want to delete <span className="font-semibold text-gray-800 dark:text-gray-200">{paperToDelete?.title || paperToDelete?.file_name}</span>?
                    </p>
                    <p className="text-xs text-red-500 mt-2">
                      This will permanently remove the PDF, its vector embeddings, summaries, and disconnect existing conversations.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
                <button 
                  type="button" 
                  onClick={confirmDelete} 
                  disabled={isDeleting}
                  className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? <FaSpinner className="animate-spin mr-2" /> : null}
                  Delete Paper
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowDeleteModal(false)} 
                  disabled={isDeleting}
                  className="w-full sm:w-auto mt-2 sm:mt-0 inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPapersPage;
