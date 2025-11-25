import React, { useContext, useState, useRef, useEffect } from 'react';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { User, ChatMessage } from '../types';
import Modal from './Modal';

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

  if (!dataContext || !authContext || !toastContext) return null;

  const { users, storyChats, projectChats, addChatMessage, deleteChatMessage } = dataContext;
  const { currentUser } = authContext;
  const { addToast } = toastContext;

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
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-refresh messages every 10 seconds
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    const interval = setInterval(() => {
      if (chatType === 'story') {
        dataContext.fetchStoryChats(chatId);
      } else {
        dataContext.fetchProjectChats(chatId);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [chatId, chatType, autoRefreshEnabled, dataContext]);

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
      await addChatMessage(chatId, chatType, message);
      setNewMessage('');
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
      try {
        await deleteChatMessage(chatId, chatType, messageToDelete.id);
        addToast('Message deleted.', 'info');
        setMessageToDelete(null);
      } catch (error) {
        addToast('Failed to delete message. Please try again.', 'error');
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
    setDisplayCount(prev => prev + 50);
  };

  const handleMessageClick = (msgId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+Click to toggle selection
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

  const handleBulkDelete = async () => {
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
    } catch (error) {
      addToast('Failed to delete messages', 'error');
    }
  };

  const handleCancelSelection = () => {
    setSelectedMessages(new Set());
    setSelectionMode(false);
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
      <div className="flex flex-col h-[500px] bg-gray-50 rounded-lg">
        {/* Search Bar & Selection Mode */}
        <div className="p-3 border-b border-gray-200 bg-white rounded-t-lg">
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
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {hasMoreMessages && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                Load More Messages ({filteredMessages.length - displayCount} older)
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
                  className={`group flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''} ${isSelected ? 'bg-blue-50 p-2 rounded-lg' : ''} ${selectionMode && isCurrentUser ? 'cursor-pointer' : ''}`}
                  onClick={(e) => isCurrentUser && handleMessageClick(msg.id, e)}
                >
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 ${isCurrentUser ? 'bg-blue-500' : 'bg-gray-300'} text-white flex items-center justify-center font-bold`}>
                      {author?.firstName.charAt(0)}{author?.lastName.charAt(0)}
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-white shadow-sm'}`}>
                    <div className="font-bold text-sm">
                      {author?.firstName} {author?.lastName} <span className="font-normal text-xs opacity-75 ml-2">{author?.role}</span>
                    </div>
                    {msg.text && <p className="text-sm mt-1 break-words">{msg.text}</p>}
                    {msg.attachment && (
                      <div className={`mt-2 p-2 rounded-md ${isCurrentUser ? 'bg-blue-600' : 'bg-gray-100'}`}>
                        {msg.attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <div>
                            <img 
                              src={msg.attachment.url} 
                              alt={msg.attachment.name}
                              className={`rounded transition-all duration-300 ${
                                imagePreview?.url === msg.attachment.url 
                                  ? 'w-full h-auto cursor-zoom-out' 
                                  : 'max-w-[200px] max-h-[150px] cursor-zoom-in hover:opacity-90'
                              }`}
                              style={{ objectFit: 'contain' }}
                              onClick={() => {
                                if (imagePreview?.url === msg.attachment!.url) {
                                  setImagePreview(null);
                                } else {
                                  setImagePreview({url: msg.attachment!.url, name: msg.attachment!.name});
                                }
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
                    <div className="text-xs opacity-60 text-right mt-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {isCurrentUser && (
                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {!msg.attachment && (
                          <button
                              onClick={() => handleEditMessage(msg)}
                              className="p-1 rounded-full hover:bg-black/10"
                              aria-label="Edit message"
                              title="Edit message"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                          </button>
                        )}
                        <button
                            onClick={() => setMessageToDelete(msg)}
                            className="p-1 rounded-full hover:bg-black/10"
                            aria-label="Delete message"
                            title="Delete message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
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
        <div className="p-4 border-t border-gray-200">
          {permissions.canChat ? (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
                  disabled={(!newMessage.trim() && !attachment) || isSending}
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3zM7 7a1 1 0 012 0v4a1 1 0 11-2 0V7z" clipRule="evenodd" />
                    <path d="M4 8V7a1 1 0 011-1h12a1 1 0 110 2H5a1 1 0 01-1-1z" />
                  </svg>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
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
        title="Delete message?"
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
        <p className="text-gray-600">Are you sure you want to permanently delete this message? This action cannot be undone.</p>
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