import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  AlertCircle,
  Apple,
  Plus,
  MoreVertical,
  CheckCircle2,
  RefreshCcw,
  MessageSquare,
  Search,
  Package,
  Clock,
  Loader2,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import './MarketManager.css';

const MarketManager = () => {
  const [activeTab, setActiveTab] = useState('catalog');

  return (
    <div className="market-manager">
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <ShoppingBag size={18} />
          Каталог товаров
        </button>
        <button
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <Package size={18} />
          Заказы
        </button>
        <button
          className={`tab-btn ${activeTab === 'disputes' ? 'active' : ''}`}
          onClick={() => setActiveTab('disputes')}
        >
          <AlertCircle size={18} />
          Споры
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'catalog' && <CatalogTab />}
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'disputes' && <DisputesTab />}
      </div>
    </div>
  );
};

/* ===== MODAL FOR PRODUCT EDIT ===== */
const EditProductModal = ({ product, isOpen, onClose, onSave, sharedAccounts = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    delivery_url: '',
    instruction: '',
    account_id: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category: product.category || '',
        price: product.price || 0,
        stock: product.stock || 0,
        delivery_url: product.data?.delivery_url || '',
        instruction: product.data?.instruction || '',
        account_id: product.data?.account_id || ''
      });
    }
  }, [product]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Редактирование: {product?.name}</h3>
          <button onClick={onClose} className="close-btn"><Plus style={{ transform: 'rotate(45deg)' }} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Название</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Цена (₽)</label>
              <input 
                type="number" 
                value={formData.price} 
                onChange={e => setFormData({...formData, price: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Сток</label>
              <input 
                type="number" 
                value={formData.stock} 
                onChange={e => setFormData({...formData, stock: e.target.value})} 
              />
            </div>
          </div>
          <div className="form-group">
            <label>Ссылка для выдачи (Delivery URL)</label>
            <input 
              type="text" 
              placeholder="https://..."
              value={formData.delivery_url} 
              onChange={e => setFormData({...formData, delivery_url: e.target.value})} 
            />
            <small>Клиент получит эту ссылку после оплаты (для ключей)</small>
          </div>
          <div className="form-group">
            <label>Привязанный общий аккаунт (для Apple ID/Игр)</label>
            <select 
              value={formData.account_id} 
              onChange={e => setFormData({...formData, account_id: e.target.value})}
            >
              <option value="">-- Без привязки (продажа ключей/ссылок) --</option>
              {sharedAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.credentials?.email})
                </option>
              ))}
            </select>
            <small>При выборе аккаунта логин и пароль будут выдаваться автоматически из базы</small>
          </div>
          <div className="form-group">
            <label>Инструкция</label>
            <textarea 
              value={formData.instruction} 
              onChange={e => setFormData({...formData, instruction: e.target.value})} 
              placeholder="Как пользоваться товаром..."
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Отмена</button>
          <button className="btn-save" onClick={() => onSave(formData)}>Сохранить</button>
        </div>
      </div>
    </div>
  );
};

