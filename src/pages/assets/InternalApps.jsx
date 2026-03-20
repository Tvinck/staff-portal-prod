import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, Download, Plus, Search, Package, Edit, Trash2, Save
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import Modal from '../../components/ui/Modal';
import './Assets.css';

const InternalApps = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', platform: 'Cross-platform', version: '1.0.0', status: 'development' });

  const resetForm = () => {
    setFormData({ name: '', platform: 'Cross-platform', version: '1.0.0', status: 'development' });
    setEditingApp(null);
  };

  const fetchApps = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('internal_apps')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) console.error('Error:', error);
    else setApps(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const handleSave = async () => {
    if (!formData.name) return;
    setSaving(true);
    try {
      if (editingApp) {
        const { error } = await supabase.from('internal_apps').update(formData).eq('id', editingApp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('internal_apps').insert([formData]);
        if (error) throw error;
      }
      setShowModal(false);
      resetForm();
      fetchApps();
    } catch (err) {
      console.error('Save error:', err);
      alert('Ошибка: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (app) => {
    setEditingApp(app);
    setFormData({ name: app.name, platform: app.platform || 'Cross-platform', version: app.version || '1.0.0', status: app.status || 'development' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить это приложение?')) return;
    const { error } = await supabase.from('internal_apps').delete().eq('id', id);
    if (!error) fetchApps();
  };

  const filteredApps = apps.filter(app => 
    app.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="assets-module">
      <div className="module-controls">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" placeholder="Поиск по приложению..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18} />
          Добавить ПО
        </button>
      </div>

      <div className="apps-list">
        {loading ? (
          <div className="loader-container"><div className="loader"></div></div>
        ) : filteredApps.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <h3>Приложения не найдены</h3>
            <p>Добавьте наш первый программный продукт.</p>
          </div>
        ) : (
          filteredApps.map(app => (
            <div key={app.id} className="app-inventory-item glass-card">
              <div className="app-icon-large text-gradient">
                {app.name?.substring(0, 2).toUpperCase()}
              </div>
              <div className="app-main-info">
                <h3>{app.name}</h3>
                <div className="app-meta">
                  <span className="platform-tag">{app.platform || 'Cross-platform'}</span>
                  <span className="version-info">v{app.version || '1.0.0'}</span>
                </div>
              </div>
              <div className="app-status-info">
                <span className={`status-text ${app.status}`}>
                  {app.status === 'production' ? 'В релизе' : 'В разработке'}
                </span>
                <span className="uptime-info">Запущено: {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="app-item-actions">
                <button className="btn-outline btn-sm" onClick={() => handleEdit(app)} title="Редактировать">
                  <Edit size={14} />
                </button>
                <button className="btn-outline btn-sm text-danger" onClick={() => handleDelete(app.id)} title="Удалить">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingApp ? 'Редактирование ПО' : 'Добавить приложение'}
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
          <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Bazzar Market, Pixel AI..." />
        </div>
        <div className="form-group">
          <label>Платформа</label>
          <select value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})}>
            <option value="Cross-platform">Cross-platform</option>
            <option value="iOS">iOS</option>
            <option value="Android">Android</option>
            <option value="Web">Web</option>
            <option value="Desktop">Desktop</option>
          </select>
        </div>
        <div className="form-group">
          <label>Версия</label>
          <input type="text" value={formData.version} onChange={(e) => setFormData({...formData, version: e.target.value})} placeholder="1.0.0" />
        </div>
        <div className="form-group">
          <label>Статус</label>
          <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
            <option value="development">В разработке</option>
            <option value="production">В релизе</option>
          </select>
        </div>
      </Modal>
    </div>
  );
};

export default InternalApps;
