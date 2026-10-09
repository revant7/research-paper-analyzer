import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { 
  FaCloudUploadAlt, FaFilePdf, FaCheckCircle, 
  FaSpinner, FaInfoCircle, FaFileAlt
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import paperService from '../services/paperService';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, processing, success, error
  const [progress, setProgress] = useState(0);
  const [uploadedPaperId, setUploadedPaperId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [recentPapers, setRecentPapers] = useState([]);
  
  const pollTimerRef = useRef(null);

  useEffect(() => {
    fetchRecentPapers();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const fetchRecentPapers = async () => {
    try {
      const data = await paperService.getPapers({ limit: 5 });
      setRecentPapers(data.papers || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Failed to load recent uploads", err);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
        toast.error('Only PDF files are supported');
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) { // 50MB
        toast.error('File size exceeds 50MB limit');
        return;
      }
      setFile(selectedFile);
      setUploadState('idle');
      setProgress(0);
      setErrorMessage('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 52428800 // 50MB
  });

  const pollProcessingStatus = (paperId) => {
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes (60 * 2s)

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(pollTimerRef.current);
        setUploadState('error');
        setErrorMessage('Processing is taking longer than usual. You can monitor progress on the My Papers page.');
        return;
      }

      try {
        const currentPaper = await paperService.getPaper(paperId);
        if (currentPaper.processing_status === 'completed') {
          clearInterval(pollTimerRef.current);
          setUploadState('success');
          toast.success('Paper uploaded and processed successfully!');
          fetchRecentPapers();
        } else if (currentPaper.processing_status === 'failed') {
          clearInterval(pollTimerRef.current);
          setUploadState('error');
          const errorDetail = currentPaper.processing_error || 'PDF text extraction or indexing failed.';
          setErrorMessage(errorDetail);
          toast.error(errorDetail);
        }
      } catch (err) {
        // Network blip during polling, continue
      }
    }, 2000);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploadState('uploading');
    setProgress(0);
    setErrorMessage('');

    try {
      const result = await paperService.uploadPaper(file, (percentCompleted) => {
        setProgress(percentCompleted);
      });

      setUploadedPaperId(result.id);
      setProgress(100);
      setUploadState('processing');

      // Poll until completed or failed
      pollProcessingStatus(result.id);

    } catch (error) {
      setUploadState('error');
      let msg = 'Upload failed. Please try again.';

      if (error.response?.status === 409) {
        msg = 'A paper with identical content (duplicate SHA256) has already been uploaded.';
      } else if (error.response?.status === 413) {
        msg = 'File size exceeds maximum upload limit of 50MB.';
      } else if (error.response?.status === 400) {
        msg = error.response?.data?.detail || 'Invalid PDF file. The file must start with valid PDF magic bytes.';
      } else if (error.response?.data?.detail) {
        msg = error.response.data.detail;
      }

      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const removeFile = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    setFile(null);
    setUploadState('idle');
    setProgress(0);
    setErrorMessage('');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-screen flex flex-col lg:flex-row gap-8">
      {/* Main Upload Area */}
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Paper</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Add a new research paper to your workspace for analysis.</p>
        </div>

        {uploadState === 'idle' && !file && (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-800'}
              ${isDragReject ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="w-20 h-20 mx-auto bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-4xl text-indigo-500 mb-6 shadow-sm">
              <FaCloudUploadAlt />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              or <span className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">click to browse</span> from your computer
            </p>
            <div className="inline-flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded-full">
              <FaFilePdf className="mr-1.5" /> Only PDF files, max 50MB
            </div>
          </div>
        )}

        {(file || uploadState !== 'idle') && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 text-2xl shrink-0">
                <FaFilePdf />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate" title={file?.name}>
                  {file?.name || 'document.pdf'}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formatFileSize(file?.size || 0)}
                </p>
              </div>
              {uploadState === 'idle' && (
                <button 
                  onClick={removeFile}
                  className="text-gray-400 hover:text-red-500 p-2 transition-colors"
                  title="Remove file"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Progress Area */}
            {uploadState !== 'idle' && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {uploadState === 'uploading' && 'Uploading document stream...'}
                    {uploadState === 'processing' && 'AI pipeline: Extracting text, chunking, and computing vector embeddings...'}
                    {uploadState === 'success' && 'Processing complete! Ready for summary, chat, and search.'}
                    {uploadState === 'error' && (errorMessage || 'Upload or processing failed')}
                  </span>
                  <span className="text-gray-500 font-medium">
                    {uploadState === 'uploading' ? `${progress}%` : uploadState === 'processing' ? 'Indexing...' : ''}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      uploadState === 'error' ? 'bg-red-500 w-full' : uploadState === 'processing' ? 'bg-indigo-600 animate-pulse w-full' : 'bg-indigo-600'
                    }`}
                    style={uploadState === 'uploading' ? { width: `${progress}%` } : {}}
                  ></div>
                </div>
              </div>
            )}

            {/* Status Messages & Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              {uploadState === 'idle' && (
                <>
                  <button onClick={removeFile} className="px-5 py-2.5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleUpload} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center">
                    Upload & Process
                  </button>
                </>
              )}
              
              {uploadState === 'uploading' && (
                <button disabled className="px-5 py-2.5 bg-indigo-400 text-white font-medium rounded-lg shadow-sm flex items-center cursor-not-allowed">
                  <FaSpinner className="animate-spin mr-2" /> Uploading {progress}%...
                </button>
              )}
              
              {uploadState === 'processing' && (
                <button disabled className="px-5 py-2.5 bg-indigo-400 text-white font-medium rounded-lg shadow-sm flex items-center cursor-not-allowed">
                  <FaSpinner className="animate-spin mr-2" /> AI Indexing in Progress...
                </button>
              )}
              
              {uploadState === 'success' && uploadedPaperId && (
                <Link to={`/papers/${uploadedPaperId}`} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center">
                  <FaCheckCircle className="mr-2" /> View Paper Analysis
                </Link>
              )}
              
              {uploadState === 'error' && (
                <div className="flex gap-3">
                  <button onClick={removeFile} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50">
                    Choose Another File
                  </button>
                  <button onClick={handleUpload} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center">
                    Retry Upload
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Area */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-5">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center mb-3">
            <FaInfoCircle className="mr-2" /> Upload Tips
          </h3>
          <ul className="space-y-3 text-sm text-blue-700 dark:text-blue-400/80">
            <li className="flex items-start"><span className="mr-2 mt-0.5">•</span> Supported format: PDF only</li>
            <li className="flex items-start"><span className="mr-2 mt-0.5">•</span> Max file size: 50MB per document</li>
            <li className="flex items-start"><span className="mr-2 mt-0.5">•</span> SHA256 deduplication protects against duplicate uploads</li>
            <li className="flex items-start"><span className="mr-2 mt-0.5">•</span> Digital PDFs yield optimal chunking and embeddings</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Uploads</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentPapers.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">
                No recent uploads yet.
              </div>
            ) : (
              recentPapers.map((paper) => (
                <Link 
                  key={paper.id} 
                  to={`/papers/${paper.id}`}
                  className="p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors block"
                >
                  <FaFileAlt className="text-gray-400 mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1" title={paper.title}>
                      {paper.title || paper.file_name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Status: <span className="font-medium capitalize">{paper.processing_status}</span>
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="p-3 text-center border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <Link to="/papers" className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              View all papers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
