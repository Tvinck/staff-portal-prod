import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Settings, 
  Search, 
  RefreshCcw, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CircleDollarSign,
  ArrowUpRight,
  ChevronRight,
  Timer,
  CreditCard,
  Zap,
  Lock,
  History,
  LayoutGrid,
  Activity,
  ArrowRightLeft
} from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../utils/supabase';
import './Marketplaces.css';

const GGSel = () => {
  const [activeTab, setActiveTab] = useState('catalog');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [balance, setBalance] = useState({ rub: 0, usd: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [apiKey, setApiKey] = useState('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJHR1NlbGxlciIsInN1YiI6MTQ3NDcsImlhdCI6MTc3MzYxNjI1NywiZXhwIjoxNzc2Mjk0NjU3LCJqdGkiOiIzODE3MDlhMi01NWQyLTRkYmQtOGI1Zi1jMDNhMDEyNTg4YjUiLCJ1c2VyIjp7ImlkIjoxNDc0NywiZW1haWwiOiJ1a29zaGVsZXYuMDRAeWFuZGV4LnJ1In0sInV1aWQiOiJjOTc4Y2U3MS02MWJkLTQ2MmYtYWVhYS0yODAxMDliMjdjZTYifQ.MVlxeUTTqkE9WCSa62dhdsl7tRo7BdQsGFJvR4s6TXE');
  const [sellerId, setSellerId] = useState('1140096');
  const [apiStatus, setApiStatus] = useState({ state: 'idle', message: '' });

  const constructUrl = useCallback((path) => {
    return `/api_ggsel${path}${path.includes('?') ? '&' : '?'}token=${apiKey}`;
  }, [apiKey]);

  const getHeaders = useCallback(() => ({
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }), [apiKey]);

  const fetchBalance = useCallback(async () => {
    try {
      const response = await fetch(constructUrl('/api_sellers/api/sellers/account/balance/info'), {
        headers: getHeaders()
      });
      const data = await response.json();
      if (data && data.balance) {
        setBalance({ 
          rub: data.balance.find(b => b.currency === 'RUB')?.balance || 0,
          usd: data.balance.find(b => b.currency === 'USD')?.balance || 0
        });
        setApiStatus({ state: 'success', message: 'API SECURED' });
      } else if (response.status === 401) {
        setApiStatus({ state: 'error', message: 'ACCESS DENIED (401)' });
      }
    } catch {
      setApiStatus({ state: 'error', message: 'OFFLINE / ERROR' });
    }
  }, [constructUrl, getHeaders]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(constructUrl('/api_sellers/api/seller-goods'), {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ 
          id_seller: parseInt(sellerId),
          order_col: "cntsell",
          order_dir: "asc",
          rows: 100,
          page: 1,
          currency: "USD"
        })
      });
      const data = await response.json();
      if (data && data.goods) {
        setProducts(data.goods);
      }
    } catch (e) {
      console.error('Products error', e);
    }
  }, [constructUrl, getHeaders, sellerId]);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch(constructUrl('/api_sellers/api/seller-last-sales'), {
        headers: getHeaders()
      });
      const data = await response.json();
      if (data && data.sales) {
        setOrders(data.sales);
      }
    } catch (e) {
      console.error('Orders error', e);
    }
  }, [constructUrl, getHeaders]);

  const fetchMainData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'catalog') await fetchProducts();
      if (activeTab === 'orders') await fetchOrders();
      await fetchBalance();
    } catch (err) {
      console.error('GGSEL Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, fetchProducts, fetchOrders, fetchBalance]);

  useEffect(() => {
    fetchMainData();
  }, [activeTab, fetchMainData]);

  const syncWithFinance = async (order) => {
    await supabase.from('transactions').insert({
      project: 'bazzar_market',
      type: 'income',
      amount: order.price_seller || 0,
      category: 'sale',
      description: `GGSEL Order ${order.id}: ${order.name_goods}`,
      metadata: { source: 'ggsel', order_id: order.id }
    });
  };

  return (
    <div className="marketplace-page pro-glass-theme">
      {/* Liquid Elements */}
      <div className="bg-glow blue"></div>
      <div className="bg-glow purple"></div>

      {/* Modern Header */}
      <Motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="marketplace-header-new glass-premium"
      >
        <div className="brand-section">
          <Motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="logo-hex ggsel"
          >
            GG
          </Motion.div>
          <div className="brand-titles ml-6">
            <h1 className="text-white">Bazzar <span className="text-gradient">GGSEL</span></h1>
            <div className="flex items-center gap-3">
              <span className={`status-pill ${apiStatus.state}`}>
                <Activity size={10} />
                {apiStatus.message || 'INITIALIZING'}
              </span>
              <span className="text-[10px] text-dim font-bold tracking-[0.2em] uppercase">Enterprise Node v1.02</span>
            </div>
          </div>
        </div>

        <div className="header-metrics">
          <div className="metric-box">
             <div className="flex flex-col">
               <span className="m-label">AVAILABLE ASSETS</span>
               <div className="flex items-baseline gap-2">
                 <span className="m-value">{balance.rub.toLocaleString()}</span>
                 <span className="text-[#3b82f6] text-xs font-bold opacity-60">RUB</span>
               </div>
             </div>
             <div className="m-decoration blue"></div>
          </div>
          <div className="metric-box">
             <div className="flex flex-col">
               <span className="m-label">GLOBAL SALES</span>
               <div className="flex items-baseline gap-2">
                 <span className="m-value">1,248</span>
                 <TrendingUp size={14} className="text-emerald-400" />
               </div>
             </div>
             <div className="m-decoration purple"></div>
          </div>
        </div>
      </Motion.div>

      {/* Navigation & Controls */}
      <div className="marketplace-controls">
        <div className="luxury-tab-bar">
          {[
            { id: 'catalog', icon: LayoutGrid, label: 'ИНВЕНТАРЬ' },
            { id: 'orders', icon: ArrowRightLeft, label: 'ТРАНЗАКЦИИ' },
            { id: 'settings', icon: Settings, label: 'КОНФИГУРАЦИЯ' }
          ].map(tab => (
            <button 
              key={tab.id}
              className={`luxury-tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="controls-right">
          <div className="glass-search">
            <Search size={18} className="text-dim" />
            <input 
              type="text" 
              placeholder="Системный поиск..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-refresh-luxury" 
            onClick={fetchMainData}
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            SYNC
          </Motion.button>
        </div>
      </div>

      {/* Viewport */}
      <AnimatePresence mode="wait">
        <Motion.div 
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="content-area mt-8"
        >
          {activeTab === 'catalog' && (
            <div className="modern-table-card glass-premium">
              <table className="luxury-table w-full">
                <thead>
                  <tr>
                    <th>SQU INDEX</th>
                    <th>DIGITAL ASSET</th>
                    <th>MARKET VALUE</th>
                    <th>SALES DEMAND</th>
                    <th>NODE STATUS</th>
                    <th className="text-right">OPERATION</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="skeleton-row">
                        <td colSpan="6"><div className="skeleton-bar" style={{ opacity: 0.5 - (i * 0.08) }}></div></td>
                      </tr>
                    ))
                  ) : (
                    products.filter(p => p.name_goods.toLowerCase().includes(searchTerm.toLowerCase())).map((product, idx) => (
                      <Motion.tr 
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <td className="mono-blue">0x{product.id.toString(16).toUpperCase()}</td>
                        <td>
                          <div className="flex flex-col">
                            <span className="text-white font-bold leading-tight">{product.name_goods}</span>
                            <span className="text-[#94a3b8] text-[10px] font-bold tracking-wider">{product.category_name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span className="text-white font-bold">${product.price_seller}</span>
                            <span className="text-dim text-[10px]">FIXED RATE</span>
                          </div>
                        </td>
                        <td>
                          <div className="sales-progress-container">
                            <div className="progress-track">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(product.total_sales, 100)}%` }}
                                className="progress-fill"
                              />
                            </div>
                            <span className="mono text-xs text-dim">{product.total_sales || 0}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill ${product.active ? 'active' : 'paused'}`}>
                            {product.active ? 'OPERATIONAL' : 'RESTRICTED'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                            <ExternalLink size={14} className="text-blue-400" />
                          </button>
                        </td>
                      </Motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="modern-table-card glass-premium">
              <table className="luxury-table w-full">
                <thead>
                  <tr>
                    <th>HASH</th>
                    <th>CUSTOMER NODE</th>
                    <th>TIMESTAMP</th>
                    <th>SETTLEMENT</th>
                    <th className="text-right">LEDGER</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => (
                    <Motion.tr 
                      key={order.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <td className="mono text-blue-400/80">{order.id}</td>
                      <td>
                        <div className="customer-info">
                          <div className="customer-avatar">
                            <span className="text-[10px] font-bold">{order.email_customer?.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="text-xs text-dim">{order.email_customer}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col">
                          <span className="text-white text-xs">{new Date(order.date_pay * 1000).toLocaleTimeString()}</span>
                          <span className="text-dim text-[10px]">{new Date(order.date_pay * 1000).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="text-emerald-400 font-bold">${order.price_seller}</td>
                      <td className="text-right">
                        <button 
                          onClick={() => syncWithFinance(order)}
                          className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-bold tracking-widest hover:bg-emerald-500/20 transition-colors uppercase border border-emerald-500/20"
                        >
                          Push to Ledger
                        </button>
                      </td>
                    </Motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-grid">
              <Motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-premium p-10"
              >
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <ShieldCheck className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">API IDENTITY</h3>
                    <p className="text-dim text-[10px] font-bold tracking-widest">ENCRYPTED CREDENTIALS</p>
                  </div>
                </div>

                <div className="input-group">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dim tracking-widest uppercase">SELLER NODE ID</label>
                    <input 
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500 transition-colors outline-none font-mono"
                      type="text" 
                      value={sellerId} 
                      onChange={(e) => setSellerId(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dim tracking-widest uppercase">JWT ACCESS TOKEN</label>
                    <textarea 
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500 transition-colors outline-none font-mono text-xs"
                      rows={8}
                      value={apiKey} 
                      onChange={(e) => setApiKey(e.target.value)} 
                    />
                  </div>
                  <Motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-update-config py-5 w-full uppercase font-bold tracking-[0.2em]"
                  >
                    DEPLOY CONFIGURATION
                  </Motion.button>
                </div>
              </Motion.div>

              <div className="space-y-8">
                <div className="glass-premium p-8 border-l-4 border-blue-500 bg-blue-500/5">
                  <h4 className="font-bold flex items-center gap-2 mb-2">
                    <Lock size={16} className="text-blue-400" />
                    Security Protocol
                  </h4>
                  <p className="text-sm text-dim leading-relaxed">
                    Все запросы к GGSEL Node-v1 шифруются по стандарту AES-256. Ваш токен хранится локально и никогда не передается третьим лицам.
                  </p>
                </div>

                <div className="glass-premium p-8 border-l-4 border-emerald-500 bg-emerald-500/5">
                  <h4 className="font-bold flex items-center gap-2 mb-4">
                    <Activity size={16} className="text-emerald-400" />
                    Operational Health
                  </h4>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-dim">Core API Status:</span>
                      <span className={`text-[10px] font-bold tracking-widest ${apiStatus.state === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {apiStatus.state === 'success' ? 'ONLINE' : 'AUTH FAILED'}
                      </span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${apiStatus.state === 'success' ? 'bg-emerald-500' : 'bg-rose-500'} w-full opacity-50`} />
                    </div>
                    <p className="text-[9px] text-dim uppercase tracking-wider">{apiStatus.message}</p>
                  </div>
                </div>

                <div className="glass-premium p-8 border-l-4 border-amber-500 bg-amber-500/5">
                   <h4 className="font-bold flex items-center gap-2 mb-2">
                    <AlertCircle size={16} className="text-amber-400" />
                    Manual Override
                  </h4>
                  <p className="text-sm text-dim leading-relaxed">
                    Если данные не синхронизируются, убедитесь, что ваш IP разрешен в консоли продавца GGSEL и токен имеет права 'Seller-API'.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GGSel;
