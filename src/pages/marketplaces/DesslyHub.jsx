import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3, Wallet, Gamepad2, Ticket, History, RefreshCw, Search, AlertCircle,
  CheckCircle2, Clock, ExternalLink, ChevronRight, TrendingUp, X, Gift,
  Smartphone, ArrowRightLeft, Zap, Copy, Eye, EyeOff, Filter, ChevronDown
} from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  getDesslyBalance, getDesslyTransactions, checkSteamLogin, topupSteam,
  getVoucherProducts, getAllExchangeRates, syncDesslyTransactions, buyVoucher,
  getSteamGiftCatalog, sendSteamGift, getMobileOperators, refillMobile
} from '../../utils/desslyApi';
import { supabase } from '../../utils/supabase';
import './DesslyHub.css';

/**
 * DesslyHub — Full Merchant Intelligence Dashboard.
 * 
 * Tab structure:
 * 1. Steam Top-Up — validate + execute wallet refills
 * 2. Steam Gift — browse catalog + send games
 * 3. Mobile Refill — operator selection + phone top-up
 * 4. Voucher Hub — browse + purchase digital vouchers
 * 5. Audit Logs — transaction history + sync
 */
const DesslyHub = () => {
  const [activeTab, setActiveTab] = useState('steam');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);

  // Balance & Rates
  const [balance, setBalance] = useState('—');
  const [exchangeRates, setExchangeRates] = useState({});
  const [ratesLoading, setRatesLoading] = useState(true);

  // Steam Top-Up
  const [steamUser, setSteamUser] = useState('');
  const [steamAmount, setSteamAmount] = useState('');
  const [steamCurrency, setSteamCurrency] = useState('RUB');
  const [steamCheckLoading, setSteamCheckLoading] = useState(false);
  const [canRefill, setCanRefill] = useState(null);

  // Steam Gift
  const [giftCatalog, setGiftCatalog] = useState([]);
  const [giftSearch, setGiftSearch] = useState('');
  const [giftSteamId, setGiftSteamId] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);

  // Mobile Refill
  const [operators, setOperators] = useState([]);
  const [mobilePhone, setMobilePhone] = useState('');
  const [mobileAmount, setMobileAmount] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');

  // Vouchers
  const [vouchers, setVouchers] = useState([]);
  const [voucherSearch, setVoucherSearch] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState('');

  // Transactions
  const [transactions, setTransactions] = useState([]);
  const [txPage, setTxPage] = useState(1);
  const [txFilter, setTxFilter] = useState('all');
  const [isSyncingTxs, setIsSyncingTxs] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const apiKeyMasked = 'b067ff••••••••••••••••••2b59e';
  const apiKeyFull = import.meta.env.VITE_DESSLY_API_KEY;

  // ─── Data Fetching ──────────────────────────────────────────

  const fetchBalance = useCallback(async () => {
    const data = await getDesslyBalance();
    if (!data.error && data.balance) setBalance(data.balance);
  }, []);

  const fetchExchangeRates = useCallback(async () => {
    setRatesLoading(true);
    const rates = await getAllExchangeRates();
    setExchangeRates(rates);
    setRatesLoading(false);
  }, []);

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data: localTxs } = await supabase
        .from('dessly_transactions').select('*')
        .order('created_at', { ascending: false }).limit(50);
      
      if (localTxs?.length > 0) {
        setTransactions(localTxs);
      } else {
        const data = await getDesslyTransactions(page);
        if (!data.error && data.transactions) setTransactions(data.transactions);
      }
    } catch {
      console.warn('Transaction fetch fallback');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    const data = await getVoucherProducts();
    if (!data.error && data.products) setVouchers(data.products);
    setLoading(false);
  }, []);

  const fetchGiftCatalog = useCallback(async () => {
    setLoading(true);
    const data = await getSteamGiftCatalog();
    if (!data.error && data.products) setGiftCatalog(data.products);
    else setGiftCatalog([]);
    setLoading(false);
  }, []);

  const fetchOperators = useCallback(async () => {
    const data = await getMobileOperators();
    if (!data.error && data.operators) setOperators(data.operators);
    else setOperators([]);
  }, []);

  // ─── Initial Load ───────────────────────────────────────────

  useEffect(() => {
    fetchBalance();
    fetchExchangeRates();
  }, [fetchBalance, fetchExchangeRates]);

  useEffect(() => {
    if (activeTab === 'vouchers' && vouchers.length === 0) fetchVouchers();
    if (activeTab === 'history') fetchTransactions(txPage);
    if (activeTab === 'gift' && giftCatalog.length === 0) fetchGiftCatalog();
    if (activeTab === 'mobile' && operators.length === 0) fetchOperators();
  }, [activeTab, vouchers.length, giftCatalog.length, operators.length, txPage]);

  // ─── Action Handlers ───────────────────────────────────────

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const handleSteamCheck = async () => {
    if (!steamUser || !steamAmount) return;
    setSteamCheckLoading(true);
    setMessage(null);
    const data = await checkSteamLogin(steamUser, steamAmount);
    if (data.can_refill === "true" || data.can_refill === true) {
      setCanRefill(true);
      showMsg('success', `✓ Аккаунт "${steamUser}" готов к пополнению`);
    } else {
      setCanRefill(false);
      showMsg('error', data.error_description || data.message || 'Аккаунт не поддерживает пополнение');
    }
    setSteamCheckLoading(false);
  };

  const handleSteamTopup = async () => {
    if (!canRefill) return;
    setLoading(true);
    const data = await topupSteam(steamUser, steamAmount, `STAFF_${Date.now()}`);
    if (!data.error && data.transaction_id) {
      showMsg('success', `Пополнение ${data.transaction_id} выполнено! Сумма: ${steamAmount} ${steamCurrency}`);
      fetchBalance();
      setSteamUser(''); setSteamAmount(''); setCanRefill(null);
    } else {
      showMsg('error', data.message || 'Ошибка при проведении пополнения');
    }
    setLoading(false);
  };

  const handleSendGift = async () => {
    if (!selectedGame || !giftSteamId) return;
    setLoading(true);
    const data = await sendSteamGift(giftSteamId, selectedGame.id, `GIFT_${Date.now()}`);
    if (!data.error) {
      showMsg('success', `Подарок отправлен! TX: ${data.transaction_id || 'создан'}`);
      setSelectedGame(null); setGiftSteamId('');
      fetchBalance();
    } else {
      showMsg('error', data.message || 'Ошибка отправки подарка');
    }
    setLoading(false);
  };

  const handleMobileRefill = async () => {
    if (!mobilePhone || !mobileAmount || !selectedOperator) return;
    setLoading(true);
    const data = await refillMobile(mobilePhone, mobileAmount, selectedOperator, `MOB_${Date.now()}`);
    if (!data.error) {
      showMsg('success', `Пополнение ${mobilePhone} выполнено!`);
      setMobilePhone(''); setMobileAmount(''); setSelectedOperator('');
      fetchBalance();
    } else {
      showMsg('error', data.message || 'Ошибка пополнения');
    }
    setLoading(false);
  };

  const confirmVoucherPurchase = async () => {
    if (!selectedVoucher || !selectedVariant) return;
    setLoading(true);
    const data = await buyVoucher(selectedVoucher.id, selectedVariant);
    if (!data.error && data.transaction_id) {
      showMsg('success', `Ваучер куплен! ${data.code ? `Код: ${data.code}` : 'Ожидайте обработки'}`);
      setIsVoucherModalOpen(false);
      fetchBalance();
    } else {
      showMsg('error', data.message || 'Ошибка покупки');
    }
    setLoading(false);
  };

  const handleSyncTransactions = async () => {
    setIsSyncingTxs(true);
    try {
      await syncDesslyTransactions(2);
      await fetchTransactions();
      showMsg('success', 'Синхронизация завершена');
    } catch (err) {
      showMsg('error', 'Ошибка синхронизации: ' + err.message);
    }
    setIsSyncingTxs(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showMsg('success', 'Скопировано');
  };

  // ─── Computed ───────────────────────────────────────────────

  const filteredVouchers = useMemo(() =>
    vouchers.filter(v =>
      v.name?.toLowerCase().includes(voucherSearch.toLowerCase()) ||
      v.description?.toLowerCase().includes(voucherSearch.toLowerCase())
    ), [vouchers, voucherSearch]);

  const filteredGifts = useMemo(() =>
    giftCatalog.filter(g =>
      g.name?.toLowerCase().includes(giftSearch.toLowerCase())
    ), [giftCatalog, giftSearch]);

  const filteredTxs = useMemo(() =>
    txFilter === 'all'
      ? transactions
      : transactions.filter(tx => tx.service_type?.toLowerCase().includes(txFilter) || tx.status === txFilter
    ), [transactions, txFilter]);

  const tabs = [
    { id: 'steam', label: 'Steam Top-Up', icon: Gamepad2 },
    { id: 'gift', label: 'Steam Gift', icon: Gift },
    { id: 'mobile', label: 'Mobile Refill', icon: Smartphone },
    { id: 'vouchers', label: 'Voucher Hub', icon: Ticket },
    { id: 'history', label: 'Audit Logs', icon: History }
  ];

  // ─── Animation Config ──────────────────────────────────────

  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: 'easeOut' }
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="dessly-hub-page">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="dessly-page-header">
        <div className="dessly-header-left">
          <h1 className="dessly-title">DesslyHub Intelligence</h1>
          <p className="dessly-subtitle">Merchant Terminal & Multi-Service Gateway</p>
          <div className="dessly-api-info">
            <span className="api-status-dot"></span>
            <span className="api-key-display">
              API: {showApiKey ? apiKeyFull : apiKeyMasked}
            </span>
            <button className="icon-btn-tiny" onClick={() => setShowApiKey(!showApiKey)}>
              {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
            <button className="icon-btn-tiny" onClick={() => copyToClipboard(apiKeyFull)}>
              <Copy size={12} />
            </button>
          </div>
        </div>
        <button
          className="btn-dessly-outline"
          onClick={() => { setSyncing(true); fetchBalance(); fetchExchangeRates(); setTimeout(() => setSyncing(false), 1200); }}
        >
          <RefreshCw size={16} className={syncing ? 'sync-anim' : ''} />
          Refresh All
        </button>
      </div>

      {/* ── Global Alert ──────────────────────────────────── */}
      <AnimatePresence>
        {message && (
          <Motion.div className={`dessly-alert ${message.type}`} {...fadeUp}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
            <button className="alert-close" onClick={() => setMessage(null)}><X size={14} /></button>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats Dashboard ───────────────────────────────── */}
      <div className="dessly-stats-grid">
        <Motion.div className="dessly-glass-card dessly-stat-card stat-accent-blue" whileHover={{ scale: 1.02 }}>
          <div className="stat-glow"></div>
          <div className="stat-icon-wrap blue"><Wallet size={22} /></div>
          <p className="stat-label">Merchant Balance</p>
          <h2 className="balance-amount">{balance} <span className="balance-currency">USDT</span></h2>
          <div className="stat-note success">
            <TrendingUp size={13} />
            <span>Operational Pool</span>
          </div>
        </Motion.div>

        <Motion.div className="dessly-glass-card dessly-stat-card" whileHover={{ scale: 1.02 }}>
          <div className="stat-icon-wrap green"><ArrowRightLeft size={22} /></div>
          <p className="stat-label">Exchange Rates (Steam)</p>
          <div className="rates-grid">
            {ratesLoading ? (
              <div className="rates-loading"><RefreshCw size={16} className="sync-anim" /> Loading...</div>
            ) : (
              Object.entries(exchangeRates).filter(([, v]) => v).map(([cur, rate]) => (
                <div key={cur} className="rate-chip">
                  <span className="rate-cur">{cur}</span>
                  <span className="rate-val">{rate}</span>
                </div>
              ))
            )}
          </div>
        </Motion.div>

        <Motion.div className="dessly-glass-card dessly-stat-card" whileHover={{ scale: 1.02 }}>
          <div className="stat-icon-wrap purple"><Zap size={22} /></div>
          <p className="stat-label">Services Active</p>
          <h2 className="stat-big-number">{tabs.length - 1}</h2>
          <div className="stat-note">
            <span>Steam • Gift • Mobile • Voucher</span>
          </div>
        </Motion.div>
      </div>

      {/* ── Navigation Tabs ───────────────────────────────── */}
      <div className="dessly-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`dessly-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ───────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <Motion.div key={activeTab} {...fadeUp}>

          {/* ════ STEAM TOP-UP ════ */}
          {activeTab === 'steam' && (
            <div className="dessly-glass-card">
              <div className="section-header-row">
                <div>
                  <h3 className="section-title">
                    <img src="https://www.vectorlogo.zone/logos/steampowered/steampowered-icon.svg" width="22" alt="Steam" />
                    Steam Wallet Refill
                  </h3>
                  <p className="section-subtitle">Direct API pipeline for Steam wallet top-ups</p>
                </div>
              </div>

              <div className="steam-layout">
                <div className="steam-form">
                  <div className="dessly-input-group">
                    <label>Steam Login</label>
                    <input className="dessly-input" placeholder="e.g., gamer_2024"
                      value={steamUser} onChange={(e) => { setSteamUser(e.target.value); setCanRefill(null); }} />
                  </div>
                  <div className="steam-amount-row">
                    <div className="dessly-input-group" style={{ flex: 1 }}>
                      <label>Amount</label>
                      <input className="dessly-input" type="number" placeholder="100 – 100,000"
                        value={steamAmount} onChange={(e) => { setSteamAmount(e.target.value); setCanRefill(null); }} />
                    </div>
                    <div className="dessly-input-group" style={{ width: '120px' }}>
                      <label>Currency</label>
                      <select className="dessly-input" value={steamCurrency} onChange={(e) => setSteamCurrency(e.target.value)}>
                        <option value="RUB">RUB ₽</option>
                        <option value="KZT">KZT ₸</option>
                        <option value="TRY">TRY ₺</option>
                        <option value="UAH">UAH ₴</option>
                      </select>
                    </div>
                  </div>

                  {steamAmount && exchangeRates[steamCurrency] && (
                    <div className="conversion-preview">
                      <ArrowRightLeft size={14} />
                      <span>≈ {(Number(steamAmount) / (Number(exchangeRates[steamCurrency]) || 1)).toFixed(2)} USDT</span>
                    </div>
                  )}

                  <div className="steam-actions">
                    <button className="btn-dessly-primary"
                      onClick={handleSteamCheck}
                      disabled={steamCheckLoading || !steamUser || !steamAmount}>
                      {steamCheckLoading ? <RefreshCw size={16} className="sync-anim" /> : <Search size={16} />}
                      Validate Account
                    </button>
                    {canRefill && (
                      <Motion.button className="btn-dessly-primary btn-success"
                        onClick={handleSteamTopup} disabled={loading}
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        {loading ? <RefreshCw size={16} className="sync-anim" /> : <CheckCircle2 size={16} />}
                        Execute Payment
                      </Motion.button>
                    )}
                  </div>
                </div>

                <div className="steam-info-panel">
                  <h4 className="info-title"><Zap size={16} /> Validation Pipeline</h4>
                  <ul className="info-checklist">
                    <li><CheckCircle2 size={14} className="check-icon" /> Real-time login verification</li>
                    <li><CheckCircle2 size={14} className="check-icon" /> Regional compatibility check</li>
                    <li><CheckCircle2 size={14} className="check-icon" /> Anti-fraud screening</li>
                    <li><CheckCircle2 size={14} className="check-icon" /> Instant balance deduction</li>
                  </ul>
                  <div className="info-note">
                    <AlertCircle size={14} />
                    <span>Min: 10, Max: 100,000 per transaction</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ STEAM GIFT ════ */}
          {activeTab === 'gift' && (
            <div className="dessly-glass-card">
              <div className="section-header-row">
                <div>
                  <h3 className="section-title"><Gift size={20} /> Steam Gift Service</h3>
                  <p className="section-subtitle">Send games directly to any Steam user</p>
                </div>
                <div className="voucher-search-wrap">
                  <Search className="search-icon-abs" size={16} />
                  <input className="dessly-input dessly-search-input" placeholder="Search games..."
                    value={giftSearch} onChange={(e) => setGiftSearch(e.target.value)} />
                </div>
              </div>

              {selectedGame && (
                <Motion.div className="gift-confirm-panel" {...fadeUp}>
                  <div className="gift-confirm-info">
                    <img src={selectedGame.image || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300'} alt="" className="gift-game-img" />
                    <div>
                      <h4>{selectedGame.name}</h4>
                      <p className="gift-price">{selectedGame.price || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="dessly-input-group">
                    <label>Recipient Steam ID / Profile URL</label>
                    <input className="dessly-input" placeholder="76561198xxxxxxxxx"
                      value={giftSteamId} onChange={(e) => setGiftSteamId(e.target.value)} />
                  </div>
                  <div className="gift-actions">
                    <button className="btn-dessly-outline" onClick={() => setSelectedGame(null)}>Отмена</button>
                    <button className="btn-dessly-primary btn-success" onClick={handleSendGift}
                      disabled={loading || !giftSteamId}>
                      {loading ? <RefreshCw size={16} className="sync-anim" /> : <Gift size={16} />}
                      Send Gift
                    </button>
                  </div>
                </Motion.div>
              )}

              {loading && !selectedGame ? (
                <div className="dessly-loading"><RefreshCw className="sync-anim" size={40} /></div>
              ) : (
                <div className="voucher-grid">
                  {filteredGifts.length > 0 ? filteredGifts.map(game => (
                    <Motion.div key={game.id} className="dessly-glass-card voucher-card" whileHover={{ y: -4 }}>
                      <img src={game.image || 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=300'} alt={game.name} className="voucher-img" />
                      <h4 className="voucher-name">{game.name}</h4>
                      <div className="voucher-footer">
                        <span className="voucher-price">{game.price || 'N/A'}</span>
                        <button className="btn-voucher-select" onClick={() => setSelectedGame(game)}>
                          <Gift size={14} /> Gift <ChevronRight size={14} />
                        </button>
                      </div>
                    </Motion.div>
                  )) : (
                    <div className="dessly-empty">
                      {giftCatalog.length === 0 ? 'Каталог загружается или недоступен' : 'Ничего не найдено'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════ MOBILE REFILL ════ */}
          {activeTab === 'mobile' && (
            <div className="dessly-glass-card">
              <div className="section-header-row">
                <div>
                  <h3 className="section-title"><Smartphone size={20} /> Mobile Refill</h3>
                  <p className="section-subtitle">Top-up mobile phones worldwide</p>
                </div>
              </div>

              <div className="mobile-layout">
                <div className="mobile-form">
                  <div className="dessly-input-group">
                    <label>Phone Number</label>
                    <input className="dessly-input" type="tel" placeholder="+7 (999) 123-45-67"
                      value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} />
                  </div>
                  <div className="dessly-input-group">
                    <label>Operator</label>
                    <select className="dessly-input" value={selectedOperator} onChange={(e) => setSelectedOperator(e.target.value)}>
                      <option value="">— Select Operator —</option>
                      {operators.map(op => (
                        <option key={op.id} value={op.id}>{op.name} ({op.country || 'Global'})</option>
                      ))}
                      {operators.length === 0 && (
                        <>
                          <option value="megafon">МегаФон (RU)</option>
                          <option value="mts">МТС (RU)</option>
                          <option value="beeline">Билайн (RU)</option>
                          <option value="tele2">Tele2 (RU)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="dessly-input-group">
                    <label>Amount (RUB)</label>
                    <input className="dessly-input" type="number" placeholder="100 – 15,000"
                      value={mobileAmount} onChange={(e) => setMobileAmount(e.target.value)} />
                  </div>

                  <button className="btn-dessly-primary"
                    onClick={handleMobileRefill}
                    disabled={loading || !mobilePhone || !mobileAmount || !selectedOperator}>
                    {loading ? <RefreshCw size={16} className="sync-anim" /> : <Smartphone size={16} />}
                    Execute Refill
                  </button>
                </div>

                <div className="mobile-info-panel">
                  <h4 className="info-title"><Zap size={16} /> Supported Regions</h4>
                  <div className="region-tags">
                    {['🇷🇺 Russia', '🇰🇿 Kazakhstan', '🇹🇷 Turkey', '🇺🇦 Ukraine', '🇧🇾 Belarus'].map(r => (
                      <span key={r} className="region-tag">{r}</span>
                    ))}
                  </div>
                  <div className="info-note">
                    <AlertCircle size={14} />
                    <span>Processing: 5–30 seconds. Status updates in Audit Logs.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ VOUCHER HUB ════ */}
          {activeTab === 'vouchers' && (
            <div className="dessly-glass-card">
              <div className="section-header-row">
                <div>
                  <h3 className="section-title"><Ticket size={20} /> Voucher Catalog</h3>
                  <p className="section-subtitle">Digital vouchers & gift cards</p>
                </div>
                <div className="voucher-search-wrap">
                  <Search className="search-icon-abs" size={16} />
                  <input className="dessly-input dessly-search-input" placeholder="Search vouchers..."
                    value={voucherSearch} onChange={(e) => setVoucherSearch(e.target.value)} />
                </div>
              </div>

              {loading ? (
                <div className="dessly-loading"><RefreshCw className="sync-anim" size={40} /></div>
              ) : (
                <div className="voucher-grid">
                  {filteredVouchers.map(v => (
                    <Motion.div key={v.id} className="dessly-glass-card voucher-card" whileHover={{ y: -4 }}>
                      <img src={v.image || 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=300'} alt={v.name} className="voucher-img" />
                      <h4 className="voucher-name">{v.name}</h4>
                      <p className="voucher-desc">{v.description}</p>
                      <div className="voucher-footer">
                        <span className="voucher-price">{v.price}</span>
                        <button className="btn-voucher-select" onClick={() => { setSelectedVoucher(v); setIsVoucherModalOpen(true); setSelectedVariant(''); }}>
                          Select <ChevronRight size={14} />
                        </button>
                      </div>
                    </Motion.div>
                  ))}
                  {filteredVouchers.length === 0 && <div className="dessly-empty">Ничего не найдено</div>}
                </div>
              )}
            </div>
          )}

          {/* ════ AUDIT LOGS ════ */}
          {activeTab === 'history' && (
            <div className="dessly-glass-card">
              <div className="section-header-row">
                <div>
                  <h3 className="section-title"><History size={20} /> Transaction Audit</h3>
                  <p className="section-subtitle">Cross-verified records • {transactions.length} entries</p>
                </div>
                <div className="audit-controls">
                  <select className="dessly-input dessly-filter-select" value={txFilter} onChange={(e) => setTxFilter(e.target.value)}>
                    <option value="all">All Services</option>
                    <option value="steam">Steam Only</option>
                    <option value="voucher">Vouchers</option>
                    <option value="mobile">Mobile</option>
                    <option value="success">✓ Success</option>
                    <option value="pending">⏳ Pending</option>
                  </select>
                  <button className="btn-dessly-outline" onClick={handleSyncTransactions} disabled={isSyncingTxs}>
                    <RefreshCw size={14} className={isSyncingTxs ? 'sync-anim' : ''} />
                    {isSyncingTxs ? 'Syncing...' : 'Force Sync'}
                  </button>
                </div>
              </div>

              <div className="dessly-table-wrap">
                <table className="dessly-table">
                  <thead>
                    <tr>
                      <th>TX ID</th>
                      <th>Service</th>
                      <th>Amount</th>
                      <th>Entity</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxs.length === 0 ? (
                      <tr><td colSpan="6" className="dessly-empty">No transactions match filter</td></tr>
                    ) : filteredTxs.map((tx, i) => (
                      <tr key={tx.id || i}>
                        <td>
                          <span className="cell-mono tx-id-cell" onClick={() => copyToClipboard(tx.transaction_uuid || tx.id)}>
                            {(tx.transaction_uuid || tx.id || '').toString().slice(0, 10)}…
                            <Copy size={10} className="copy-hint" />
                          </span>
                        </td>
                        <td><span className={`service-pill ${(tx.service_type || '').toLowerCase()}`}>{tx.service_type || 'Refill'}</span></td>
                        <td className="cell-amount">{tx.amount} {tx.currency}</td>
                        <td className="cell-mono">{tx.username || tx.receiver || '—'}</td>
                        <td>
                          <span className={`status-badge ${tx.status === 'success' ? 'status-success' : tx.status === 'error' ? 'status-error' : 'status-pending'}`}>
                            {tx.status?.toUpperCase() || 'N/A'}
                          </span>
                        </td>
                        <td className="cell-dim">{tx.created_at ? new Date(tx.created_at).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </Motion.div>
      </AnimatePresence>

      {/* ── Voucher Purchase Modal ──────────────────────────── */}
      <AnimatePresence>
        {isVoucherModalOpen && selectedVoucher && (
          <div className="modal-overlay" onClick={() => setIsVoucherModalOpen(false)}>
            <Motion.div className="dessly-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}>
              <div className="modal-header">
                <h3 className="modal-title">{selectedVoucher.name}</h3>
                <button onClick={() => setIsVoucherModalOpen(false)} className="modal-close-btn"><X size={18} /></button>
              </div>
              <div className="modal-body">
                <img src={selectedVoucher.image} alt="" className="modal-product-img" />
                <p className="modal-description">{selectedVoucher.description}</p>
                <div className="dessly-input-group">
                  <label>Select Denomination</label>
                  <select className="dessly-input" value={selectedVariant} onChange={(e) => setSelectedVariant(e.target.value)}>
                    <option value="">— Choose —</option>
                    {selectedVoucher.variants?.map((v, idx) => (
                      <option key={`${v.id}-${idx}`} value={v.id}>{v.name} — {v.price} {v.currency}</option>
                    )) || <option value="default">Base — {selectedVoucher.price}</option>}
                  </select>
                </div>
                <div className="dessly-notice">
                  <div className="notice-icon"><ExternalLink size={18} /></div>
                  <p>Results appear instantly in Audit Logs and the merchant dashboard.</p>
                </div>
                <div className="modal-actions">
                  <button className="btn-dessly-outline" onClick={() => setIsVoucherModalOpen(false)}>Cancel</button>
                  <button className="btn-dessly-primary" onClick={confirmVoucherPurchase}
                    disabled={loading || (selectedVoucher.variants?.length > 0 && !selectedVariant)}>
                    {loading ? <RefreshCw size={16} className="sync-anim" /> : <Wallet size={16} />}
                    Complete Purchase
                  </button>
                </div>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DesslyHub;
