import React, { useState, useEffect, useCallback } from 'react';
import {
  Newspaper, Plus, Search, Pin, Clock, MessageSquare, Send,
  SmilePlus, Trash2, Edit2, Save, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import Modal from '../../components/ui/Modal';
import './News.css';

const EMOJI_OPTIONS = ['👍', '❤️', '🔥', '🚀', '👀', '🎉'];
const CATEGORIES = ['general', 'update', 'infrastructure', 'api', 'security', 'feature'];
const CATEGORY_LABELS = {
  general: 'Общее', update: 'Обновление', infrastructure: 'Инфра',
  api: 'API', security: 'Безопасность', feature: 'Фича'
};

const News = () => {
  const [articles, setArticles] = useState([]);
  const [comments, setComments] = useState({});
  const [reactions, setReactions] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  // Create/Edit article state
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', category: 'general', pinned: false });

  // Comment + Reaction UI state
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(null);

  const currentUser = 'Admin';

  const resetForm = () => {
    setFormData({ title: '', content: '', category: 'general', pinned: false });
    setEditingArticle(null);
  };

  // ─── Fetch Data ─────────────────────────────────────────────

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching news:', error);
    else {
      setArticles(data || []);
      // Batch fetch comments and reactions for all articles
      if (data?.length > 0) {
        const ids = data.map(a => a.id);
        await Promise.all([fetchAllComments(ids), fetchAllReactions(ids)]);
      }
    }
    setLoading(false);
  }, []);

  const fetchAllComments = async (newsIds) => {
    const { data } = await supabase
      .from('news_comments')
      .select('*')
      .in('news_id', newsIds)
      .order('created_at', { ascending: true });

    if (data) {
      const grouped = {};
      data.forEach(c => {
        if (!grouped[c.news_id]) grouped[c.news_id] = [];
        grouped[c.news_id].push(c);
      });
      setComments(grouped);
    }
  };

  const fetchAllReactions = async (newsIds) => {
    const { data } = await supabase
      .from('news_reactions')
      .select('*')
      .in('news_id', newsIds);

    if (data) {
      const grouped = {};
      data.forEach(r => {
        if (!grouped[r.news_id]) grouped[r.news_id] = {};
        if (!grouped[r.news_id][r.emoji]) grouped[r.news_id][r.emoji] = [];
        grouped[r.news_id][r.emoji].push(r.user_name);
      });
      setReactions(grouped);
    }
  };

  useEffect(() => { fetchArticles(); }, [fetchArticles]);

  // ─── Article CRUD ───────────────────────────────────────────

  const handleSave = async () => {
    if (!formData.title || !formData.content) return;
    setSaving(true);
    try {
      if (editingArticle) {
        const { error } = await supabase.from('news')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingArticle.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('news')
          .insert([{ ...formData, author: currentUser }]);
        if (error) throw error;
      }
      setShowModal(false);
      resetForm();
      fetchArticles();
    } catch (err) {
      console.error('Save error:', err);
      alert('Ошибка сохранения: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({ title: article.title, content: article.content, category: article.category, pinned: article.pinned });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту новость?')) return;
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (!error) fetchArticles();
  };

  // ─── Comments ───────────────────────────────────────────────

  const handleAddComment = async (newsId) => {
    const text = commentInputs[newsId]?.trim();
    if (!text) return;

    const { error } = await supabase.from('news_comments').insert([{
      news_id: newsId,
      content: text,
      author: currentUser
    }]);

    if (!error) {
      setCommentInputs(prev => ({ ...prev, [newsId]: '' }));
      const ids = articles.map(a => a.id);
      await fetchAllComments(ids);
    }
  };

  // ─── Reactions ──────────────────────────────────────────────

  const handleToggleReaction = async (newsId, emoji) => {
    const articleReactions = reactions[newsId]?.[emoji] || [];
    const hasReacted = articleReactions.includes(currentUser);

    if (hasReacted) {
      await supabase.from('news_reactions')
        .delete()
        .eq('news_id', newsId)
        .eq('emoji', emoji)
        .eq('user_name', currentUser);
    } else {
      await supabase.from('news_reactions')
        .insert([{ news_id: newsId, emoji, user_name: currentUser }]);
    }

    const ids = articles.map(a => a.id);
    await fetchAllReactions(ids);
    setEmojiPickerOpen(null);
  };

  // ─── Helpers ────────────────────────────────────────────────

  const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} мин. назад`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч. назад`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} дн. назад`;
    return new Date(dateStr).toLocaleDateString();
  };

  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || a.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="news-module">
      {/* Header */}
      <div className="news-header">
        <div className="news-header-left">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text" placeholder="Поиск по новостям..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="news-stats">
            <div className="news-stat"><Newspaper size={14} /> <strong>{articles.length}</strong> новостей</div>
          </div>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18} />
          Новая публикация
        </button>
      </div>

      {/* Category Filters */}
      <div className="news-filters">
        <button className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>Все</button>
        {CATEGORIES.map(cat => (
          <button key={cat} className={`filter-chip ${activeFilter === cat ? 'active' : ''}`} onClick={() => setActiveFilter(cat)}>
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* News Feed */}
      <div className="news-feed">
        {loading ? (
          <div className="loader-container"><div className="loader"></div></div>
        ) : filteredArticles.length === 0 ? (
          <div className="news-empty">
            <Newspaper size={56} />
            <h3>Новостей пока нет</h3>
            <p>Опубликуйте первую новость для команды.</p>
          </div>
        ) : (
          filteredArticles.map(article => {
            const articleComments = comments[article.id] || [];
            const articleReactions = reactions[article.id] || {};
            const isExpanded = expandedComments[article.id];

            return (
              <div key={article.id} className={`news-card ${article.pinned ? 'pinned' : ''}`}>
                <div className="news-card-body">
                  {/* Header */}
                  <div className="news-card-header">
                    <div className="news-author-info">
                      <div className="news-avatar">{article.author?.substring(0, 2).toUpperCase()}</div>
                      <div>
                        <div className="news-author-name">{article.author}</div>
                        <div className="news-date"><Clock size={12} /> {formatTimeAgo(article.created_at)}</div>
                      </div>
                    </div>
                    <div className="news-card-actions">
                      <button className="news-action-btn" onClick={() => handleEdit(article)} title="Редактировать">
                        <Edit2 size={14} />
                      </button>
                      <button className="news-action-btn danger" onClick={() => handleDelete(article.id)} title="Удалить">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Category + Pin */}
                  <div className="news-category-row">
                    <span className={`category-badge ${article.category}`}>{CATEGORY_LABELS[article.category] || article.category}</span>
                    {article.pinned && <span className="pin-badge"><Pin size={12} /> Закреплено</span>}
                  </div>

                  {/* Content */}
                  <h3 className="news-title">{article.title}</h3>
                  <p className="news-content">{article.content}</p>

                  {/* Reactions */}
                  <div className="news-reactions-bar">
                    {Object.entries(articleReactions).map(([emoji, users]) => (
                      <button
                        key={emoji}
                        className={`reaction-chip ${users.includes(currentUser) ? 'active' : ''}`}
                        onClick={() => handleToggleReaction(article.id, emoji)}
                      >
                        <span className="emoji">{emoji}</span>
                        <span className="count">{users.length}</span>
                      </button>
                    ))}
                    <div style={{ position: 'relative' }}>
                      <button
                        className="add-reaction-btn"
                        onClick={() => setEmojiPickerOpen(emojiPickerOpen === article.id ? null : article.id)}
                      >
                        <SmilePlus size={14} />
                      </button>
                      {emojiPickerOpen === article.id && (
                        <div className="emoji-picker">
                          {EMOJI_OPTIONS.map(em => (
                            <button key={em} onClick={() => handleToggleReaction(article.id, em)}>{em}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="news-comments-section">
                  <button
                    className="comments-toggle"
                    onClick={() => setExpandedComments(prev => ({ ...prev, [article.id]: !prev[article.id] }))}
                  >
                    <MessageSquare size={14} />
                    {articleComments.length > 0 ? `Комментарии (${articleComments.length})` : 'Написать комментарий'}
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && (
                    <>
                      {articleComments.length > 0 && (
                        <div className="comments-list">
                          {articleComments.map(c => (
                            <div key={c.id} className="comment-item">
                              <div className="comment-avatar">{c.author?.substring(0, 2).toUpperCase()}</div>
                              <div className="comment-body">
                                <div className="comment-meta">
                                  <span className="comment-author">{c.author}</span>
                                  <span className="comment-time">{formatTimeAgo(c.created_at)}</span>
                                </div>
                                <p className="comment-text">{c.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="comment-input-wrap">
                        <input
                          type="text"
                          placeholder="Написать комментарий..."
                          value={commentInputs[article.id] || ''}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [article.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(article.id)}
                        />
                        <button
                          className="comment-send-btn"
                          onClick={() => handleAddComment(article.id)}
                          disabled={!commentInputs[article.id]?.trim()}
                        >
                          <Send size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingArticle ? 'Редактировать новость' : 'Новая публикация'}
        footer={
          <>
            <button className="btn-outline" onClick={() => { setShowModal(false); resetForm(); }}>Отмена</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !formData.title || !formData.content}>
              <Save size={16} />
              {saving ? 'Сохранение...' : 'Опубликовать'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Заголовок</label>
          <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Заголовок новости..." />
        </div>
        <div className="form-group">
          <label>Содержание</label>
          <textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} placeholder="Текст публикации..." rows={5} />
        </div>
        <div className="form-group">
          <label>Категория</label>
          <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox" id="pinned-check"
            checked={formData.pinned}
            onChange={(e) => setFormData({...formData, pinned: e.target.checked})}
            style={{ width: 'auto' }}
          />
          <label htmlFor="pinned-check" style={{ textTransform: 'none', fontSize: '14px', color: 'var(--text-secondary)' }}>Закрепить новость</label>
        </div>
      </Modal>
    </div>
  );
};

export default News;
