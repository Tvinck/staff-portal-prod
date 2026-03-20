import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { 
  Search, 
  User, 
  Calendar, 
  Clock, 
  Star, 
  Eye, 
  MessageSquare,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  MoreVertical
} from 'lucide-react';
import './TMQPage.css';

const TMQPage = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [evalRating, setEvalRating] = useState(0);
  const [evalComment, setEvalComment] = useState('');
  const [savingEval, setSavingEval] = useState(false);
  const [stats, setStats] = useState({ total: 0, avgRating: 0, positiveCount: 0, negativeCount: 0 });


  useEffect(() => {
    fetchCommunications(); // Changed from fetchChats
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from('support_sessions')
      .select('user_rating');

    if (error) {
      console.error('Error fetching stats:', error);
      return;
    }

    const ratings = data.map(r => r.user_rating).filter(r => r !== null);
    const avg = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

    setStats({
      total: data.length,
      avgRating: avg,
      positiveCount: ratings.filter(r => r >= 4).length,
      negativeCount: ratings.filter(r => r <= 2).length
    });
  };

  const fetchCommunications = async () => { // Renamed from fetchChats
    setLoading(true);
    const { data, error } = await supabase
      .from('support_sessions') // Changed table name
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching communications:', error); // Updated error message
    else setChats(data);
    setLoading(false);
  };

  const openQuickView = async (chat) => {
    if (!chat || !chat.id || typeof chat.id !== 'string') {
      console.error('DEBUG: Cannot open Quick View - invalid session ID:', chat?.id);
      return;
    }
    setSelectedChat(chat);
    setEvalRating(chat.evaluator_rating || 0);
    setEvalComment(chat.evaluator_comment || '');

    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('session_id', chat.id)
      .order('created_at', { ascending: true });

    if (error) console.error('Error fetching messages:', error);
    else setMessages(data || []);
  };

  const handleSaveEval = async () => {
    if (!selectedChat) return;
    setSavingEval(true);

    try {
      const { error } = await supabase
        .from('support_sessions') // Changed table name
        .update({
          evaluator_rating: evalRating, // Used evalRating
          evaluator_comment: evalComment, // Used evalComment
          updated_at: new Date().toISOString() // Added updated_at
        })
        .eq('id', selectedChat.id);

      if (error) throw error;

      // Update local state
      setChats(prev => prev.map(c =>
        c.id === selectedChat.id
          ? { ...c, evaluator_rating: evalRating, evaluator_comment: evalComment }
          : c
      ));

      alert('Оценка сохранена успешно!');
    } catch (err) {
      console.error('Failed to save evaluation:', err);
      alert('Ошибка при сохранении оценки');
    } finally {
      setSavingEval(false);
    }
  };

  const filteredChats = chats.filter(chat =>
    (chat.first_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (chat.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderStars = (rating) => {
    if (!rating) return <span className="rating-empty">Нет оценки</span>;
    return (
      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={14}
            fill={star <= rating ? "#ffb800" : "none"}
            stroke={star <= rating ? "#ffb800" : "currentColor"}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="tmq-loading">Загрузка данных...</div>;
  }

  // Stats calculation (now using state from fetchStats)
  const totalChats = stats.total;
  const ratedChats = chats.filter(c => c.user_rating).length; // This still counts from chats, not stats.positiveCount
  const avgRating = stats.avgRating;

  return (
    <div className="tmq-container">
      <div className="tmq-header">
        <h1>Контроль качества (TMQ)</h1>
        <div className="tmq-stats">
          <div className="stat-card">
            <span className="stat-label">Всего диалогов</span>
            <span className="stat-value">{totalChats}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Оценок клиентов</span>
            <span className="stat-value">{ratedChats}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Средний рейтинг</span>
            <span className="stat-value">{avgRating} ⭐</span>
          </div>
        </div>
      </div>

      <div className="tmq-content">
        <div className="tmq-filters">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Поиск по клиенту..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        <div className="tmq-table-wrapper">
          <table className="tmq-table">
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Начало</th>
                <th>Последнее письмо</th>
                <th>Оценка клиента</th>
                <th>Оценка OKK</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredChats.map(chat => (
                <tr key={chat.id}>
                  <td>
                    <div className="client-cell">
                      <div className="client-avatar">
                        {chat.username ? chat.username[0].toUpperCase() : <User size={16} />}
                      </div>
                      <div className="client-info">
                        <span className="client-name">{chat.first_name || 'Клиент'}</span>
                        <span className="client-handle">@{chat.username || chat.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>{formatDate(chat.created_at)}</td>
                  <td>{formatDate(chat.last_message_at)}</td>
                  <td>{renderStars(chat.user_rating)}</td>
                  <td>{renderStars(chat.evaluator_rating)}</td>
                  <td className="actions-cell">
                    <button className="action-btn" onClick={() => openQuickView(chat)}>
                      <Eye size={16} />
                      <span>Просмотр</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick View Modal */}
      {selectedChat && (
        <div className="qv-modal-overlay">
          <div className="qv-modal">
            <div className="qv-header">
              <div className="qv-user">
                <h2>История диалога: {selectedChat.first_name || selectedChat.username}</h2>
                <span className="user-handle">@{selectedChat.username || selectedChat.id}</span>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedChat(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="qv-body">
              <div className="qv-messages">
                {messages.length > 0 ? messages.map(msg => (
                  <div key={msg.id} className={`qv-message ${msg.sender_type}`}>
                    <p>{msg.text}</p>
                    <span className="msg-info">{new Date(msg.created_at).toLocaleTimeString()}</span>
                  </div>
                )) : (
                  <div className="empty-history">История пуста</div>
                )}
              </div>

              <div className="qv-eval-panel">
                <div className="eval-form">
                  <h3>Оценка качества (OKK)</h3>
                  <div className="eval-stars-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={28}
                        className={`star-input ${star <= evalRating ? 'active' : ''}`}
                        fill={star <= evalRating ? "#ffb800" : "none"}
                        onClick={() => setEvalRating(star)}
                      />
                    ))}
                  </div>

                  <h3>Комментарий оценщика</h3>
                  <textarea
                    className="eval-textarea"
                    placeholder="Ваш комментарий по работе сотрудника..."
                    value={evalComment}
                    onChange={(e) => setEvalComment(e.target.value)}
                  />

                  <button
                    className="save-eval-btn"
                    onClick={handleSaveEval}
                    disabled={savingEval}
                  >
                    {savingEval ? 'Сохранение...' : 'Сохранить оценку'}
                  </button>
                </div>

                <div className="eval-info-brief">
                  <button className="chat-options">
                    <MoreVertical size={20} />
                  </button>
                  <div className="info-item">
                    <Award size={18} />
                    <span>Оценка клиента: {selectedChat.user_rating || 'Нет'}</span>
                  </div>
                  <div className="info-item">
                    <TrendingUp size={18} />
                    <span>Статус: {selectedChat.status === 'open' ? 'Активен' : 'Завершен'}</span>
                  </div>
                </div>

                {selectedChat.user_feedback && (
                  <div className="user-feedback-box">
                    <h3>Отзыв клиента:</h3>
                    <p>{selectedChat.user_feedback}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TMQPage;
