import React, { useState, useEffect, useCallback } from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, Search, Plus, Download,
  MoreVertical, CheckCircle2, Save, Edit2, Trash2
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import { getDesslyBalance } from '../../utils/desslyApi';
import Modal from '../../components/ui/Modal';
import './Finance.css';

const Finance = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense', amount: '', project: 'bazzar_market', 
    category: '', description: ''
  });

  const resetForm = () => {
    setFormData({ type: 'expense', amount: '', project: 'bazzar_market', category: '', description: '' });
  };

  const fetchFinanceData = useCallback(async () => {
    setLoading(true);
    const { data: txs, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(txs || []);
      
      let balance = 0, income = 0, expense = 0;
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      (txs || []).forEach(tx => {
        const amount = Number(tx.amount);
        if (tx.type === 'income') {
          balance += amount;
          if (new Date(tx.created_at) >= firstDayOfMonth) income += amount;
        } else {
          balance -= amount;
          if (new Date(tx.created_at) >= firstDayOfMonth) expense += amount;
        }
      });

      setTotalBalance(balance);
      setMonthlyIncome(income);
      setMonthlyExpense(expense);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFinanceData();
    const fetchDessly = async () => {
      try {
        const data = await getDesslyBalance();
        if (data.balance) {
          const el = document.getElementById('dessly-balance-display');
          if (el) el.innerText = `${data.balance}`;
        }
      } catch {
        const el = document.getElementById('dessly-balance-display');
        if (el) el.innerText = 'Err';
      }
    };
    fetchDessly();
  }, [fetchFinanceData]);

  const handleSave = async () => {
    if (!formData.amount || !formData.project) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('transactions').insert([{
        ...formData,
        amount: parseFloat(formData.amount),
        status: 'completed'
      }]);
      if (error) throw error;
      setShowModal(false);
      resetForm();
      fetchFinanceData();
    } catch (err) {
      console.error('Save error:', err);
      alert('Ошибка: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить эту транзакцию?')) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) fetchFinanceData();
  };

  const handleExport = () => {
    if (transactions.length === 0) return;
    const headers = ['Дата', 'Проект', 'Категория', 'Описание', 'Тип', 'Сумма'];
    const rows = transactions.map(tx => [
      new Date(tx.created_at).toLocaleDateString(),
      tx.project, tx.category || '', tx.description || '',
      tx.type, tx.amount
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="finance-module">
      {/* Financial Overview Cards */}
      <div className="finance-stats-grid">
        <div className="finance-card glass-card">
          <div className="card-icon balance"><Wallet size={24} /></div>
          <div className="card-info">
            <span className="card-label">Общий баланс</span>
            <h2 className="card-value">{formatCurrency(totalBalance)}</h2>
          </div>
        </div>
        <div className="finance-card glass-card">
          <div className="card-icon balance" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <img src="https://www.vectorlogo.zone/logos/steampowered/steampowered-icon.svg" width="24" alt="DH" style={{ filter: 'brightness(1.5)' }} />
          </div>
          <div className="card-info">
            <span className="card-label">Dessly (USDT)</span>
            <h2 className="card-value" id="dessly-balance-display">Загрузка...</h2>
          </div>
        </div>
        <div className="finance-card glass-card">
          <div className="card-icon income"><TrendingUp size={24} /></div>
          <div className="card-info">
            <span className="card-label">Доход (мес)</span>
            <h2 className="card-value text-success">{formatCurrency(monthlyIncome)}</h2>
          </div>
        </div>
        <div className="finance-card glass-card">
          <div className="card-icon expense"><TrendingDown size={24} /></div>
          <div className="card-info">
            <span className="card-label">Расход (мес)</span>
            <h2 className="card-value text-danger">{formatCurrency(monthlyExpense)}</h2>
          </div>
        </div>
      </div>

      <div className="module-controls">
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" placeholder="Поиск транзакций..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="action-group">
          <button className="btn-outline" onClick={handleExport}>
            <Download size={18} />
            Экспорт
          </button>
          <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus size={18} />
            Новая операция
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-container glass-card luxury-border">
        <table className="finance-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Проект</th>
              <th>Категория</th>
              <th>Описание</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '48px' }}><div className="loader"></div></td></tr>
            ) : filteredTransactions.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-dim)' }}>Транзакции не найдены</td></tr>
            ) : filteredTransactions.map(tx => (
              <tr key={tx.id}>
                <td className="date-cell">
                  <div className="date-text">{new Date(tx.created_at).toLocaleDateString()}</div>
                  <div className="time-text">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td>
                  <span className={`project-pill ${tx.project}`}>
                    {tx.project?.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="category-cell">{tx.category}</td>
                <td className="description-cell">{tx.description}</td>
                <td className={`amount-cell ${tx.type}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </td>
                <td>
                  <span className="status-badge success">
                    <CheckCircle2 size={12} />
                    Выполнено
                  </span>
                </td>
                <td>
                  <button className="btn-outline btn-sm text-danger" onClick={() => handleDelete(tx.id)} title="Удалить">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Transaction Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title="Новая финансовая операция"
        footer={
          <>
            <button className="btn-outline" onClick={() => { setShowModal(false); resetForm(); }}>Отмена</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !formData.amount}>
              <Save size={16} />
              {saving ? 'Сохранение...' : 'Добавить'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Тип операции</label>
          <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
            <option value="income">Доход</option>
            <option value="expense">Расход</option>
          </select>
        </div>
        <div className="form-group">
          <label>Сумма (₽)</label>
          <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
        </div>
        <div className="form-group">
          <label>Проект</label>
          <select value={formData.project} onChange={(e) => setFormData({...formData, project: e.target.value})}>
            <option value="bazzar_market">Bazzar Market</option>
            <option value="zent_vpn">ZENT VPN</option>
            <option value="pixel_ai">Pixel AI</option>
            <option value="desslyhub">DesslyHub</option>
            <option value="ggsel">GGSEL</option>
            <option value="yandex_market">Яндекс Маркет</option>
            <option value="other">Другое</option>
          </select>
        </div>
        <div className="form-group">
          <label>Категория</label>
          <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="Подписки, Серверы, Реклама..." />
        </div>
        <div className="form-group">
          <label>Описание</label>
          <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Описание транзакции..." />
        </div>
      </Modal>
    </div>
  );
};

export default Finance;
