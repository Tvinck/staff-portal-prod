import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { 
  Send, 
  User, 
  Search, 
  MessageSquare, 
  Clock, 
  MoreVertical,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Archive
} from 'lucide-react';
import './SupportChats.css';

const SupportChats = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('open'); // 'open' or 'closed'
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCloseModal, setShowCloseModal] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchChats();
    
    // Subscribe to new chats and updates
    const subscription = supabase
      .channel('support_sessions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_sessions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setChats(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.status === 'closed') {
            setChats(prev => prev.filter(c => c.id !== payload.new.id));
            if (selectedChat?.id === payload.new.id) {
               setSelectedChat(null);
            }
          } else {
            setChats(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
            if (selectedChat?.id === payload.new.id) {
              setSelectedChat(payload.new);
            }
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedChat]); // Added selectedChat to dependency array to ensure correct state for updates

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      
      // Subscribe to messages for this chat
      const messagesSubscription = supabase
        .channel(`chat_${selectedChat.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'support_messages',
          filter: `session_id=eq.${selectedChat.id}` // Changed chat_id to session_id
        }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
          // Auto update last message in chat list if needed (handled by pulse in fetchChats)
        })
        .subscribe();

      return () => {
        messagesSubscription.unsubscribe();
      };
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    console.log('DEBUG: fetchChats starting...');
    const { data, error } = await supabase
      .from('support_sessions')
      .select('*')
      .in('status', ['open', 'wait_feedback'])
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('DEBUG: fetchChats error:', error);
    } else {
      console.log('DEBUG: fetchChats raw data:', data);
      setChats(data || []);
    }
    setLoading(false);
  };

  const fetchMessages = async (chatId) => {
    console.log('DEBUG: fetchMessages called with chatId:', chatId);
    if (!chatId || typeof chatId !== 'string' || chatId.length < 30) {
      console.error('DEBUG: fetchMessages invalid UUID:', chatId);
      return;
    }
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('session_id', chatId) // Changed chat_id to session_id
      .order('created_at', { ascending: true });

    if (error) console.error('DEBUG: fetchMessages error:', error);
    else setMessages(data || []);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      console.log('DEBUG: handleSendMessage starting...', { id: selectedChat.id, text: messageText });
      const { error: dbError } = await supabase
        .from('support_messages')
        .insert({
          session_id: selectedChat.id,
          text: messageText,
          sender_type: 'staff'
        });

      if (dbError) throw dbError;

      // 2. Update chat last message
      await supabase
        .from('support_sessions') // Changed support_chats to support_sessions
        .update({ 
          last_message: messageText,
          last_message_at: new Date().toISOString() 
        })
        .eq('id', selectedChat.id);

      // 3. Call Edge Function to send to Telegram
      console.log('DEBUG: invoking Edge Function...', { 
        tg_chat_id: selectedChat.tg_chat_id, 
        session_id: selectedChat.id 
      });
      
      const { error: funcError } = await supabase.functions.invoke('telegram-support', {
        body: { // Simplified back to object as invoke handles it, but with logging
          action: 'send_message',
          chat_id: selectedChat.tg_chat_id,
          session_id: selectedChat.id,
          text: messageText
        }
      });

      if (funcError) console.error('DEBUG: Edge Function error:', funcError);

    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCloseChat = async (resolved) => {
    if (!selectedChat || sending) return;
    
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('telegram-support', {
        body: JSON.stringify({ 
          action: 'close_chat', 
          chat_id: selectedChat.tg_chat_id, 
          session_id: selectedChat.id,
          resolved 
        })
      });

      if (error) throw error;
      
      // Update local state
      setSelectedChat(null);
      setShowCloseModal(false);
      fetchChats();
    } catch (err) {
      console.error('Failed to close chat:', err);
      alert('Ошибка при закрытии чата');
    } finally {
      setSending(false);
    }
  };

  const getWaitTime = (lastMessageAt, lastSenderType) => {
    if (lastSenderType !== 'user') return null;
    const diff = Math.floor((currentTime - new Date(lastMessageAt)) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredChats = chats
    .filter(chat => chat.status === activeTab || (activeTab === 'open' && chat.status === 'wait_feedback')) // Adjusted filter for 'open' tab
    .filter(chat => 
      (chat.first_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (chat.username?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="support-loading">
        <Loader2 className="spinning" size={40} />
        <p>Загрузка чатов...</p>
      </div>
    );
  }

  return (
    <div className="support-container">
      {/* Sidebar - Chats List */}
      <div className={`chats-sidebar ${selectedChat ? 'mobile-hidden' : ''}`}>
        <div className="chats-header">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Поиск клиентов..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="chats-tabs">
            <button 
              className={activeTab === 'open' ? 'active' : ''} 
              onClick={() => setActiveTab('open')}
            >
              Активные
            </button>
            <button 
              className={activeTab === 'closed' ? 'active' : ''} 
              onClick={() => setActiveTab('closed')}
            >
              Завершенные
            </button>
          </div>
        </div>

        <div className="chats-list">
          {filteredChats.length > 0 ? (
            filteredChats.map(chat => {
              const waitTime = getWaitTime(chat.last_message_at, chat.last_sender_type);
              return (
                <div 
                  key={chat.id} 
                  className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''} ${waitTime ? 'waiting' : ''}`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <div className="chat-avatar">
                    {chat.username ? chat.username[0].toUpperCase() : <User size={20} />}
                  </div>
                  <div className="chat-item-info">
                    <div className="chat-item-header">
                      <span className="customer-name">{chat.first_name || 'Клиент'}</span>
                      <span className="last-time">{new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="last-message-preview">{chat.last_message}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-chats">
              <MessageSquare size={32} />
              <p>Нет активных чатов</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`chat-area ${!selectedChat ? 'no-selection' : ''}`}>
        {selectedChat ? (
          <div className="chat-window">
            <header className="chat-header">
              <button className="back-btn" onClick={() => setSelectedChat(null)}>
                <ChevronLeft size={24} />
              </button>
              <div className="header-user">
                <div className="header-avatar">
                  {selectedChat.first_name ? selectedChat.first_name[0] : (selectedChat.username ? selectedChat.username[0] : 'K')}
                </div>
                <div className="header-info">
                  <h3>{selectedChat.first_name || 'Клиент'}</h3>
                  <span className="header-handle">@{selectedChat.username || selectedChat.tg_chat_id}</span>
                </div>
              </div>
              <div className="header-actions">
                {selectedChat.status === 'open' && (
                  <button className="close-chat-btn" onClick={() => setShowCloseModal(true)} title="Завершить чат">
                    <CheckCircle2 size={18} />
                    <span>Закрыть чат</span>
                  </button>
                )}
                <button className="chat-options">
                  <MoreVertical size={20} />
                </button>
              </div>
            </header>

            <div className="messages-list">
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`message-wrapper ${msg.sender_type}`}>
                  <div className="message-bubble">
                    <p>{msg.text}</p>
                    <span className="message-time">{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-input-area" onSubmit={handleSendMessage}>
              <input 
                type="text" 
                placeholder="Введите сообщение..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
              />
              <button type="submit" className="send-btn" disabled={!newMessage.trim() || sending}>
                {sending ? <Loader2 className="spinning" size={20} /> : <Send size={20} />}
              </button>
            </form>
          </div>
        ) : (
          <div className="chat-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">
                <MessageSquare size={48} />
              </div>
              <h2>Выберите чат для начала общения</h2>
              <p>Все сообщения из Telegram-бота будут отображаться здесь</p>
            </div>
          </div>
        )}
      </div>

      {/* Close Chat Modal */}
      {showCloseModal && (
        <div className="modal-overlay">
          <div className="support-modal">
            <div className="modal-header">
              <AlertCircle size={24} className="warning-icon" />
              <h2>Завершение чата</h2>
            </div>
            <p>Вопрос клиента был решен?</p>
            <div className="modal-actions">
              <button 
                className="modal-btn confirm" 
                onClick={() => handleCloseChat(true)}
                disabled={sending}
              >
                {sending ? <Loader2 className="spinning" size={20} /> : 'Да, решен'}
                <span className="btn-hint">Отправить опрос</span>
              </button>
              <button 
                className="modal-btn secondary" 
                onClick={() => handleCloseChat(false)}
                disabled={sending}
              >
                Нет, закрыть без опроса
              </button>
              <button 
                className="modal-btn cancel" 
                onClick={() => setShowCloseModal(false)}
                disabled={sending}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportChats;
