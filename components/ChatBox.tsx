import React, { useContext, useState, useRef, useEffect } from 'react';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { User, ChatMessage } from '../types';
import Modal from './Modal';
import { useWebSocket } from '../hooks/useWebSocket';

interface ChatBoxProps {
  chatId: string;
  chatType: 'story' | 'project';
  permissions: { canView: boolean; canChat: boolean };
}

const ChatBox: React.FC<ChatBoxProps> = ({ chatId, chatType, permissions }) => {
  const dataContext = useContext(DataContext);
  const authContext = useContext(AuthContext);
  const toastContext = useContext(ToastContext);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [messageToEdit, setMessageToEdit] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [imagePreview, setImagePreview] = useState<{url: string, name: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [displayCount, setDisplayCount] = useState(50);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [focusedMessageIndex, setFocusedMessageIndex] = useState<number>(-1);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  if (!dataContext || !authContext || !toastContext) return null;

  const { users, storyChats, projectChats, addChatMessage, deleteChatMessage } = dataContext;
  const { currentUser } = authContext;
  const { addToast } = toastContext;

  // WebSocket connection for real-time chat
  const wsUrl = chatId 
    ? `ws://localhost:8000/ws/chat/${chatType}/${chatId}/`
    : null;

  const { isConnected, sendMessage: sendWsMessage } = useWebSocket(wsUrl, {
    onMessage: (data) => {
      console.log('[ChatBox] WebSocket message received:', data);
      if (data.type === 'chat_message') {
        console.log('[ChatBox] Chat message detected, refreshing...');
        // Force refresh messages when new message arrives via WebSocket
        if (chatType === 'story') {
          console.log('[ChatBox] Fetching story chats for:', chatId);
          dataContext.fetchStoryChats(chatId, true);
        } else {
          console.log('[ChatBox] Fetching project chats for:', chatId);
          dataContext.fetchProjectChats(chatId, true);
        }
      }
    },
  });

  const allMessages =
    chatType === 'story'
      ? storyChats[chatId] || []
      : projectChats[chatId] || [];

  // Filter messages by search query
  const filteredMessages = searchQuery
    ? allMessages.filter(msg => 
        msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getUserById(msg.authorId)?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getUserById(msg.authorId)?.lastName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allMessages;

  // Paginate messages (show latest first, then load more)
  const messages = filteredMessages.slice(-displayCount);
  const hasMoreMessages = filteredMessages.length > displayCount;

  useEffect(() => {
    // Only auto-scroll when new messages arrive, not when selecting messages
    if (shouldAutoScroll) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, shouldAutoScroll]); // Only depend on message count, not the entire messages array

  // Auto-refresh removed - WebSocket provides real-time updates

  const getUserById = (id: string): User | undefined => users.find(u => u.id === id);

  const handleSendMessage = async () => {
    if ((newMessage.trim() === '' && !attachment) || !currentUser || !permissions.canChat || isSending) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      authorId: currentUser.id,
      timestamp: new Date().toISOString(),
      text: newMessage,
    };

    if (attachment) {
      // Check file size (max 10MB)
      if (attachment.size > 10 * 1024 * 1024) {
        addToast('File size must be less than 10MB', 'error');
        return;
      }
      
      setIsSending(true);
      // Convert file to base64 data URL for storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        if (!dataUrl || dataUrl === 'data:') {
          addToast('Failed to read file. Please try again.', 'error');
          setIsSending(false);
          return;
        }
        
        message.attachment = {
          name: attachment.name,
          url: dataUrl,
        };
        
        try {
          await addChatMessage(chatId, chatType, message);
          setNewMessage('');
          setAttachment(null);
          if(fileInputRef.current) fileInputRef.current.value = '';
          addToast('File uploaded successfully', 'success');
        } catch (error) {
          addToast('Failed to send message. Please try again.', 'error');
        } finally {
          setIsSending(false);
        }
      };
      reader.onerror = () => {
        addToast('Failed to read file. Please try again.', 'error');
        setIsSending(false);
      };
      reader.readAsDataURL(attachment);
      return;
    }
    
    setIsSending(true);
    try {
      // Send via WebSocket for instant delivery
      if (isConnected) {
        sendWsMessage({
          type: 'chat_message',
          chat_id: chatId,
          chat_type: chatType,
          message: message,
        });
        setNewMessage('');
      } else {
        // Fallback to HTTP if WebSocket disconnected
        await addChatMessage(chatId, chatType, message);
        setNewMessage('');
      }
      setAttachment(null);
      if(fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      addToast('Failed to send message. Please try again.', 'error');
    } finally {
      setIsSending(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Increase limit to 10MB
      if (file.size > 10 * 1024 * 1024) {
        addToast('File size must be less than 10MB', 'error');
        return;
      }
      setAttachment(file);
    }
  };
  
  const handleDeleteConfirm = async () => {
    if (messageToDelete) {
      // Check if it's a bulk delete
      if (messageToDelete.id === 'BULK_DELETE') {
        await handleBulkDeleteConfirm();
      } else {
        try {
          await deleteChatMessage(chatId, chatType, messageToDelete.id);
          addToast('Message deleted.', 'info');
          setMessageToDelete(null);
        } catch (error) {
          addToast('Failed to delete message. Please try again.', 'error');
        }
      }
    }
  };

  const handleEditMessage = (msg: ChatMessage) => {
    setMessageToEdit(msg);
    setEditText(msg.text || '');
  };

  const handleSaveEdit = async () => {
    if (!messageToEdit || !editText.trim()) return;

    try {
      // Delete old message and send new one (simpler than updating)
      await deleteChatMessage(chatId, chatType, messageToEdit.id);
      
      const updatedMessage: ChatMessage = {
        ...messageToEdit,
        text: editText,
        timestamp: new Date().toISOString(),
      };
      
      await addChatMessage(chatId, chatType, updatedMessage);
      addToast('Message updated', 'success');
      setMessageToEdit(null);
      setEditText('');
    } catch (error) {
      addToast('Failed to update message', 'error');
    }
  };

  const handleLoadMore = () => {
    setShouldAutoScroll(false); // Disable auto-scroll when loading older messages
    setDisplayCount(prev => prev + 50);
  };

  // Detect if user is at the bottom of the chat
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      setShouldAutoScroll(isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMessageClick = (msgId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+Click to toggle selection
      setShouldAutoScroll(false); // Disable auto-scroll when selecting messages
      setSelectionMode(true);
      setSelectedMessages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(msgId)) {
          newSet.delete(msgId);
        } else {
          newSet.add(msgId);
        }
        return newSet;
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedMessages.size === 0) return;
    // Set a special flag to indicate bulk delete
    setMessageToDelete({ id: 'BULK_DELETE', authorId: '', timestamp: '', text: '' } as ChatMessage);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedMessages.size === 0) return;
    
    try {
      // Delete all selected messages
      await Promise.all(
        Array.from(selectedMessages).map(msgId =>
          deleteChatMessage(chatId, chatType, msgId)
        )
      );
      addToast(`${selectedMessages.size} message(s) deleted`, 'success');
      setSelectedMessages(new Set());
      setSelectionMode(false);
      setMessageToDelete(null);
      setShouldAutoScroll(true); // Re-enable auto-scroll after deletion
    } catch (error) {
      addToast('Failed to delete messages', 'error');
    }
  };

  const handleCancelSelection = () => {
    setSelectedMessages(new Set());
    setSelectionMode(false);
    setShouldAutoScroll(true); // Re-enable auto-scroll when exiting selection mode
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectionMode || messages.length === 0) return;

      const myMessages = messages.filter(msg => msg.authorId === currentUser?.id);
      if (myMessages.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedMessageIndex(prev => 
          prev < myMessages.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedMessageIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter' && focusedMessageIndex >= 0) {
        e.preventDefault();
        const msg = myMessages[focusedMessageIndex];
        setSelectedMessages(prev => {
          const newSet = new Set(prev);
          if (newSet.has(msg.id)) {
            newSet.delete(msg.id);
          } else {
            newSet.add(msg.id);
          }
          return newSet;
        });
      } else if (e.key === 'Escape') {
        handleCancelSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectionMode, messages, focusedMessageIndex, currentUser]);


  if (!permissions.canView) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        You do not have permission to view this chat.
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .scroll-smooth {
          scroll-behavior: smooth;
        }
        .scroll-smooth::-webkit-scrollbar {
          width: 6px;
        }
        .scroll-smooth::-webkit-scrollbar-track {
          background: transparent;
        }
        .scroll-smooth::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .scroll-smooth::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="flex flex-col h-[600px] bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl shadow-lg overflow-hidden relative">
        {/* Search Bar & Selection Mode */}
        <div className="p-4 border-b border-gray-200 bg-white backdrop-blur-sm bg-opacity-95 sticky top-0 z-10">
          {selectionMode ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {selectedMessages.size} selected
              </span>
              <button
                onClick={handleBulkDelete}
                disabled={selectedMessages.size === 0}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Selected
              </button>
              <button
                onClick={handleCancelSelection}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <span className="ml-auto text-xs text-gray-500">
                Ctrl+Click to select • Arrow keys to navigate • Enter to toggle • Esc to cancel
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Search messages"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </button>
            {showSearch && (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="flex-1 p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            )}
            {showSearch && searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-500">{messages.length} messages</span>
              <button
                onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                className={`p-2 rounded-lg transition-colors ${autoRefreshEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                title={autoRefreshEnabled ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            </div>
          )}
        </div>
        
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e5e7eb\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}>
          {hasMoreMessages && (
            <div className="text-center animate-fade-in">
              <button
                onClick={handleLoadMore}
                className="px-4 py-2 bg-white text-gray-600 rounded-full hover:bg-gray-50 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105"
              >
                ↑ Load {filteredMessages.length - displayCount} older messages
              </button>
            </div>
          )}
          {messages && messages.length > 0 ? (
            messages.map(msg => {
              const author = getUserById(msg.authorId);
              const isCurrentUser = author?.id === currentUser?.id;
              const isSelected = selectedMessages.has(msg.id);
              return (
                <div 
                  key={msg.id} 
                  className={`group flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : ''} ${isSelected ? 'bg-blue-50 bg-opacity-50 p-2 rounded-2xl' : ''} ${selectionMode && isCurrentUser ? 'cursor-pointer' : ''} animate-slide-up`}
                  onClick={(e) => isCurrentUser && handleMessageClick(msg.id, e)}
                  style={{
                    animation: 'slideUp 0.3s ease-out'
                  }}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 ${isCurrentUser ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'} text-white flex items-center justify-center font-bold text-xs shadow-md`}>
                      {author?.firstName.charAt(0)}{author?.lastName.charAt(0)}
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={`relative px-4 py-2 rounded-2xl max-w-xs md:max-w-md transition-all duration-200 ${
                    isCurrentUser 
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg rounded-br-sm' 
                      : 'bg-white text-gray-800 shadow-md rounded-bl-sm'
                  }`}>
                    {!isCurrentUser && (
                      <div className="font-semibold text-xs mb-1 text-gray-600">
                        {author?.firstName} {author?.lastName}
                      </div>
                    )}
                    {msg.text && <p className="text-sm leading-relaxed break-words">{msg.text}</p>}
                    {msg.attachment && (
                      <div className={`mt-2 p-2 rounded-md ${isCurrentUser ? 'bg-blue-600' : 'bg-gray-100'}`}>
                        {msg.attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <div>
                            <img 
                              src={msg.attachment.url} 
                              alt={msg.attachment.name}
                              loading="lazy"
                              className={`rounded transition-all duration-300 ${
                                imagePreview?.url === msg.attachment.url 
                                  ? 'w-full h-auto cursor-zoom-out' 
                                  : 'max-w-[200px] max-h-[150px] cursor-zoom-in hover:opacity-90'
                              }`}
                              style={{ 
                                objectFit: 'contain',
                                willChange: imagePreview?.url === msg.attachment.url ? 'auto' : 'transform',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (imagePreview?.url === msg.attachment!.url) {
                                  setImagePreview(null);
                                } else {
                                  setImagePreview({url: msg.attachment!.url, name: msg.attachment!.name});
                                }
                              }}
                              onLoad={(e) => {
                                // Prevent flickering by ensuring image is fully loaded
                                (e.target as HTMLImageElement).style.opacity = '1';
                              }}
                            />
                            {imagePreview?.url === msg.attachment.url && (
                              <p className="text-xs mt-1 opacity-75">Click image to minimize</p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                            const link = document.createElement('a');
                            link.href = msg.attachment!.url;
                            link.download = msg.attachment!.name;
                            link.click();
                          }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 flex-shrink-0 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3zM7 7a1 1 0 012 0v4a1 1 0 11-2 0V7z" clipRule="evenodd" />
                              <path d="M4 8V7a1 1 0 011-1h12a1 1 0 110 2H5a1 1 0 01-1-1z" />
                            </svg>
                            <span className={`text-sm truncate ${isCurrentUser ? 'text-white hover:underline' : 'text-blue-600 hover:underline'}`}>{msg.attachment.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`text-xs mt-1 flex items-center gap-1 ${isCurrentUser ? 'justify-end text-white text-opacity-80' : 'justify-end text-gray-500'}`}>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isCurrentUser && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {isCurrentUser && !selectionMode && (
                    <div className="self-end mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1">
                        {!msg.attachment && (
                          <button
                              onClick={() => handleEditMessage(msg)}
                              className="p-1.5 rounded-full bg-white shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200"
                              aria-label="Edit message"
                              title="Edit message"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                          </button>
                        )}
                        <button
                            onClick={() => setMessageToDelete(msg)}
                            className="p-1.5 rounded-full bg-white shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200"
                            aria-label="Delete message"
                            title="Delete message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-400 mt-8">No messages yet. Start the conversation!</div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 bg-white border-t border-gray-200 backdrop-blur-sm bg-opacity-95">
          {permissions.canChat ? (
            <>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="p-2.5 rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-110"
                  title="Attach file"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3zM7 7a1 1 0 012 0v4a1 1 0 11-2 0V7z" clipRule="evenodd" />
                    <path d="M4 8V7a1 1 0 011-1h12a1 1 0 110 2H5a1 1 0 01-1-1z" />
                  </svg>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 bg-gray-100 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 text-sm"
                  />
                </div>
                
                <button
                  onClick={handleSendMessage}
                  className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                  disabled={(!newMessage.trim() && !attachment) || isSending}
                  title="Send message"
                >
                  {isSending ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  )}
                </button>
              </div>
               {attachment && (
                <div className="text-xs text-gray-600 mt-2 flex items-center justify-between bg-gray-100 p-2 rounded-md">
                  <span>Attachment: {attachment.name}</span>
                  <button onClick={() => { setAttachment(null); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="text-red-500 ml-2 font-semibold hover:text-red-700">(Remove)</button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-sm text-gray-500 bg-gray-100 p-3 rounded-lg">
              Chat is disabled. You do not have permission to send messages.
            </div>
          )}
        </div>
      </div>
      <Modal
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        title={messageToDelete?.id === 'BULK_DELETE' ? `Delete ${selectedMessages.size} messages?` : "Delete message?"}
        size="sm"
        footer={
            <div className="flex justify-end gap-3">
                <button
                    onClick={() => setMessageToDelete(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                    Cancel
                </button>
                <button
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                    Delete for everyone
                </button>
            </div>
        }
      >
        <p className="text-gray-600">
          {messageToDelete?.id === 'BULK_DELETE' 
            ? `Are you sure you want to permanently delete ${selectedMessages.size} selected message(s)? This action cannot be undone.`
            : "Are you sure you want to permanently delete this message? This action cannot be undone."
          }
        </p>
      </Modal>

      <Modal
        isOpen={!!messageToEdit}
        onClose={() => {
          setMessageToEdit(null);
          setEditText('');
        }}
        title="Edit Message"
        size="md"
        footer={
            <div className="flex justify-end gap-3">
                <button
                    onClick={() => {
                      setMessageToEdit(null);
                      setEditText('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    disabled={!editText.trim()}
                >
                    Save Changes
                </button>
            </div>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={4}
            placeholder="Edit your message..."
          />
          <p className="text-xs text-gray-500 mt-2">Note: Edited messages will show the current timestamp.</p>
        </div>
      </Modal>
      

    </>
  );
};

export default ChatBox;