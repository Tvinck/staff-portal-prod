import React, { useState } from 'react';
import { 
  Globe, 
  ShoppingBag, 
  LayoutGrid,
  ChevronRight,
  Plus
} from 'lucide-react';
import YandexMarket from './YandexMarket';
import DesslyHub from './DesslyHub';
import './Marketplaces.css';

const Marketplaces = () => {
  const [selectedMarket, setSelectedMarket] = useState(null);

  const availableMarkets = [
    { 
      id: 'dessly', 
      name: 'DesslyHub', 
      desc: 'Steam пополнение, Ваучеры', 
      status: 'active',
      icon: 'DH'
    },
    { 
      id: 'yandex', 
      name: 'Yandex Market', 
      desc: 'Цифровые товары, API партнер', 
      status: 'active',
      icon: 'YM'
    },
    { 
      id: 'digiseller', 
      name: 'Digiseller', 
      desc: 'Автоматизация продаж (в разработке)', 
      status: 'pending',
      icon: 'DS'
    }
  ];

  if (selectedMarket === 'yandex') {
    return (
      <div className="marketplaces-container animated-fade">
        <button className="back-btn" onClick={() => setSelectedMarket(null)}>
          <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
          Назад к списку
        </button>
        <YandexMarket />
      </div>
    );
  }

  if (selectedMarket === 'dessly') {
    return (
      <div className="marketplaces-container animated-fade overflow-hidden">
        <button className="back-btn mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors" onClick={() => setSelectedMarket(null)}>
          <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
          <span>Вернуться к площадкам</span>
        </button>
        <DesslyHub />
      </div>
    );
  }

  return (
    <div className="marketplaces-container animated-fade">
      <div className="page-header">
        <div>
          <h1>Маркетплейсы</h1>
          <p>Интеграции с внешними торговыми площадками</p>
        </div>
        <button className="btn-secondary flex-center gap-2">
          <Plus size={18} />
          Добавить площадку
        </button>
      </div>

      <div className="market-grid">
        {availableMarkets.map(m => (
          <div 
            key={m.id} 
            className={`market-card ${m.status === 'pending' ? 'disabled' : ''}`}
            onClick={() => m.status === 'active' && setSelectedMarket(m.id)}
          >
            <div className="market-card-top">
              <div className={`market-logo ${m.id}`}>{m.icon}</div>
              <span className={`status-pill ${m.status}`}>
                {m.status === 'active' ? 'Подключено' : 'Скоро'}
              </span>
            </div>
            <div className="market-card-body">
              <h3>{m.name}</h3>
              <p>{m.desc}</p>
            </div>
            <div className="market-card-footer">
              <span className="action-text">
                {m.status === 'active' ? 'Управлять' : 'В листе ожидания'}
              </span>
              <ChevronRight size={16} />
            </div>
          </div>
        ))}

        <div className="market-card placeholder">
          <div className="flex-center h-full flex-column gap-3">
            <LayoutGrid size={32} className="text-dim" />
            <p>Другие интеграции</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplaces;
