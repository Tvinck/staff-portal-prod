import React, { useState, useEffect } from 'react';
import { 
  Store, RefreshCw, ShoppingCart, TrendingUp, AlertCircle, Package, Database, Tag, Search
} from 'lucide-react';
import { getDigisellerToken, getDigisellerSells, getDigisellerGoods } from '../../utils/digisellerApi';
import './marketplaces.css';

const Digiseller = () => {
  const [sales, setSales] = useState([]);
  const [goods, setGoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ count: 0, revenue: 0, goodsCount: 0 });
  const [activeTab, setActiveTab] = useState('sales'); // sales | goods

  const fetchDigisellerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getDigisellerToken();
      // Fetch last 50 sales
      const sellsData = await getDigisellerSells(token, 50);
      let rev = 0;
      let salesCount = 0;
      if (sellsData && sellsData.rows) {
        setSales(sellsData.rows);
        salesCount = sellsData.rows.length;
        rev = sellsData.rows.reduce((acc, row) => acc + (row.amount_usd || 0), 0);
      } else {
        setSales([]);
      }

      // Fetch goods (products)
      const goodsData = await getDigisellerGoods(token, 500);
      let gCount = 0;
      if (goodsData && goodsData.rows) {
        setGoods(goodsData.rows);
        gCount = goodsData.rows.length;
      } else {
        setGoods([]);
      }

      setStats({ count: salesCount, revenue: rev, goodsCount: gCount });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ошибка подключения к Digiseller API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDigisellerData();
  }, []);

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <div className="marketplace-title">
          <Store className="marketplace-icon text-primary" size={32} />
          <div>
            <h1>Digiseller</h1>
            <p>Управление и статистика продаж</p>
          </div>
        </div>
        <button 
          className="btn-primary" 
          onClick={fetchDigisellerData} 
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? "spin" : ""} />
          Обновить данные
        </button>
      </div>

      {error && (
        <div className="alert-box error" style={{marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10}}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
            <ShoppingCart size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Последние продажи</span>
            <h2 className="stat-value">{stats.count} шт.</h2>
          </div>
        </div>
        
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e'}}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Выручка (USD) с последних продаж</span>
            <h2 className="stat-value text-success">
              ${stats.revenue.toFixed(2)}
            </h2>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{marginBottom: 24, display: 'flex', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16}}>
        <button 
          className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'sales' ? '#fff' : '#a1a1aa',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'sales' ? '2px solid #6c47ff' : '2px solid transparent',
            paddingBottom: 8,
            transition: 'all 0.3s'
          }}
        >
          История продаж
        </button>
        <button 
          className={`tab-btn ${activeTab === 'goods' ? 'active' : ''}`}
          onClick={() => setActiveTab('goods')}
          style={{
            background: 'transparent',
            border: 'none',
            color: activeTab === 'goods' ? '#fff' : '#a1a1aa',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            borderBottom: activeTab === 'goods' ? '2px solid #6c47ff' : '2px solid transparent',
            paddingBottom: 8,
            transition: 'all 0.3s'
          }}
        >
          Мои товары ({stats.goodsCount})
        </button>
      </div>

      {activeTab === 'sales' && (
        <div className="glass-card luxury-border table-container">
          <div className="table-header">
            <h3>Последние покупки</h3>
          </div>
          
          {loading ? (
            <div style={{padding: 40, textAlign: 'center'}}><div className="loader"></div></div>
          ) : sales.length === 0 ? (
            <div style={{padding: 40, textAlign: 'center', color: '#a1a1aa'}}>
              Продажи не найдены или нет данных.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Счет</th>
                  <th>Товар</th>
                  <th>Email покупателя</th>
                  <th>Сумма (USD)</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.inv}>
                    <td className="date-cell">
                      {new Date(sale.date_pay).toLocaleDateString()} <br/>
                      <span style={{fontSize: 11, color: '#a1a1aa'}}>{new Date(sale.date_pay).toLocaleTimeString()}</span>
                    </td>
                    <td><span className="tx-id">#{sale.inv}</span></td>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        <div className="item-icon-small"><Package size={14}/></div>
                        <span title={sale.name_goods}>{sale.name_goods?.length > 40 ? sale.name_goods.substring(0, 40) + '...' : sale.name_goods}</span>
                      </div>
                    </td>
                    <td style={{color: '#38bdf8'}}>{sale.email}</td>
                    <td className="amount-cell text-success">+${(sale.amount_usd || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'goods' && (
        <div className="glass-card luxury-border table-container">
          <div className="table-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>Активные товары Digiseller</h3>
          </div>
          
          {loading ? (
            <div style={{padding: 40, textAlign: 'center'}}><div className="loader"></div></div>
          ) : goods.length === 0 ? (
            <div style={{padding: 40, textAlign: 'center', color: '#a1a1aa'}}>
              Товары не найдены.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Цена (USD)</th>
                  <th>Остаток</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {goods.map((item) => (
                  <tr key={item.id_goods}>
                    <td><span className="tx-id">#{item.id_goods}</span></td>
                    <td>
                      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                        <div className="item-icon-small" style={{background: 'rgba(108, 71, 255, 0.1)', color: '#6c47ff'}}>
                          <Tag size={14}/>
                        </div>
                        <span title={item.name_goods}>
                          {item.name_goods?.length > 50 ? item.name_goods.substring(0, 50) + '...' : item.name_goods}
                        </span>
                      </div>
                    </td>
                    <td style={{fontWeight: 600}}>
                      ${Number(item.price_usd || 0).toFixed(2)}
                      <span style={{fontSize: 11, color: '#a1a1aa', display: 'block'}}>
                        {Number(item.price_rub || 0).toFixed(0)} ₽
                      </span>
                    </td>
                    <td>
                      {item.num_in_stock > 0 ? (
                        <span style={{color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: 6}}>
                          <Database size={14} color="#3b82f6"/> {item.num_in_stock} шт.
                        </span>
                      ) : (
                        <span style={{color: '#f87171'}}>Нет в наличии</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${item.is_hidden ? 'error' : 'success'}`}>
                        {item.is_hidden ? 'Скрыт' : 'Активен'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Digiseller;
