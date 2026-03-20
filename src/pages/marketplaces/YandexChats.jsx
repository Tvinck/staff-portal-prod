import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  Search, 
  RefreshCcw, 
  Clock, 
  MoreVertical,
  ChevronLeft
} from 'lucide-react';
import { fetchYandexChats, fetchChatHistory, sendChatMessage } from '../../utils/marketplaces/yandexMarket';
import './YandexChats.css';

const YandexChats = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChats();
    // Poll for new chats every minute
    const interval = setInterval(loadChats, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    setLoading(true);
    try {
      const data = await fetchYandexChats();
      // Дедупликация по chatId для стабильности React keys
      const uniqueChats = [];
      const seenIds = new Set();
      for (const chat of data) {
        if (chat.chatId && !seenIds.has(chat.chatId)) {
          uniqueChats.push(chat);
          seenIds.add(chat.chatId);
        }
      }
      setChats(uniqueChats);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    setMessagesLoading(true);
    try {
      const history = await fetchChatHistory(chat.chatId);
      setMessages(history);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const text = newMessage;
    setNewMessage('');

    try {
      await sendChatMessage(selectedChat.chatId, text);
      // Optimistic update or refresh
      const updatedHistory = await fetchChatHistory(selectedChat.chatId);
      setMessages(updatedHistory);
    } catch (error) {
      alert('Ошибка при отправке: ' + error.message);
      setNewMessage(text);
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.chatId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chat.orderId && chat.orderId.toString().includes(searchTerm))
  );

  return (
    <div className="chats-layout">
      {/* Master View */}
      <div className="chat-list-pane">
        <div className="chat-list-header">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Поиск чатов или заказов..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="chat-list-scroll">
          {loading && chats.length === 0 ? (
            <div className="table-loader">Загрузка чатов...</div>
          ) : filteredChats.length === 0 ? (
            <div className="table-empty">Чаты не найдены</div>
          ) : (
            filteredChats.map(chat => (
              <div 
                key={chat.chatId} 
                className={`chat-item ${selectedChat?.chatId === chat.chatId ? 'active' : ''}`}
                onClick={() => handleSelectChat(chat)}
              >
                <div className="chat-avatar">
                  <User size={20} />
                </div>
                <div className="chat-info">
                  <div className="chat-info-top">
                    <h4>Заказ #{chat.chatId.slice(-8).toUpperCase()}</h4>
                    <span className="chat-time">
                      {chat.updatedAt ? new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div className="chat-preview">
                    {chat.lastMessage?.text || `Контекст: ${chat.type}`}
                  </div>
                </div>
                {chat.unreadCount > 0 && <div className="status-unread"></div>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail View */}
      <div className="chat-detail-pane">
        {selectedChat ? (
          <>
            <div className="chat-detail-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="chat-avatar" style={{ width: 36, height: 36 }}>
                  <User size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Чат по заказу #{selectedChat.chatId.slice(-8).toUpperCase()}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ID: {selectedChat.chatId}</span>
                </div>
              </div>
              <div className="header-actions">
                <button className="btn-icon" onClick={() => handleSelectChat(selectedChat)} title="Обновить">
                  <RefreshCcw size={18} />
                </button>
              </div>
            </div>

            <div className="messages-scroll">
              {messagesLoading ? (
                <div className="table-loader">Загрузка сообщений...</div>
              ) : messages.length === 0 ? (
                <div className="table-empty">Нет сообщений</div>
              ) : (
                messages.map((msg, i) => (
                  <div 
                    key={`${msg.chatId}-${msg.createdAt}-${i}`} 
                    className={`message-bubble ${msg.senderType === 'USER' ? 'incoming' : 'outgoing'}`}
                  >
                    {msg.text}
                    <span className="message-meta">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <textarea 
                className="chat-textarea"
                placeholder="Напишите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button 
                className="send-btn"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
            <MessageSquare size={48} strokeWidth={1} style={{ marginBottom: 16, opacity: 0.5 }} />
            <p>Выберите чат для начала общения</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YandexChats;
