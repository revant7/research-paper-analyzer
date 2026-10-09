import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FaAlignLeft, FaComments, FaSearch, FaFilePdf, 
  FaSpinner, FaPaperPlane, FaRedo, FaExpand, 
  FaCompress, FaBook, FaLightbulb, FaExclamationTriangle,
  FaCheckCircle, FaListUl, FaFlask
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import paperService from '../services/paperService';
import chatService from '../services/chatService';
import searchService from '../services/searchService';
import puterService from '../services/puterService';

const PaperViewerPage = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('summary'); // summary, chat, search
  const [isPdfExpanded, setIsPdfExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paper, setPaper] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfError, setPdfError] = useState(null);

  // Summary state
  const [summary, setSummary] = useState(null);
  const [_isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isSummaryGenerating, setIsSummaryGenerating] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const pollTimerRef = useRef(null);

  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isPaperDeleted, setIsPaperDeleted] = useState(false);
  const messagesEndRef = useRef(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Cleanup PDF blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [pdfBlobUrl]);

  // Initial fetch for paper details and PDF
  useEffect(() => {
    let isMounted = true;

    const loadPaperData = async () => {
      setIsLoading(true);
      try {
        const paperData = await paperService.getPaper(id);
        if (!isMounted) return;
        setPaper(paperData);

        // Initialize chat with personalized greeting
        setChatHistory([
          {
            role: 'assistant',
            content: `Hello! I am your AI research assistant. I have indexed "${paperData.title}". Feel free to ask any questions about its methodology, findings, or contributions!`
          }
        ]);

        // Load PDF blob
        try {
          const blobUrl = await paperService.getPaperPdf(id);
          if (isMounted) setPdfBlobUrl(blobUrl);
        } catch (pdfErr) {
          console.error("Failed to load PDF blob:", pdfErr);
          if (isMounted) setPdfError("Unable to render PDF document preview.");
        }

        // Check summary status
        checkOrLoadSummary(id, paperData.summary_status);

      } catch (err) {
        console.error("Failed to load paper details:", err);
        toast.error("Failed to load paper details");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadPaperData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Polling / fetching summary
  const checkOrLoadSummary = useCallback(async (paperId, initialStatus) => {
    setIsSummaryLoading(true);
    setSummaryError(null);

    try {
      const response = await paperService.getSummary(paperId);

      // Backend returns 202 JSON with status: "processing"
      if (response?.status === 'processing') {
        setIsSummaryGenerating(true);
        pollSummary(paperId);
      } else if (response && (response.tldr || response.methodology || response.research_objective || response.objective)) {
        setSummary(response);
        setIsSummaryGenerating(false);
      }
    } catch (err) {
      if (err.response?.status === 202) {
        setIsSummaryGenerating(true);
        pollSummary(paperId);
      } else if (err.response?.status === 404) {
        // Summary not yet generated
        setSummary(null);
        setIsSummaryGenerating(false);
      } else {
        setSummaryError(err.response?.data?.detail || "Failed to load summary.");
        setIsSummaryGenerating(false);
      }
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  const pollSummary = useCallback((paperId, attempt = 1) => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

    // Stop polling after ~40 attempts (~2 minutes)
    if (attempt > 40) {
      setIsSummaryGenerating(false);
      setSummaryError("Summary generation is taking longer than expected. Please check back shortly.");
      return;
    }

    pollTimerRef.current = setTimeout(async () => {
      try {
        const response = await paperService.getSummary(paperId);
        if (response?.status === 'processing') {
          pollSummary(paperId, attempt + 1);
        } else if (response && (response.tldr || response.methodology || response.research_objective || response.objective)) {
          setSummary(response);
          setIsSummaryGenerating(false);
          toast.success("Summary generation complete!");
        } else {
          pollSummary(paperId, attempt + 1);
        }
      } catch (err) {
        if (err.response?.status === 202) {
          pollSummary(paperId, attempt + 1);
        } else if (err.response?.status === 404) {
          pollSummary(paperId, attempt + 1);
        } else {
          setIsSummaryGenerating(false);
          setSummaryError(err.response?.data?.detail || "Summary generation encountered an error.");
        }
      }
    }, Math.min(2500 + attempt * 200, 5000));
  }, []);

  const handleGenerateSummary = async (force = false) => {
    if (paper?.processing_status !== 'completed') {
      toast.error("Please wait until paper processing completes before generating a summary.");
      return;
    }

    setIsSummaryGenerating(true);
    setSummaryError(null);
    try {
      const paperText = await paperService.getPaperText(id);
      const generated = await puterService.generateSummary(
        paperText.text,
        paperText.title || paper?.title,
        paperText.authors || paper?.authors
      );
      const saved = await paperService.saveClientSummary(id, generated);
      setSummary(saved);
      setIsSummaryGenerating(false);
      toast.success("Real AI summary generated with Puter Llama.");
    } catch (err) {
      setIsSummaryGenerating(false);
      const detail = err.response?.data?.detail || err.message || "Failed to generate AI summary.";
      setSummaryError(detail);
      toast.error(detail);
    }
  };

  const handleReprocessPaper = async () => {
    try {
      await paperService.reprocessPaper(id);
      toast.success("Reprocessing initiated. Refreshing status...");
      setPaper(prev => ({ ...prev, processing_status: 'processing' }));
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to reprocess paper.");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatMessage.trim() || isTyping || isPaperDeleted) return;

    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const searchData = await searchService.search(userMsg, { paper_ids: [id], limit: 5 });
      const context = (searchData.results || []).map((result, index) =>
        `[Excerpt ${index + 1}, page ${result.page_number || 1}]\n${result.content}`
      ).join('\n\n');
      const answer = await puterService.answerQuestion(userMsg, context, chatHistory);

      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
          citations: (searchData.results || []).map((result) => ({
            page_number: result.page_number,
            content: result.content,
            paper_title: result.paper_title
          }))
        }
      ]);
    } catch (err) {
      if (err.response?.status === 409) {
        setIsPaperDeleted(true);
        toast.error("This paper has been deleted. Further chat is disabled.");
      } else {
        const errorDetail = err.response?.data?.detail || err.message || "Failed to receive AI response. Please try again.";
        toast.error(errorDetail);
        setChatHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ Error: ${errorDetail}`,
            isError: true
          }
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const data = await searchService.search(searchQuery.trim(), { paper_ids: [id], limit: 15 });
      setSearchResults(data.results || []);
    } catch (err) {
      console.error("Search failed:", err);
      toast.error(err.response?.data?.detail || "Failed to search within paper.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300">Loading paper analysis...</h2>
        </div>
      </div>
    );
  }

  const keywordsList = summary?.keywords 
    ? (Array.isArray(summary.keywords) ? summary.keywords : [summary.keywords]) 
    : [];

  const keyContributions = summary?.key_contributions || summary?.keyContributions || [];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      
      {/* PDF Panel - Left */}
      <div className={`transition-all duration-300 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-950 ${isPdfExpanded ? 'w-full md:w-full z-10 absolute inset-0' : 'w-full md:w-[60%]'}`}>
        {/* PDF Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex justify-between items-center shadow-sm z-10 shrink-0">
          <div className="flex items-center min-w-0">
            <FaFilePdf className="text-red-500 mr-3 text-xl shrink-0" />
            <div className="truncate pr-4">
              <h1 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate" title={paper?.title}>
                {paper?.title || 'Research Document'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {paper?.authors || 'Unknown authors'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {paper?.page_count ? (
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded hidden sm:inline-block">
                {paper.page_count} pages
              </span>
            ) : null}
            <button 
              onClick={() => setIsPdfExpanded(!isPdfExpanded)}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title={isPdfExpanded ? "Collapse PDF" : "Expand PDF"}
            >
              {isPdfExpanded ? <FaCompress /> : <FaExpand />}
            </button>
          </div>
        </div>

        {/* Actual PDF Viewer using authenticated object URL */}
        <div className="flex-1 w-full bg-gray-200 dark:bg-gray-900 overflow-hidden relative">
          {pdfBlobUrl ? (
            <iframe 
              src={`${pdfBlobUrl}#toolbar=1&navpanes=0`} 
              className="w-full h-full border-none absolute inset-0"
              title="PDF Viewer"
            />
          ) : pdfError ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <FaExclamationTriangle className="text-amber-500 text-4xl mb-3" />
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">{pdfError}</p>
              <p className="text-xs text-gray-500 max-w-sm">The document file may be missing on the server or storage path.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <FaSpinner className="animate-spin text-3xl text-indigo-600 mb-2" />
              <p className="text-sm text-gray-500">Rendering document stream...</p>
            </div>
          )}
        </div>
      </div>

      {/* Tools Panel - Right */}
      <div className={`flex flex-col bg-white dark:bg-gray-800 transition-all duration-300 ${isPdfExpanded ? 'hidden' : 'w-full md:w-[40%] h-full'}`}>
        
        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0 bg-gray-50 dark:bg-gray-800">
          <button 
            className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'summary' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('summary')}
          >
            <FaAlignLeft /> Summary
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'chat' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('chat')}
          >
            <FaComments /> Chat
          </button>
          <button 
            className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 border-b-2 transition-colors ${activeTab === 'search' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('search')}
          >
            <FaSearch /> Search
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          
          {/* SUMMARY TAB */}
          {activeTab === 'summary' && (
            <div className="p-6 space-y-6 animate-fadeIn">
              {/* Paper Processing Status Alert if not completed */}
              {paper?.processing_status === 'processing' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl flex items-start gap-3">
                  <FaSpinner className="animate-spin text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 dark:text-blue-200">Paper is currently processing</p>
                    <p className="text-blue-700 dark:text-blue-300 text-xs mt-0.5">Vector embeddings are being computed. Summarization will be available once indexing finishes.</p>
                  </div>
                </div>
              )}

              {paper?.processing_status === 'failed' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-red-600 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-red-900 dark:text-red-200">Paper processing failed</p>
                      <p className="text-red-700 dark:text-red-300 text-xs mt-0.5">{paper?.processing_error || "PDF extraction encountered an error."}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleReprocessPaper}
                    className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 shrink-0"
                  >
                    Reprocess
                  </button>
                </div>
              )}

              {summaryError && !isSummaryGenerating && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center justify-between text-xs text-red-700 dark:text-red-300">
                  <span>{summaryError}</span>
                  <button onClick={() => handleGenerateSummary(true)} className="underline font-semibold ml-2">Retry</button>
                </div>
              )}

              {/* Summary Loading / Generating States */}
              {isSummaryGenerating ? (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-8 rounded-xl text-center">
                  <FaSpinner className="animate-spin text-3xl text-indigo-600 dark:text-indigo-400 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Generating AI Summary...</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    Map-reducing paper sections, extracting research objectives, methodology, and key contributions.
                  </p>
                </div>
              ) : summary ? (
                <>
                  {/* TL;DR Section */}
                  {summary.tldr && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-5 rounded-xl">
                      <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FaLightbulb /> TL;DR
                      </h3>
                      <p className="text-indigo-900 dark:text-indigo-100 leading-relaxed text-sm">
                        {summary.tldr}
                      </p>
                    </div>
                  )}

                  {/* Keywords */}
                  {keywordsList.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {keywordsList.map((kw, i) => (
                        <span key={i} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1 rounded-full font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Main Summary Sections */}
                  <div className="space-y-6">
                    {(summary.research_objective || summary.objective) && (
                      <section>
                        <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 mb-2 flex items-center gap-2">
                          <FaBook className="text-indigo-500 text-sm" /> Research Objective
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-line">
                          {summary.research_objective || summary.objective}
                        </p>
                      </section>
                    )}

                    {(summary.problem_statement || summary.problemStatement) && (
                      <section>
                        <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 mb-2">
                          Problem Statement
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-line">
                          {summary.problem_statement || summary.problemStatement}
                        </p>
                      </section>
                    )}

                    {summary.methodology && (
                      <section>
                        <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 mb-2 flex items-center gap-2">
                          <FaFlask className="text-indigo-500 text-sm" /> Methodology
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-line">
                          {summary.methodology}
                        </p>
                      </section>
                    )}

                    {summary.dataset && (
                      <section>
                        <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 mb-2">
                          Dataset & Evaluation Setup
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-line">
                          {summary.dataset}
                        </p>
                      </section>
                    )}

                    {(summary.key_findings || summary.results) && (
                      <section>
                        <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 mb-2 flex items-center gap-2">
                          <FaCheckCircle className="text-green-500 text-sm" /> Key Results & Findings
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-line">
                          {summary.key_findings || summary.results}
                        </p>
                      </section>
                    )}

                    {Array.isArray(keyContributions) && keyContributions.length > 0 && (
                      <section>
                        <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 mb-2 flex items-center gap-2">
                          <FaListUl className="text-indigo-500 text-sm" /> Key Contributions
                        </h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                          {keyContributions.map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {summary.limitations && (
                      <section>
                        <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 mb-2">
                          Limitations
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-line">
                          {summary.limitations}
                        </p>
                      </section>
                    )}

                    {summary.conclusion && (
                      <section>
                        <h3 className="text-md font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 mb-2">
                          Conclusion
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-line">
                          {summary.conclusion}
                        </p>
                      </section>
                    )}
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-700 flex justify-center">
                    <button 
                      onClick={() => handleGenerateSummary(true)}
                      disabled={isSummaryGenerating}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
                    >
                      <FaRedo /> Regenerate Summary
                    </button>
                  </div>
                </>
              ) : (
                /* No Summary Yet State */
                <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                  <FaAlignLeft className="text-4xl text-gray-400 mx-auto mb-3 opacity-50" />
                  <h4 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-1">
                    No summary generated yet
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
                    Generate an AI-powered comprehensive summary covering objectives, methodology, and key contributions.
                  </p>
                  <button
                    onClick={() => handleGenerateSummary(false)}
                    disabled={isSummaryGenerating || paper?.processing_status !== 'completed'}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaLightbulb /> Generate AI Summary
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full absolute inset-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : msg.isError
                        ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-bl-none border border-red-200 dark:border-red-800'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
                    }`}>
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-300 block">
                            Citations & Sources:
                          </span>
                          {msg.citations.map((cite, i) => (
                            <div key={i} className="block w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md p-2 text-xs shadow-xs">
                              <span className="text-indigo-600 dark:text-indigo-400 font-semibold mb-0.5 block">
                                Page {cite.page_number || cite.page || 'N/A'}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 line-clamp-2 italic">
                                "{cite.content || cite.text || cite.excerpt || ''}"
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
                <div className="flex flex-wrap gap-2 mb-3">
                  <button 
                    onClick={() => setChatMessage("What is the main contribution of this paper?")} 
                    className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full transition-colors border border-gray-200 dark:border-gray-600"
                  >
                    Main contributions
                  </button>
                  <button 
                    onClick={() => setChatMessage("Explain the methodology used in this work.")} 
                    className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full transition-colors border border-gray-200 dark:border-gray-600"
                  >
                    Explain methodology
                  </button>
                </div>
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    disabled={isPaperDeleted}
                    placeholder={isPaperDeleted ? "Paper has been deleted. Chat is read-only." : "Ask a question about this paper..."}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                  />
                  <button 
                    type="submit" 
                    disabled={!chatMessage.trim() || isTyping || isPaperDeleted}
                    className="absolute right-1.5 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaPaperPlane className="text-sm" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* SEARCH TAB */}
          {activeTab === 'search' && (
            <div className="flex flex-col h-full absolute inset-0 p-4">
              <form onSubmit={handleSearch} className="mb-4 shrink-0">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search within this paper..."
                    className="block w-full pl-10 pr-20 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm"
                  />
                  <button 
                    type="submit" 
                    disabled={!searchQuery.trim() || isSearching}
                    className="absolute inset-y-1.5 right-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isSearching ? <FaSpinner className="animate-spin" /> : 'Search'}
                  </button>
                </div>
              </form>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {isSearching ? (
                  <div className="flex justify-center py-10">
                    <FaSpinner className="animate-spin text-3xl text-indigo-500" />
                  </div>
                ) : hasSearched && searchResults.length > 0 ? (
                  <>
                    <p className="text-xs text-gray-500 font-medium pb-2 border-b border-gray-100 dark:border-gray-700">
                      Found {searchResults.length} matching excerpts
                    </p>
                    {searchResults.map((res, idx) => (
                      <div key={res.chunk_id || idx} className="bg-gray-50 dark:bg-gray-700/50 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                            <FaBook /> Page {res.page_number || 'N/A'}
                          </span>
                          {res.relevance_score !== undefined && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Score: {Math.round(res.relevance_score * 100)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic">
                          "{res.content}"
                        </p>
                      </div>
                    ))}
                  </>
                ) : hasSearched && !isSearching ? (
                  <div className="text-center py-10 text-gray-500 text-sm">
                    No matching excerpts found. Try asking a question in the Chat tab!
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                    <FaSearch className="text-4xl mb-3 opacity-20" />
                    <p className="text-sm">Enter a keyword or phrase to retrieve relevant passages</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaperViewerPage;
