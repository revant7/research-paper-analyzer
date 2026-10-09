import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import PropTypes from 'prop-types';

const UploadDropzone = ({ onFileAccepted, maxSizeBytes = 52428800 }) => {
  const [errorMsg, setErrorMsg] = useState(null);

  const onDrop = useCallback((acceptedFiles, fileRejections) => {
    setErrorMsg(null);
    if (fileRejections.length > 0) {
      const { errors } = fileRejections[0];
      if (errors[0]?.code === 'file-too-large') {
        setErrorMsg(`File is larger than ${Math.round(maxSizeBytes / 1024 / 1024)}MB limit`);
      } else if (errors[0]?.code === 'file-invalid-type') {
        setErrorMsg('Only PDF files are accepted');
      } else {
        setErrorMsg(errors[0]?.message);
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      onFileAccepted(acceptedFiles[0]);
    }
  }, [onFileAccepted, maxSizeBytes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: maxSizeBytes,
    multiple: false
  });

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700/80'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className={`w-10 h-10 mb-3 ${isDragActive ? 'text-indigo-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">PDF (MAX. {Math.round(maxSizeBytes / 1024 / 1024)}MB)</p>
        </div>
      </div>
      {errorMsg && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">{errorMsg}</p>
      )}
    </div>
  );
};

UploadDropzone.propTypes = {
  onFileAccepted: PropTypes.func.isRequired,
  maxSizeBytes: PropTypes.number,
};

export default UploadDropzone;
