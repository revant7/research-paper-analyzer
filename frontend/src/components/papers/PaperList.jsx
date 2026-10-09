import React from 'react';
import PropTypes from 'prop-types';

const PaperList = ({ papers, onClick, onDelete }) => {
  return (
    <div className="overflow-x-auto shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6">Title</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Authors</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Date</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Status</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Pages</th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
          {papers.map((paper) => (
            <tr key={paper.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                <div className="font-medium text-gray-900 dark:text-white truncate max-w-xs">{paper.title}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                {paper.authors?.join(', ') || 'Unknown'}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                {new Date(paper.uploadDate).toLocaleDateString()}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                  paper.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  paper.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  paper.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {paper.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                {paper.pageCount}
              </td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button
                  onClick={() => onClick(paper.id)}
                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                >
                  View<span className="sr-only">, {paper.title}</span>
                </button>
                <button
                  onClick={() => onDelete(paper.id)}
                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                >
                  Delete<span className="sr-only">, {paper.title}</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

PaperList.propTypes = {
  papers: PropTypes.array.isRequired,
  onClick: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default PaperList;
