import React, { useState, useEffect } from 'react';
import { 
  Store, RefreshCw, ShoppingCart, TrendingUp, AlertCircle, Package
} from 'lucide-react';
import { getDigisellerToken, getDigisellerSells } from '../../utils/digisellerApi';
import './marketplaces.css';

const Digiseller = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ count: 0, revenue: 0 });

  const fetchDigisellerData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getDigisellerToken();
      // Fetch last 50 sales
      const sellsData = await getDigisellerSells(token, 50);
      
      if (sellsData && sellsData.rows) {
        setSales(sellsData.rows);
        
        // Calculate basic stats for current loaded rows
        const rev = sellsData.rows.reduce((acc, row) => acc + (row.amount_usd || 0), 0);
        setStats({ count: sellsData.rows.length, revenue: rev });
      } else {
        setSales([]);
      }
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

      {/* Sales Table */}
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

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Digiseller;
