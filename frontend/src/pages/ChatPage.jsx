import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FaPlus, FaTrash, FaCommentAlt, FaPaperPlane, 
  FaRobot, FaUser, FaSpinner, FaLayerGroup,
  FaChevronDown, FaCheckSquare, FaSquare, FaExclamationTriangle
} from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import chatService from '../services/chatService';
import paperService from '../services/paperService';
import CitationCard from '../components/chat/CitationCard';

const ChatPage = () => {
  const { id: urlChatId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(urlChatId || null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isPaperDeleted, setIsPaperDeleted] = useState(false);
  
  // Multi-paper selection state
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [availablePapers, setAvailablePapers] = useState([]);
  const [selectedPapers, setSelectedPapers] = useState([]);
  
  const messagesEndRef = useRef(null);

  // Load available papers and conversations on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [papersData, convsData] = await Promise.all([
        paperService.getPapers({ limit: 100 }).catch(() => ({ papers: [] })),
        chatService.getConversations().catch(() => [])
      ]);
      
      const papersList = papersData.papers || (Array.isArray(papersData) ? papersData : []);
      setAvailablePapers(papersList);
      
      const convList = Array.isArray(convsData) ? convsData : [];
      setConversations(convList);

      // If URL has chatId, load it
      if (urlChatId) {
        loadChat(urlChatId);
      }
    } catch (err) {
      console.error("Failed to load chat workspace data", err);
      toast.error("Failed to load chat data");
    }
  };

  useEffect(() => {
    if (urlChatId && urlChatId !== activeChatId) {
      loadChat(urlChatId);
    }
  }, [urlChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setSelectedPapers([]);
    setIsPaperDeleted(false);
    navigate('/chat');
  };

  const loadChat = async (chatId) => {
    setActiveChatId(chatId);
    setIsLoadingHistory(true);
    setIsPaperDeleted(false);
    try {
      const data = await chatService.getConversation(chatId);
      setMessages(data.messages || []);
      
      // Update selected papers from conversation
      if (data.paper_ids && data.paper_ids.length > 0) {
        setSelectedPapers(data.paper_ids);
      } else if (data.paper_id) {
        setSelectedPapers([data.paper_id]);
      } else {
        setSelectedPapers([]);
      }

      if (data.paper_deleted) {
        setIsPaperDeleted(true);
      }
    } catch (err) {
      console.error("Failed to load conversation", err);
      toast.error(err.response?.data?.detail || "Failed to load conversation history");
      startNewChat();
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDeleteConversation = async (e, chatId) => {
    e.stopPropagation();
    try {
      await chatService.deleteConversation(chatId);
      setConversations(prev => prev.filter(c => c.id !== chatId));
      toast.success("Conversation deleted");
      if (activeChatId === chatId) {
        startNewChat();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete conversation");
    }
  };

  const togglePaperSelection = (paperId) => {
    if (isPaperDeleted) return;
    if (selectedPapers.includes(paperId)) {
      setSelectedPapers(selectedPapers.filter(id => id !== paperId));
    } else {
      setSelectedPapers([...selectedPapers, paperId]);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || isTyping || isPaperDeleted) return;

    if (selectedPapers.length === 0 && !activeChatId) {
      toast.error('Please select at least one paper to chat with.');
      setIsSelectorOpen(true);
      return;
    }

    const userText = inputMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const userMessage = { id: tempId, role: 'user', content: userText };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const payload = {
        message: userText,
        conversation_id: activeChatId || undefined,
        paper_id: selectedPapers.length === 1 ? selectedPapers[0] : undefined,
        paper_ids: selectedPapers.length > 1 ? selectedPapers : undefined
      };

      const response = await chatService.sendMessage(payload);

      const assistantMsg = response.message || {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.answer || response.content || "No response received.",
        citations: response.citations || []
      };

      setMessages(prev => [...prev, assistantMsg]);

      // If new conversation, sync active chat ID and reload list
      if (!activeChatId && response.conversation_id) {
        setActiveChatId(response.conversation_id);
        navigate(`/chat/${response.conversation_id}`, { replace: true });
        
        // Add or refresh conversations list
        const updatedList = await chatService.getConversations().catch(() => []);
        setConversations(updatedList);
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setIsPaperDeleted(true);
        toast.error("Source paper has been deleted. Conversation is read-only.");
      } else {
        const errorDetail = err.response?.data?.detail || "Failed to get AI response. Please try again.";
        toast.error(errorDetail);
        setMessages(prev => [
          ...prev,
          {
            id: `err-${Date.now()}`,
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

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      
      {/* Sidebar: Conversation History */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-gray-900/50 hidden md:flex shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button 
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <FaPlus /> New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 flex items-center justify-between">
            <span>Conversations</span>
            <span className="text-[11px] font-normal lowercase">{conversations.length} total</span>
          </div>
          
          {conversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-gray-400">
              No conversations yet. Start a chat by selecting papers above!
            </div>
          ) : (
            conversations.map(chat => (
              <div 
                key={chat.id}
                onClick={() => {
                  navigate(`/chat/${chat.id}`);
                  loadChat(chat.id);
                }}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  activeChatId === chat.id 
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1 pr-2">
                  <FaCommentAlt className={`text-xs shrink-0 ${activeChatId === chat.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                  <div className="truncate min-w-0">
                    <div className="text-sm font-medium truncate">{chat.title || 'Untitled Conversation'}</div>
                    <div className="text-xs opacity-70 truncate flex items-center gap-1.5">
                      {chat.paper_deleted ? (
                        <span className="text-red-500 font-semibold">[Paper Deleted]</span>
                      ) : (
                        <span>{chat.paper_name || (chat.paper_ids?.length ? `${chat.paper_ids.length} papers` : 'General')}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDeleteConversation(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1.5 rounded transition-all shrink-0"
                  title="Delete conversation"
                >
                  <FaTrash className="text-xs" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* Top Header - Paper Selector */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3.5 shrink-0 relative z-20 shadow-xs">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="relative">
              <button 
                onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                disabled={isPaperDeleted}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <FaLayerGroup className="text-indigo-500 text-xs" />
                <span>
                  {selectedPapers.length === 0 
                    ? 'Select Papers to Chat With' 
                    : `${selectedPapers.length} Paper${selectedPapers.length > 1 ? 's' : ''} Selected`}
                </span>
                <FaChevronDown className="text-xs ml-1 opacity-60" />
              </button>

              {/* Dropdown Menu */}
              {isSelectorOpen && (
                <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <span>Available Research Papers</span>
                    {selectedPapers.length > 0 && (
                      <button 
                        onClick={() => setSelectedPapers([])} 
                        className="text-indigo-600 dark:text-indigo-400 hover:underline text-[11px]"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                    {availablePapers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-500">
                        No papers found. <Link to="/upload" className="text-indigo-600 dark:text-indigo-400 underline">Upload a paper</Link> first.
                      </div>
                    ) : (
                      availablePapers.map(paper => {
                        const isReady = paper.processing_status === 'completed';
                        const isSelected = selectedPapers.includes(paper.id);
                        return (
                          <div 
                            key={paper.id}
                            onClick={() => isReady && togglePaperSelection(paper.id)}
                            className={`px-4 py-2.5 flex items-start gap-3 transition-colors ${
                              !isReady 
                                ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                            }`}
                          >
                            <div className="mt-0.5 text-indigo-600 dark:text-indigo-400 shrink-0">
                              {isSelected ? <FaCheckSquare /> : <FaSquare className="text-gray-300 dark:text-gray-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 line-clamp-1" title={paper.title}>
                                {paper.title}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                                <span>{paper.page_count ? `${paper.page_count}p` : 'PDF'}</span>
                                {!isReady && (
                                  <span className="text-amber-500 font-medium">({paper.processing_status})</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile New Chat Button */}
            <button 
              onClick={startNewChat}
              className="md:hidden p-2 text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm"
              title="New Chat"
            >
              <FaPlus />
            </button>
          </div>
        </div>

        {/* Overlay for paper selector dropdown */}
        {isSelectorOpen && (
          <div className="fixed inset-0 z-10" onClick={() => setIsSelectorOpen(false)}></div>
        )}

        {/* Paper Deleted Warning Banner */}
        {isPaperDeleted && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2">
            <FaExclamationTriangle className="text-amber-600 shrink-0" />
            <span>The source paper for this conversation was deleted. This chat is preserved in read-only mode.</span>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900/30">
          <div className="max-w-4xl mx-auto space-y-5">
            
            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <FaSpinner className="animate-spin text-3xl text-indigo-600 mb-3" />
                <p className="text-sm">Loading conversation history...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-xs">
                  <FaRobot className="text-3xl" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Research Paper Assistant</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
                  {selectedPapers.length === 0 
                    ? "Select one or more research papers from the top dropdown to ask questions, compare methodologies, and view cited passages."
                    : `Ready to answer questions across ${selectedPapers.length} selected paper${selectedPapers.length > 1 ? 's' : ''}.`}
                </p>
                {selectedPapers.length > 0 && (
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <button 
                      onClick={() => setInputMessage("Summarize the key contributions and novelty.")} 
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs px-3.5 py-2 rounded-full hover:shadow-sm transition-all text-gray-700 dark:text-gray-300"
                    >
                      Summarize contributions
                    </button>
                    <button 
                      onClick={() => setInputMessage("Explain the methodology and experimental setup.")} 
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs px-3.5 py-2 rounded-full hover:shadow-sm transition-all text-gray-700 dark:text-gray-300"
                    >
                      Explain methodology
                    </button>
                    {selectedPapers.length > 1 && (
                      <button 
                        onClick={() => setInputMessage("Compare the architectures and key findings between these papers in a table.")} 
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs px-3.5 py-2 rounded-full hover:shadow-sm transition-all text-gray-700 dark:text-gray-300"
                      >
                        Compare papers
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg, i) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id || i} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                      isUser ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                    }`}>
                      {isUser ? <FaUser className="text-xs" /> : <FaRobot className="text-xs" />}
                    </div>
                    
                    <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isUser 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : msg.isError
                          ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-tl-none'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-xs'
                      }`}>
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                      
                      {/* Citations */}
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2.5 space-y-1.5 w-full">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Sources & Citations:
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {msg.citations.map((cite, j) => (
                              <CitationCard key={j} citation={cite} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-1">
                  <FaRobot className="text-xs" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-xs flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0 relative z-20">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative flex items-end bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isPaperDeleted || (selectedPapers.length === 0 && !activeChatId)}
                placeholder={
                  isPaperDeleted 
                    ? "Paper deleted. Conversation is read-only."
                    : selectedPapers.length === 0 && !activeChatId
                    ? "Select at least one paper above to start chatting..."
                    : `Ask a question across ${selectedPapers.length || 1} paper(s)...`
                }
                className="w-full max-h-32 bg-transparent text-gray-900 dark:text-white p-3.5 pr-14 focus:outline-none resize-none text-sm disabled:opacity-60"
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button 
                type="submit"
                disabled={!inputMessage.trim() || isTyping || isPaperDeleted || (selectedPapers.length === 0 && !activeChatId)}
                className="absolute right-2 bottom-2 p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-400 transition-colors"
                title="Send message"
              >
                <FaPaperPlane className="text-xs" />
              </button>
            </form>
            <div className="text-center mt-2 text-[11px] text-gray-400">
              AI answers are grounded in selected paper text vectors. Always verify critical citations.
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ChatPage;
