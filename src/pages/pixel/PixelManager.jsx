import React, { useState } from 'react';
import { 
  Sparkles, 
  DollarSign, 
  BarChart3, 
  MessageSquare, 
  Send,
  Zap,
  TrendingUp,
  History,
  Search
} from 'lucide-react';
import { sendPachkaNotification, CHANNELS } from '../../utils/pachka';
import './PixelManager.css';

const PixelManager = () => {
  const [activeTab, setActiveTab] = useState('analytics');

  const handleBroadcast = (e) => {
    e.preventDefault();
    sendPachkaNotification(CHANNELS.FINANCE, "💸 ФИНАНСОВЫЙ АЛЕРТ: Оформлена новая премиум-подписка ($49.99). Дневная выручка выросла!");
    alert("Алерт о выручке отправлен в финансовый канал!");
  };

  const stats = [
    { label: 'Расход API (день)', value: '$124.50', trend: '+5.2%', icon: DollarSign },
    { label: 'Генерации', value: '18,429', trend: '+12.4%', icon: Sparkles },
    { label: 'Успешность (Rate)', value: '99.8%', trend: '0.0%', icon: Zap },
  ];

  const logs = [
    { id: 1, user: '@kris_art', type: 'Image', model: 'SDXL', cost: '$0.02', time: '2m ago' },
    { id: 2, user: '@dev_mike', type: 'Video', model: 'Runway Gen-2', cost: '$0.45', time: '5m ago' },
    { id: 3, user: '@alice_w', type: 'Audio', model: 'ElevenLabs', cost: '$0.08', time: '12m ago' },
    { id: 4, user: '@brian_v', type: 'Image', model: 'Midjourney v6', cost: '$0.05', time: '15m ago' },
  ];

  const pricingModels = [
    { name: 'Image (Standard)', cost: 1, model: 'Stable Diffusion XL' },
    { name: 'Image (Premium)', cost: 5, model: 'Midjourney v6' },
    { name: 'Video (per sec)', cost: 10, model: 'Runway Gen-2' },
    { name: 'Audio (per 1k chars)', cost: 3, model: 'ElevenLabs' },
  ];

  return (
    <div className="pixel-manager">
      {/* Page Header */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-header">
              <stat.icon size={20} className="stat-icon" />
              <span className="stat-label">{stat.label}</span>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className={`stat-footer ${stat.trend.startsWith('+') ? 'success' : ''}`}>
              {stat.trend} со вчера
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} />
          Аналитика и логи
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          <DollarSign size={18} />
          Тарифы токенов
        </button>
        <button 
          className={`tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`}
          onClick={() => setActiveTab('broadcast')}
        >
          <MessageSquare size={18} />
          Инструмент рассылки
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'analytics' && (
          <section className="section-card">
            <div className="section-header">
              <div className="section-title">
                <History size={18} />
                <h3>Последние генерации</h3>
              </div>
              <button className="btn-small">Экспорт CSV</button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Тип</th>
                    <th>Модель</th>
                    <th>Стоимость</th>
                    <th>Время</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td className="font-medium">{log.user}</td>
                      <td><span className={`type-tag ${log.type.toLowerCase()}`}>{log.type}</span></td>
                      <td><span className="model-tag">{log.model}</span></td>
                      <td>{log.cost}</td>
                      <td className="text-dim">{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'pricing' && (
          <section className="section-card">
            <div className="section-header">
              <div className="section-title">
                <TrendingUp size={18} />
                <h3>Стоимость токенов</h3>
              </div>
              <p className="section-subtitle">Настройте количество токенов, списываемых за генерацию</p>
            </div>
            <div className="pricing-grid">
              {pricingModels.map((model, i) => (
                <div key={i} className="pricing-item">
                  <div className="pricing-info">
                    <span className="pricing-name">{model.name}</span>
                    <span className="pricing-model">{model.model}</span>
                  </div>
                  <div className="pricing-control">
                    <input type="number" defaultValue={model.cost} className="price-input" />
                    <span className="token-label">токенов</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="section-footer">
              <button type="submit" className="btn-primary" onClick={handleBroadcast}>Запустить рассылку</button>
            </div>
          </section>
        )}

        {activeTab === 'broadcast' && (
          <section className="section-card">
            <div className="section-header">
              <div className="section-title">
                <Send size={18} />
                <h3>Массовая рассылка</h3>
              </div>
            </div>
            <div className="broadcast-form">
              <div className="form-group">
                <label>Целевая аудитория</label>
                <select className="form-select">
                  <option>Все пользователи (12,402)</option>
                  <option>Pro Подписчики (1,200)</option>
                  <option>Неактивные (3,400)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Контент сообщения (Поддержка Markdown)</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Привет, художники! Мы только что добавили поддержку Midjourney v6..."
                  rows={6}
                ></textarea>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" />
                  <span>Отправить как закрепленное уведомление</span>
                </label>
              </div>
              <button className="btn-primary flex-center gap-2">
                <Send size={18} />
                Запустить кампанию
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PixelManager;
