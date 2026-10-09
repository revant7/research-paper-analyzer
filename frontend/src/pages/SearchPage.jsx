import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FaSearch, FaClock, FaBook, 
  FaSlidersH, FaSpinner,
  FaQuoteLeft, FaLayerGroup
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import searchService from '../services/searchService';
import paperService from '../services/paperService';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [availablePapers, setAvailablePapers] = useState([]);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [relevanceScore, setRelevanceScore] = useState(0); // Min relevance %
  const [resultLimit, setResultLimit] = useState(15);
  const [selectedPaperFilter, setSelectedPaperFilter] = useState('');

  useEffect(() => {
    loadRecentSearches();
    loadPapers();
    if (initialQuery.trim()) {
      executeSearch(initialQuery.trim());
    }
  }, []);

  const loadRecentSearches = async () => {
    try {
      const history = await searchService.getSearchHistory();
      if (Array.isArray(history)) {
        setRecentSearches(history.slice(0, 8));
      }
    } catch (err) {
      console.error("Failed to load search history", err);
    }
  };

  const loadPapers = async () => {
    try {
      const data = await paperService.getPapers({ limit: 100 });
      setAvailablePapers(data.papers || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("Failed to load papers", err);
    }
  };

  const executeSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const filterPayload = {
        limit: Number(resultLimit)
      };
      if (selectedPaperFilter) {
        filterPayload.paper_ids = [selectedPaperFilter];
      }

      const response = await searchService.search(searchTerm.trim(), filterPayload);
      const searchResults = response.results || [];
      setResults(searchResults);

      // Refresh recent searches after successful search
      loadRecentSearches();
    } catch (error) {
      console.error("Search failed:", error);
      toast.error(error.response?.data?.detail || "Semantic search encountered an error.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearchParams({ q: query.trim() });
    executeSearch(query.trim());
  };

  const handleRecentClick = (term) => {
    setQuery(term);
    setSearchParams({ q: term });
    executeSearch(term);
  };

  // Client-side filtering by relevance score threshold
  const filteredResults = results.filter(r => {
    if (!relevanceScore) return true;
    const scorePct = r.relevance_score !== undefined ? Math.round(r.relevance_score * 100) : 100;
    return scorePct >= relevanceScore;
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto min-h-screen">
      <div className="text-center mb-8 mt-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Semantic Search</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Search across all your research papers using deep contextual meaning and vector embeddings.
        </p>
      </div>

      {/* Main Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-6 relative z-20">
        <div className="relative flex items-center shadow-md rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
          <div className="pl-5 text-gray-400">
            <FaSearch className="text-lg" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g., How does multi-head self-attention operate?"
            className="w-full py-4 pl-3 pr-28 bg-transparent border-none text-gray-900 dark:text-white text-base focus:outline-none focus:ring-0 placeholder-gray-400"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            <button 
              type="button" 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-lg transition-colors ${showFilters ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title="Search Filters"
            >
              <FaSlidersH className="text-sm" />
            </button>
            <button 
              type="submit" 
              disabled={!query.trim() || isSearching}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSearching ? <FaSpinner className="animate-spin text-sm" /> : 'Search'}
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-5 grid grid-cols-1 md:grid-cols-3 gap-5 animate-fadeIn z-30">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                <FaLayerGroup /> Filter by Paper
              </label>
              <select 
                value={selectedPaperFilter} 
                onChange={(e) => setSelectedPaperFilter(e.target.value)}
                className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-xs focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 text-xs"
              >
                <option value="">All Uploaded Papers</option>
                {availablePapers.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Min. Relevance: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{relevanceScore}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="90" 
                step="5"
                value={relevanceScore}
                onChange={(e) => setRelevanceScore(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600 mt-2"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Max Results
              </label>
              <select 
                value={resultLimit} 
                onChange={(e) => setResultLimit(Number(e.target.value))}
                className="w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-xs focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 text-xs"
              >
                <option value={10}>Top 10 Excerpts</option>
                <option value={20}>Top 20 Excerpts</option>
                <option value={50}>Top 50 Excerpts</option>
              </select>
            </div>
          </div>
        )}
      </form>

      {/* Results Area */}
      <div className="space-y-6">
        {isSearching ? (
          <div className="py-20 text-center space-y-3">
            <FaSpinner className="animate-spin text-4xl text-indigo-500 mx-auto" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Searching vector embeddings across indexed documents...</p>
          </div>
        ) : !hasSearched ? (
          <div className="mt-8">
            {recentSearches.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FaClock /> Recent Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((item, i) => {
                    const text = item.query || item;
                    return (
                      <button 
                        key={item.id || i}
                        onClick={() => handleRecentClick(text)}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 text-gray-700 dark:text-gray-300 px-3.5 py-1.5 rounded-full text-xs transition-colors shadow-xs"
                      >
                        {text}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : filteredResults.length > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Search Results</h2>
              <span className="text-xs text-gray-500">{filteredResults.length} relevant excerpts</span>
            </div>
            
            <div className="space-y-4">
              {filteredResults.map((result, idx) => {
                const scorePct = result.relevance_score !== undefined 
                  ? Math.round(result.relevance_score * 100) 
                  : null;

                return (
                  <div key={result.chunk_id || idx} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-xs hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <Link 
                        to={`/papers/${result.paper_id}${result.page_number ? `?page=${result.page_number}` : ''}`} 
                        className="text-base font-semibold text-indigo-600 dark:text-indigo-400 hover:underline line-clamp-1"
                      >
                        {result.paper_title || 'Document Excerpt'}
                      </Link>
                      {scorePct !== null && (
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                          scorePct >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                          scorePct >= 60 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {scorePct}% Match
                        </span>
                      )}
                    </div>
                    
                    {result.authors && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{result.authors}</p>
                    )}
                    
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-lg border-l-4 border-indigo-400 dark:border-indigo-600 relative">
                      <FaQuoteLeft className="text-gray-200 dark:text-gray-700 absolute top-3 left-3 text-2xl z-0" />
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed relative z-10 pl-5">
                        {result.content}
                      </p>
                      <div className="mt-2.5 flex items-center justify-between pl-5 relative z-10">
                        {result.page_number ? (
                          <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                            <FaBook /> Page {result.page_number}
                          </span>
                        ) : <span />}
                        <Link 
                          to={`/papers/${result.paper_id}${result.page_number ? `?page=${result.page_number}` : ''}`} 
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                        >
                          View in Document →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400 text-2xl">
              <FaSearch />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No relevant results found</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              We couldn't find matches for "{query}". Try lowering the relevance threshold or searching for different concepts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
