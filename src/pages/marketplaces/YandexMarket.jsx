import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, 
  RefreshCcw, 
  Package, 
  AlertCircle,
  ExternalLink,
  Lock,
  Search,
  MessageSquare,
  Activity,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { getYandexConfig, saveYandexConfig, fetchYandexProducts, syncProducts } from '../../utils/marketplaces/yandexMarket';
import YandexChats from './YandexChats';
import './Marketplaces.css';

const YandexMarket = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [config, setConfig] = useState(getYandexConfig());
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchYandexProducts();
      setProducts(data || []);
    } catch (err) {
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    saveYandexConfig(config);
    alert('Настройки Яндекс Маркета сохранены!');
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const result = await syncProducts();
      await loadProducts();
      alert(`Синхронизация завершена успешно! Обновлено товаров: ${result.count}`);
    } catch (err) {
      setError(err.message || 'Ошибка синхронизации');
    } finally {
      setSyncing(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
        return 0;
      });
  }, [products, searchTerm, statusFilter, sortBy]);

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
            whileHover={{ scale: 1.1, rotate: -10 }}
            className="logo-hex yandex"
            style={{ background: 'linear-gradient(135deg, #ff0000, #ff4d4d)' }}
          >
            YM
          </Motion.div>
          <div className="brand-titles ml-6">
            <h1 className="text-white">Яндекс <span className="text-gradient">Маркет</span></h1>
            <div className="flex items-center gap-3">
              <span className={`status-pill ${error ? 'error' : 'success'}`}>
                <Activity size={10} />
                {error ? 'API ERROR' : 'OPERATIONAL'}
              </span>
              <span className="text-[10px] text-dim font-bold tracking-[0.2em] uppercase">Partner Hub v2.1</span>
            </div>
          </div>
        </div>

        <div className="header-metrics">
          <div className="metric-box">
             <div className="flex flex-col">
               <span className="m-label">АКТИВНЫЕ SKU</span>
               <div className="flex items-baseline gap-2">
                 <span className="m-value">{products.length}</span>
                 <span className="text-[#3b82f6] text-xs font-bold opacity-60">UNITS</span>
               </div>
             </div>
             <div className="m-decoration blue"></div>
          </div>
          <div className="metric-box">
             <div className="flex flex-col">
               <span className="m-label">ВНЕ ВИТРИНЫ</span>
               <div className="flex items-baseline gap-2">
                 <span className="m-value">{products.filter(p => p.status === 'DELISTED').length}</span>
                 <TrendingUp size={14} className="text-rose-400 rotate-180" />
               </div>
             </div>
             <div className="m-decoration purple"></div>
          </div>
        </div>
      </Motion.div>

      {/* Navigation & Controls */}
      <div className="marketplace-controls mt-8">
        <div className="luxury-tab-bar">
          {[
            { id: 'overview', icon: LayoutGrid, label: 'ТОВАРЫ' },
            { id: 'chats', icon: MessageSquare, label: 'ЧАТЫ' },
            { id: 'keys', icon: Lock, label: 'КЛЮЧИ' },
            { id: 'settings', icon: Settings, label: 'API' }
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
              placeholder="Поиск по базе..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`btn-refresh-luxury ${syncing ? 'loading' : ''}`} 
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCcw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'SYNCING' : 'SYNC'}
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
          className="content-area"
        >
          {activeTab === 'overview' && (
            <div className="modern-table-card glass-premium mt-8">
              <table className="luxury-table w-full">
                <thead>
                  <tr>
                    <th>SKU IDENTIFIER</th>
                    <th>PRODUCT NAME</th>
                    <th>VALUATION</th>
                    <th>STOCK</th>
                    <th>LIFECYCLE</th>
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
                  ) : filteredProducts.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-20 text-dim italic">Данные отсутствуют или не найдены</td></tr>
                  ) : (
                    filteredProducts.map((p, idx) => (
                      <Motion.tr 
                        key={p.sku || `p-${idx}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                      >
                        <td className="mono-blue text-xs opacity-70">{p.sku || 'N/A'}</td>
                        <td>
                          <div className="flex flex-col">
                            <span className="text-white font-bold leading-tight">{p.name}</span>
                            <span className="text-[#94a3b8] text-[10px] font-bold tracking-wider">YANDEX MARKET SKU</span>
                          </div>
                        </td>
                        <td className="font-bold text-white">{p.price} ₽</td>
                        <td className="mono text-xs text-dim">{p.stock} units</td>
                        <td>
                          <span className={`status-pill ${p.status === 'PUBLISHED' ? 'active' : 'paused'}`}>
                            {p.status === 'PUBLISHED' ? 'ON STOREFRONT' : 'HIDDEN'}
                          </span>
                        </td>
                        <td className="text-right">
                          <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                            <Lock size={14} className="text-blue-400" />
                          </button>
                        </td>
                      </Motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-grid mt-8">
              <Motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-premium p-10"
              >
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                    <Settings className="text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">YM CONFIGURATION</h3>
                    <p className="text-dim text-[10px] font-bold tracking-widest">PARTNER API ACCESS</p>
                  </div>
                </div>

                <form onSubmit={handleSaveConfig} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dim tracking-widest uppercase">CAMPAIGN ID</label>
                    <input 
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-white focus:border-rose-500 transition-colors outline-none font-mono"
                      type="text" 
                      value={config.campaignId}
                      onChange={(e) => setConfig({...config, campaignId: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-dim tracking-widest uppercase">OAUTH TOKEN</label>
                    <input 
                      className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 text-white focus:border-rose-500 transition-colors outline-none font-mono text-xs"
                      type="password" 
                      value={config.oauthToken}
                      onChange={(e) => setConfig({...config, oauthToken: e.target.value})}
                    />
                  </div>
                  <Motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="btn-update-config py-5 w-full uppercase font-bold tracking-[0.2em] bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600/30 text-rose-400 rounded-2xl"
                  >
                    SAVE IDENTITY
                  </Motion.button>
                </form>
              </Motion.div>

              <div className="space-y-8">
                 <div className="glass-premium p-8 border-l-4 border-amber-500 bg-amber-500/5">
                  <h4 className="font-bold flex items-center gap-2 mb-2">
                    <AlertCircle size={16} className="text-amber-400" />
                    Marketplace Policy
                  </h4>
                  <p className="text-sm text-dim leading-relaxed">
                    Для корректной работы с цифровыми товарами убедитесь, что ваш магазин работает в режиме 'API-only' или имеет соответствующие допуски в кабинете.
                  </p>
                </div>
                
                <div className="glass-premium p-8 border-l-4 border-blue-500 bg-blue-500/5">
                  <h4 className="font-bold flex items-center gap-2 mb-2">
                    <ExternalLink size={16} className="text-blue-400" />
                    Vendor Dashboard
                  </h4>
                  <p className="text-sm text-dim mb-4">Переход в официальный кабинет продавца Яндекс Маркета.</p>
                  <a href="https://partner.market.yandex.ru/" target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-400 hover:underline">
                    OPEN PARTNER CABINET →
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="mt-8">
               <YandexChats />
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="keys-view mt-8">
              <div className="glass-premium p-12 text-center">
                <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-500/30">
                  <Lock size={32} className="text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Digital Key Storage</h3>
                <p className="text-dim max-w-md mx-auto mb-8 leading-relaxed">
                  Здесь вы сможете привязывать списки ключей к SKU Яндекс Маркета. Система будет автоматически выдавать их при покупке.
                </p>
                <div className="flex justify-center gap-4">
                  <button className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors uppercase text-[10px] font-bold tracking-widest">
                    Upload .CSV Base
                  </button>
                  <button className="px-8 py-4 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 uppercase text-[10px] font-bold tracking-widest">
                    Connect KMS
                  </button>
                </div>
              </div>
            </div>
          )}
        </Motion.div>
      </AnimatePresence>
    </div>
  );
};

export default YandexMarket;
