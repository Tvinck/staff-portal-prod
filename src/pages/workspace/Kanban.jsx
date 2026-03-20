import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, MoreHorizontal, Clock, UserCircle2, Save, Trash2, GripVertical
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import Modal from '../../components/ui/Modal';
import './Kanban.css';

/**
 * Kanban Board with Supabase persistence.
 * Tasks are stored in `kanban_tasks` table with a `column` field for status.
 * Falls back to local state if the table doesn't exist.
 */
const Kanban = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [targetColumn, setTargetColumn] = useState('todo');
  const [formData, setFormData] = useState({ title: '', priority: 'средний', assignee: '', date: '' });

  const columns = [
    { id: 'todo', title: 'К выполнению' },
    { id: 'doing', title: 'В работе' },
    { id: 'review', title: 'Проверка' },
    { id: 'done', title: 'Готово' }
  ];

  // Fallback hardcoded tasks for when DB table doesn't exist
  const fallbackTasks = [
    { id: 'T-01', title: 'Исправить задержку узла #2 (Германия)', priority: 'высокий', assignee: 'MK', date: '18 Мар', column: 'todo' },
    { id: 'T-02', title: 'Добавить цены для Midjourney v7', priority: 'средний', assignee: 'AD', date: '20 Мар', column: 'todo' },
    { id: 'T-03', title: 'Бот авто-разблокировки Apple ID', priority: 'высокий', assignee: 'JD', date: '15 Мар', column: 'doing' },
    { id: 'T-04', title: 'Интеграция вебхуков Pachka', priority: 'средний', assignee: 'AD', date: '17 Мар', column: 'doing' },
    { id: 'T-05', title: 'Новая страница Wiki: Онбординг', priority: 'низкий', assignee: 'MK', date: '14 Мар', column: 'review' },
    { id: 'T-06', title: 'UI Мониторинга VPN серверов', priority: 'средний', assignee: 'AD', date: 'Готово', column: 'done' },
    { id: 'T-07', title: 'Рефакторинг логики Маркета', priority: 'высокий', assignee: 'JD', date: 'Готово', column: 'done' },
  ];

  const resetForm = () => setFormData({ title: '', priority: 'средний', assignee: '', date: '' });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kanban_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('kanban_tasks table not found, using fallback data');
        setTasks(fallbackTasks);
      } else {
        setTasks(data && data.length > 0 ? data : fallbackTasks);
      }
    } catch {
      setTasks(fallbackTasks);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleSave = async () => {
    if (!formData.title) return;
    setSaving(true);
    try {
      const newTask = {
        title: formData.title,
        priority: formData.priority,
        assignee: formData.assignee || 'AD',
        date: formData.date || new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        column: targetColumn,
      };

      const { error } = await supabase.from('kanban_tasks').insert([newTask]);
      if (error) {
        // Fallback: just add locally
        const localId = `T-${String(tasks.length + 1).padStart(2, '0')}`;
        setTasks(prev => [...prev, { ...newTask, id: localId }]);
      } else {
        fetchTasks();
      }
      setShowModal(false);
      resetForm();
    } catch {
      const localId = `T-${String(tasks.length + 1).padStart(2, '0')}`;
      setTasks(prev => [...prev, { ...formData, column: targetColumn, id: localId }]);
      setShowModal(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const moveTask = async (taskId, newColumn) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, column: newColumn } : t));
    try {
      await supabase.from('kanban_tasks').update({ column: newColumn }).eq('id', taskId);
    } catch { /* local only is fine */ }
  };

  const deleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await supabase.from('kanban_tasks').delete().eq('id', taskId);
    } catch { /* local only */ }
  };

  const getTasksByColumn = (colId) => tasks.filter(t => t.column === colId);

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <div className="kanban-meta">
          <span className="badge">Внутренние задачи</span>
          <div className="avatar-group">
            <div className="avatar mini">AD</div>
            <div className="avatar mini">MK</div>
            <div className="avatar mini">JD</div>
            <div className="avatar mini plus">+2</div>
          </div>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setTargetColumn('todo'); setShowModal(true); }}>
          <Plus size={18} />
          Новая задача
        </button>
      </div>

      <div className="kanban-board">
        {columns.map(col => {
          const colTasks = getTasksByColumn(col.id);
          return (
            <div key={col.id} className="kanban-column">
              <div className="column-header">
                <div className="column-title">
                  <span>{col.title}</span>
                  <span className="count">{colTasks.length}</span>
                </div>
                <button className="icon-btn" onClick={() => { resetForm(); setTargetColumn(col.id); setShowModal(true); }}>
                  <Plus size={16} />
                </button>
              </div>

              <div className="task-list">
                {loading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)' }}>Загрузка...</div>
                ) : colTasks.map(task => (
                  <div key={task.id} className="task-card">
                    <div className="task-header">
                      <span className={`task-tag ${task.priority === 'высокий' ? 'high' : task.priority === 'средний' ? 'medium' : 'low'}`}>
                        {task.priority}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span className="task-id">{task.id}</span>
                        <button className="icon-btn" onClick={() => deleteTask(task.id)} title="Удалить">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <h4 className="task-title">{task.title}</h4>
                    
                    {/* Quick move buttons */}
                    <div className="task-move-actions">
                      {columns.filter(c => c.id !== col.id).map(c => (
                        <button key={c.id} className="move-btn" onClick={() => moveTask(task.id, c.id)} title={`→ ${c.title}`}>
                          {c.title.substring(0, 3)}
                        </button>
                      ))}
                    </div>

                    <div className="task-footer">
                      <div className="task-meta">
                        <Clock size={12} />
                        <span>{task.date}</span>
                      </div>
                      <div className="task-assignee">
                        <UserCircle2 size={16} />
                        <span>{task.assignee}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="add-task-inline" onClick={() => { resetForm(); setTargetColumn(col.id); setShowModal(true); }}>
                  <Plus size={16} />
                  <span>Добавить задачу</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title="Новая задача"
        footer={
          <>
            <button className="btn-outline" onClick={() => { setShowModal(false); resetForm(); }}>Отмена</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !formData.title}>
              <Save size={16} />
              {saving ? 'Сохранение...' : 'Создать'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Заголовок задачи</label>
          <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Описание задачи..." />
        </div>
        <div className="form-group">
          <label>Приоритет</label>
          <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
            <option value="высокий">Высокий</option>
            <option value="средний">Средний</option>
            <option value="низкий">Низкий</option>
          </select>
        </div>
        <div className="form-group">
          <label>Исполнитель</label>
          <input type="text" value={formData.assignee} onChange={(e) => setFormData({...formData, assignee: e.target.value})} placeholder="AD, MK, JD..." />
        </div>
        <div className="form-group">
          <label>Колонка</label>
          <select value={targetColumn} onChange={(e) => setTargetColumn(e.target.value)}>
            {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
};

export default Kanban;
