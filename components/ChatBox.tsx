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
  const [isSending, setIsSending] = useState(false);
  const [imagePreview, setImagePreview] = useState<{url: string, name: string} | null>(null);

  if (!dataContext || !authContext || !toastContext) return null;

  const { users, storyChats, projectChats, addChatMessage, deleteChatMessage } = dataContext;
  const { currentUser } = authContext;
  const { addToast } = toastContext;

  const messages =
    chatType === 'story'
      ? storyChats[chatId]
      : projectChats[chatId];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      // Check file size (max 5MB)
      if (attachment.size > 5 * 1024 * 1024) {
        addToast('File size must be less than 5MB', 'error');
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
      setAttachment(e.target.files[0]);
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages && messages.length > 0 ? (
            messages.map(msg => {
              const author = getUserById(msg.authorId);
              const isCurrentUser = author?.id === currentUser?.id;
              return (
                <div key={msg.id} className={`group flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 ${isCurrentUser ? 'bg-blue-500' : 'bg-gray-300'} text-white flex items-center justify-center font-bold`}>
                    {author?.firstName.charAt(0)}{author?.lastName.charAt(0)}
                  </div>
                  <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-white shadow-sm'}`}>
                    <div className="font-bold text-sm">
                      {author?.firstName} {author?.lastName} <span className="font-normal text-xs opacity-75 ml-2">{author?.role}</span>
                    </div>
                    {msg.text && <p className="text-sm mt-1 break-words">{msg.text}</p>}
                    {msg.attachment && (
                      <div className={`mt-2 p-2 rounded-md ${isCurrentUser ? 'bg-blue-600' : 'bg-gray-100'}`}>
                        {msg.attachment.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img 
                            src={msg.attachment.url} 
                            alt={msg.attachment.name}
                            className="max-w-full h-auto rounded cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setImagePreview({url: msg.attachment!.url, name: msg.attachment!.name})}
                          />
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
                    <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
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
      
      {/* Image Preview Modal */}
      {imagePreview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4"
          style={{ zIndex: 9999 }}
          onClick={() => setImagePreview(null)}
        >
          <div className="relative">
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-lg font-semibold bg-black bg-opacity-50 px-4 py-2 rounded"
            >
              ✕ Close
            </button>
            <img 
              src={imagePreview.url} 
              alt={imagePreview.name}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBox;