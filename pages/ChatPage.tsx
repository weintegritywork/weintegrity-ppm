import React, { useState, useEffect, useContext, useRef } from 'react';
import { DataContext } from '../context/DataContext';
import { AuthContext } from '../context/AuthContext';
import { User, ChatMessage } from '../types';
import { getFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const dataContext = useContext(DataContext);
  const authContext = useContext(AuthContext);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const loadedMessages = getFromLocalStorage<ChatMessage[]>('globalChatMessages');
    if (loadedMessages) {
      setMessages(loadedMessages);
    }
  }, []);

  useEffect(() => {
    saveToLocalStorage('globalChatMessages', messages);
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!dataContext || !authContext) {
    return <div>Loading...</div>;
  }
  const { users } = dataContext;
  const { currentUser } = authContext;
  
  const getUserById = (id: string): User | undefined => users.find(u => u.id === id);

  const handleSendMessage = () => {
    if (newMessage.trim() === '' || !currentUser) return;
    
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      authorId: currentUser.id,
      timestamp: new Date().toISOString(),
      text: newMessage,
    };

    setMessages(prevMessages => [...prevMessages, message]);
    setNewMessage('');
  };

  return (
    <>
      <PageHeader title="Global Chat" showBackButton={false} />
      <Card>
        <div className="flex flex-col h-[calc(100vh-250px)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-t-lg">
            {messages.map(msg => {
              const author = getUserById(msg.authorId);
              const isCurrentUser = author?.id === currentUser?.id;
              return (
                <div key={msg.id} className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 ${isCurrentUser ? 'bg-blue-500' : 'bg-gray-300'} text-white flex items-center justify-center font-bold`}>
                    {author?.firstName.charAt(0)}{author?.lastName.charAt(0)}
                  </div>
                  <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-white shadow-sm'}`}>
                    <div className="font-bold text-sm">{author?.firstName} {author?.lastName}</div>
                    <p className="text-sm mt-1 break-words">{msg.text}</p>
                    <div className="text-xs opacity-60 text-right mt-2">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
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
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shadow-sm disabled:bg-blue-300"
                disabled={!newMessage.trim()}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

export default ChatPage;
