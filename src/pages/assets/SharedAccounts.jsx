import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Key, Plus, Search, MoreVertical, Calendar, Gamepad2, 
  ShieldCheck, RefreshCw, Trash2, Edit2, Save, X
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import Modal from '../../components/ui/Modal';
import './Assets.css';

const SharedAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '', type: 'gaming', credentials: { email: '', password: '' },
    person_count: 1, active_items: [], instruction: ''
  });

  const resetForm = () => {
    setFormData({ name: '', type: 'gaming', credentials: { email: '', password: '' }, person_count: 1, active_items: [], instruction: '' });
    setEditingAccount(null);
  };

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('shared_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error fetching accounts:', error);
    else setAccounts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let dataToSave = { ...formData };
      
      if (editingAccount) {
        // Check if password changed to update password_updated_at
        if (editingAccount.credentials?.password !== formData.credentials.password) {
          dataToSave.password_updated_at = new Date().toISOString();
        }
        
        const { error } = await supabase
          .from('shared_accounts')
          .update(dataToSave)
          .eq('id', editingAccount.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shared_accounts')
          .insert([dataToSave]);
        if (error) throw error;
      }
      setShowModal(false);
      resetForm();
      fetchAccounts();
    } catch (err) {
      console.error('Save error:', err);
      alert('Ошибка сохранения: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      credentials: account.credentials || { email: '', password: '' },
      person_count: account.person_count || 1,
      active_items: account.active_items || [],
      instruction: account.instruction || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить этот аккаунт?')) return;
    const { error } = await supabase.from('shared_accounts').delete().eq('id', id);
    if (error) console.error('Delete error:', error);
    else fetchAccounts();
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.credentials?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="assets-module">
      <div className="module-controls">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Поиск по названию, типу или email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18} />
          Добавить аккаунт
        </button>
      </div>

      <div className="assets-grid">
        {loading ? (
          <div className="loader-container">
            <div className="loader"></div>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>Аккаунты не найдены</h3>
            <p>Добавьте первый общий аккаунт для отслеживания.</p>
          </div>
        ) : (
          filteredAccounts.map(account => (
            <div key={account.id} className="asset-card glass-card">
              <div className="card-header">
                <div className={`type-icon ${account.type}`}>
                  {account.type === 'apple' ? <ShieldCheck size={20} /> : <Gamepad2 size={20} />}
                </div>
                <div className="header-info">
                  <h4>{account.name}</h4>
                  <span className="badge-type">{account.type?.toUpperCase()}</span>
                </div>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <Key size={14} />
                  <span>{account.credentials?.email || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <Users size={14} />
                  <span>Активных: <strong>{account.person_count}</strong></span>
                </div>
                <div className="info-row">
                  <Calendar size={14} />
                  <span>Пароль изменен: {account.password_updated_at ? new Date(account.password_updated_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                
                {account.instruction && (
                  <div style={{fontSize: '11px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: 'var(--text-secondary)', marginTop: '4px'}}>
                    <strong>Инструкция: </strong>
                    {account.instruction.length > 60 ? account.instruction.substring(0, 60) + '...' : account.instruction}
                  </div>
                )}

                <div className="items-tags">
                  {account.active_items?.length > 0 ? (
                    account.active_items.map((item, i) => (
                      <span key={i} className="item-tag">{item}</span>
                    ))
                  ) : (
                    <span className="no-items">Нет привязок</span>
                  )}
                </div>
              </div>

              <div className="card-actions">
                <button className="btn-outline btn-sm" onClick={() => handleEdit(account)}>
                  <Edit2 size={14} />
                  Правка
                </button>
                <button className="btn-outline btn-sm text-danger" onClick={() => handleDelete(account.id)}>
                  <Trash2 size={14} />
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingAccount ? 'Редактирование аккаунта' : 'Новый общий аккаунт'}
        footer={
          <>
            <button className="btn-outline" onClick={() => { setShowModal(false); resetForm(); }}>Отмена</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !formData.name}>
              <Save size={16} />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Название</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Netflix Family, Steam Main..." />
        </div>
        <div className="form-group">
          <label>Тип</label>
          <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
            <option value="gaming">Игровой</option>
            <option value="streaming">Стриминг</option>
            <option value="apple">Apple</option>
            <option value="dev">Разработка</option>
            <option value="other">Другое</option>
          </select>
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={formData.credentials.email} onChange={(e) => setFormData({...formData, credentials: {...formData.credentials, email: e.target.value}})} placeholder="account@example.com" />
        </div>
        <div className="form-group">
          <label>Пароль</label>
          <input type="text" value={formData.credentials.password} onChange={(e) => setFormData({...formData, credentials: {...formData.credentials, password: e.target.value}})} placeholder="••••••••" />
        </div>
        <div className="form-group">
          <label>Кол-во пользователей</label>
          <input type="number" min="1" value={formData.person_count} onChange={(e) => setFormData({...formData, person_count: parseInt(e.target.value) || 1})} />
        </div>
        <div className="form-group">
          <label>Инструкция (для пользователей)</label>
          <textarea 
            rows={3} 
            value={formData.instruction} 
            onChange={(e) => setFormData({...formData, instruction: e.target.value})} 
            placeholder="Например: Выйдите из своего iCloud. Зайдите только в Медиаматериалы и покупки..." 
          />
        </div>
      </Modal>
    </div>
  );
};

export default SharedAccounts;
