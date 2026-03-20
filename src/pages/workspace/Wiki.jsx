import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  ChevronRight, 
  FileText, 
  Clock, 
  User,
  Shield,
  Apple,
  Terminal,
  Info
} from 'lucide-react';
import './Wiki.css';

const Wiki = () => {
  const [selectedArticle, setSelectedArticle] = useState('vpn-nodes');

  const categories = [
    {
      id: 'tech',
      icon: Terminal,
      title: 'Технические инструкции',
      articles: [
        { id: 'vpn-nodes', title: 'Как развернуть новый VPN-узел' },
        { id: 'dns-config', title: 'Глобальная конфигурация DNS' },
        { id: 'db-backups', title: 'График бэкапов базы данных' },
      ]
    },
    {
      id: 'market',
      icon: Apple,
      title: 'Bazzar Market FAQ',
      articles: [
        { id: 'apple-unlock', title: 'Разблокировка Apple ID' },
        { id: 'cert-signing', title: 'Ручная подпись сертификатов' },
        { id: 'dispute-rules', title: 'Правила разрешения споров' },
      ]
    },
    {
      id: 'staff',
      icon: Info,
      title: 'Общая информация',
      articles: [
        { id: 'onboarding', title: 'Онбординг сотрудников' },
        { id: 'safety', title: 'Безопасность и 2FA' },
      ]
    }
  ];

  return (
    <div className="wiki-container">
      <div className="wiki-sidebar section-card">
        <div className="search-container mini">
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Поиск по базе знаний..." className="search-input" />
        </div>
        
        <nav className="wiki-nav">
          {categories.map(cat => (
            <div key={cat.id} className="wiki-group">
              <div className="wiki-group-header">
                <cat.icon size={16} />
                <span>{cat.title}</span>
              </div>
              <ul className="wiki-article-list">
                {cat.articles.map(art => (
                  <li key={art.id}>
                    <button 
                      className={`wiki-article-btn ${selectedArticle === art.id ? 'active' : ''}`}
                      onClick={() => setSelectedArticle(art.id)}
                    >
                      <FileText size={14} />
                      <span>{art.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="wiki-content section-card">
        <article className="wiki-article">
          <header className="article-header">
            <h1 className="article-title text-gradient">Как развернуть новый VPN-узел</h1>
            <div className="article-meta">
              <span className="meta-item"><User size={14} /> Обновлено: Admin</span>
              <span className="meta-item"><Clock size={14} /> 2 дня назад</span>
              <span className="meta-item"><Shield size={14} /> Конфиденциально</span>
            </div>
          </header>

          <div className="article-body">
            <p className="lead">Следуйте этим шагам для инициализации и подключения нового узла сервера к инфраструктуре ZENT VPN.</p>
            
            <h2>1. Требования к серверу</h2>
            <ul>
              <li>ОС: Ubuntu 22.04 LTS (Обязательно)</li>
              <li>ОЗУ: 2ГБ (Минимум), 4ГБ (Рекомендуется)</li>
              <li>Сеть: 1Гбит Аплинк</li>
            </ul>

            <div className="code-block">
              <div className="code-header">bash</div>
              <pre><code>{`# Первичное обновление системы
apt update && apt upgrade -y

# Установка основных зависимостей
apt install curl wget git -y`}</code></pre>
            </div>

            <h2>2. Скрипт установки</h2>
            <p>Мы используем кастомный скрипт автоматизации для одновременной установки AmneziaWG и сервисов Xray.</p>
            
            <div className="alert-box warning">
              <AlertCircle size={18} />
              <div>
                <strong>Внимание:</strong> Убедитесь, что на сервере нет существующих правил брандмауэра, блокирующих порты 443 или 51820.
              </div>
            </div>

            <div className="code-block">
              <div className="code-header">bash</div>
              <pre><code>{`curl -fsSL https://scripts.bazzar.io/vpn-init.sh | bash`}</code></pre>
            </div>

            <h2>3. Интеграция</h2>
            <p>После установки скопируйте токен узла и добавьте его в раздел <strong>ZENT VPN &rarr; Узлы</strong> в Стафф Портале.</p>
          </div>
        </article>
      </div>
    </div>
  );
};

// Simple Alert replacement
const AlertCircle = ({ size }) => <Info size={size} />;

export default Wiki;