/* ===== CATALOG TAB ===== */
const CatalogTab = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sharedAccounts, setSharedAccounts] = useState([]);

  const fetchProductsAndAccounts = useCallback(async () => {
    setLoading(true);
    
    // Fetch products
    const { data: productsData, error: productsError } = await supabase
      .from('market_catalog')
      .select('*')
      .order('category')
      .order('created_at', { ascending: false });

    // Fetch shared accounts
    const { data: accountsData } = await supabase
      .from('shared_accounts')
      .select('id, name, credentials');

    if (!productsError && productsData) setProducts(productsData);
    if (accountsData) setSharedAccounts(accountsData);
    
    setLoading(false);
  }, []);

  useEffect(() => { fetchProductsAndAccounts(); }, [fetchProductsAndAccounts]);

  const toggleActive = async (id, currentState) => {
    await supabase
      .from('market_catalog')
      .update({ is_active: !currentState })
      .eq('id', id);
    fetchProductsAndAccounts();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Удалить этот товар?')) return;
    await supabase.from('market_catalog').delete().eq('id', id);
    fetchProductsAndAccounts();
  };

  const openEdit = (product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleSaveProduct = async (formData) => {
    const { error } = await supabase
      .from('market_catalog')
      .update({
        name: formData.name,
        price: formData.price,
        stock: formData.stock,
        data: {
          ...(selectedProduct.data || {}),
          delivery_url: formData.delivery_url,
          instruction: formData.instruction,
          account_id: formData.account_id || null
        }
      })
      .eq('id', selectedProduct.id);

    if (error) {
      alert('Ошибка сохранения: ' + error.message);
    } else {
      setIsEditModalOpen(false);
      fetchProductsAndAccounts();
    }
  };

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="section-card">
      <div className="section-header">
        <div className="search-container mini">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Фильтр товаров..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-small flex-center gap-2" onClick={fetchProductsAndAccounts}>
            <RefreshCcw size={16} />
            Обновить
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <Loader2 size={24} className="spin-animation" style={{ margin: '0 auto 8px' }} />
          Загрузка каталога...
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Название товара</th>
                <th>Категория</th>
                <th>Цена</th>
                <th>Сток</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td className="font-medium">{p.name}</td>
                  <td><span className="category-badge">{p.category}</span></td>
                  <td>{p.price} ₽</td>
                  <td>{p.stock ?? '∞'}</td>
                  <td>
                    <span className={`status-text ${p.is_active ? 'active' : 'paused'}`}>
                      {p.is_active ? 'Активен' : 'Пауза'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="action-icon"
                        title="Редактировать"
                        onClick={() => openEdit(p)}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="action-icon"
                        title={p.is_active ? 'Деактивировать' : 'Активировать'}
                        onClick={() => toggleActive(p.id, p.is_active)}
                      >
                        {p.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        className="action-icon"
                        title="Удалить"
                        onClick={() => deleteProduct(p.id)}
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    {search ? 'Ничего не найдено' : 'Каталог пуст'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px' }}>
        Всего товаров: {products.length} • Активных: {products.filter(p => p.is_active).length}
      </div>

      <EditProductModal 
        product={selectedProduct}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProduct}
        sharedAccounts={sharedAccounts}
      />
    </section>
  );
};

/* ===== ORDERS TAB ===== */
const OrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('market_orders')
      .select(`
        id,
        status,
        price,
        created_at,
        data,
        product:market_catalog(name, category)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (!error && data) setOrders(data);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    await supabase
      .from('market_orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    fetchOrders();
  };

  const statusLabel = (s) => ({
    pending: 'Ожидание',
    paid: 'Оплачен',
    delivered: 'Доставлен',
    cancelled: 'Отменён',
  }[s] || s);

  const statusColor = (s) => ({
    pending: '#f59e0b',
    paid: '#3b82f6',
    delivered: '#22c55e',
    cancelled: '#ef4444',
  }[s] || '#888');

  // Stats
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? (o.price || 0) : 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  return (
    <section className="section-card">
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{totalRevenue.toLocaleString()} ₽</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Выручка</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{pendingCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Ожидают</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>{deliveredCount}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Доставлено</div>
        </div>
      </div>

      {/* Filters */}
      <div className="section-header">
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'pending', 'paid', 'delivered', 'cancelled'].map(s => (
            <button
              key={s}
              className={`btn-small ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
              style={statusFilter === s ? { background: 'var(--primary-color)', color: 'white' } : {}}
            >
              {s === 'all' ? 'Все' : statusLabel(s)}
            </button>
          ))}
        </div>
        <button className="btn-small flex-center gap-2" onClick={fetchOrders}>
          <RefreshCcw size={16} />
        </button>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <Loader2 size={24} className="spin-animation" style={{ margin: '0 auto 8px' }} />
          Загрузка заказов...
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Товар</th>
                <th>Сумма</th>
                <th>Email</th>
                <th>Статус</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{o.id?.slice(0, 8)}...</td>
                  <td className="font-medium">{o.product?.name || '—'}</td>
                  <td>{o.price} ₽</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{o.data?.email || '—'}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ color: statusColor(o.status), background: statusColor(o.status) + '15', border: `1px solid ${statusColor(o.status)}30` }}
                    >
                      {statusLabel(o.status)}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(o.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {o.status === 'pending' && (
                        <button className="btn-small" onClick={() => updateStatus(o.id, 'paid')} style={{ color: '#3b82f6', fontSize: '11px' }}>
                          Оплачен
                        </button>
                      )}
                      {o.status === 'paid' && (
                        <button className="btn-small" onClick={() => updateStatus(o.id, 'delivered')} style={{ color: '#22c55e', fontSize: '11px' }}>
                          Доставлен
                        </button>
                      )}
                      {o.status !== 'cancelled' && o.status !== 'delivered' && (
                        <button className="btn-small" onClick={() => updateStatus(o.id, 'cancelled')} style={{ color: '#ef4444', fontSize: '11px' }}>
                          Отмена
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    Заказов нет
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '13px' }}>
        Всего заказов: {orders.length}
      </div>
    </section>
  );
};

/* ===== DISPUTES TAB ===== */
const DisputesTab = () => {
  const disputes = [
    { id: 'TIC-102', user: 'bob_scam', issue: 'Аккаунт заблокирован', date: '1ч назад', status: 'pending' },
    { id: 'TIC-101', user: 'jane_doe', issue: 'Ошибка сертификата', date: '3ч назад', status: 'resolved' },
    { id: 'TIC-100', user: 'mike_99', issue: 'Неверный регион', date: 'Вчера', status: 'pending' },
  ];

  return (
    <section className="section-card">
      <div className="section-header">
        <div className="section-title">
          <MessageSquare size={18} />
          <h3>Открытые тикеты поддержки</h3>
        </div>
      </div>
      <div className="dispute-list">
        {disputes.map(d => (
          <div key={d.id} className="dispute-item">
            <div className="dispute-main">
              <span className="dispute-id">{d.id}</span>
              <div className="dispute-info">
                <span className="dispute-user">{d.user}</span>
                <span className="dispute-issue">{d.issue}</span>
              </div>
            </div>
            <div className="dispute-meta">
              <span className="dispute-date">{d.date}</span>
              <span className={`status-badge ${d.status}`}>
                {d.status === 'pending' ? 'Ожидание' : 'Решено'}
              </span>
              <button className="btn-small">Управлять</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MarketManager;
