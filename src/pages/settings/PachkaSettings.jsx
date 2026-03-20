import React, { useState } from 'react';
import { 
  Send, 
  Settings, 
  ShieldCheck, 
  Terminal, 
  DollarSign, 
  Users,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { sendPachkaNotification, CHANNELS } from '../../utils/pachka';
import './PachkaSettings.css';

const PachkaSettings = () => {
  const [webhooks, setWebhooks] = useState({
    tech: localStorage.getItem('pachka_tech_webhook') || '',
    finance: localStorage.getItem('pachka_finance_webhook') || '',
    client: localStorage.getItem('pachka_client_webhook') || '',
  });

  const [testStatus, setTestStatus] = useState({});

  const handleSave = (channel) => {
    localStorage.setItem(`pachka_${channel}_webhook`, webhooks[channel]);
    const channelNames = { tech: 'технического', finance: 'финансового', client: 'клиентского' };
    showToast(`Вебхук для ${channelNames[channel]} канала сохранен`, 'success');
  };

  const handleTest = async (channel) => {
    setTestStatus({ ...testStatus, [channel]: 'sending' });
    const success = await sendPachkaNotification(channel, `🚀 Тестовое уведомление из Staff Portal. Проверка интеграции для канала ${channel}.`);
    setTestStatus({ ...testStatus, [channel]: success ? 'success' : 'error' });
    
    setTimeout(() => {
      setTestStatus(prev => ({ ...prev, [channel]: null }));
    }, 3000);
  };

  const showToast = (msg) => {
    // Simple alert for now, can be replaced with a real toast component
    alert(msg);
  };

  return (
    <div className="pachka-settings">
      <div className="section-card">
        <div className="section-header">
          <div className="section-title">
            <Settings size={20} />
            <h2>Интеграции с мессенджерами (Pachca)</h2>
          </div>
        </div>
        
        <p className="description">
          Настройте исходящие вебхуки для получения уведомлений в реальном времени в каналах вашего корпоративного мессенджера.
        </p>

        <div className="webhook-setup-grid">
          {/* Tech Channel */}
          <div className="webhook-item">
            <div className="webhook-meta">
              <div className="icon-box tech"><Terminal size={20} /></div>
              <div className="webhook-info">
                <h3>Технические алерты</h3>
                <p>Ошибки серверов, высокая нагрузка, сбои API.</p>
              </div>
            </div>
            <div className="webhook-inputs">
              <input 
                type="text" 
                placeholder="https://pachca.com/webhooks/..."
                value={webhooks.tech}
                onChange={(e) => setWebhooks({...webhooks, tech: e.target.value})}
              />
              <div className="btn-group">
                <button className="btn-small" onClick={() => handleSave('tech')}>Сохранить</button>
                <button 
                  className={`btn-small ghost ${testStatus.tech}`} 
                  onClick={() => handleTest('tech')}
                  disabled={testStatus.tech === 'sending'}
                >
                  {testStatus.tech === 'success' ? <CheckCircle2 size={16} /> : <Send size={16} />}
                  Тест
                </button>
              </div>
            </div>
          </div>

          {/* Finance Channel */}
          <div className="webhook-item">
            <div className="webhook-meta">
              <div className="icon-box finance"><DollarSign size={20} /></div>
              <div className="webhook-info">
                <h3>Финансовая лента</h3>
                <p>Новые подписки, платежи, покупка токенов.</p>
              </div>
            </div>
            <div className="webhook-inputs">
              <input 
                type="text" 
                placeholder="https://pachca.com/webhooks/..."
                value={webhooks.finance}
                onChange={(e) => setWebhooks({...webhooks, finance: e.target.value})}
              />
              <div className="btn-group">
                <button className="btn-small" onClick={() => handleSave('finance')}>Сохранить</button>
                <button 
                  className={`btn-small ghost ${testStatus.finance}`} 
                  onClick={() => handleTest('finance')}
                  disabled={testStatus.finance === 'sending'}
                >
                  {testStatus.finance === 'success' ? <CheckCircle2 size={16} /> : <Send size={16} />}
                  Тест
                </button>
              </div>
            </div>
          </div>

          {/* Client Channel */}
          <div className="webhook-item">
            <div className="webhook-meta">
              <div className="icon-box client"><Users size={20} /></div>
              <div className="webhook-info">
                <h3>Активность клиентов</h3>
                <p>Новые споры, отзывы, блокировки аккаунтов.</p>
              </div>
            </div>
            <div className="webhook-inputs">
              <input 
                type="text" 
                placeholder="https://pachca.com/webhooks/..."
                value={webhooks.client}
                onChange={(e) => setWebhooks({...webhooks, client: e.target.value})}
              />
              <div className="btn-group">
                <button className="btn-small" onClick={() => handleSave('client')}>Сохранить</button>
                <button 
                  className={`btn-small ghost ${testStatus.client}`} 
                  onClick={() => handleTest('client')}
                  disabled={testStatus.client === 'sending'}
                >
                  {testStatus.client === 'success' ? <CheckCircle2 size={16} /> : <Send size={16} />}
                  Тест
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="alert-box info mt-6">
          <ShieldCheck size={20} />
          <div>
            <strong>Примечание по безопасности:</strong> URL-адреса вебхуков сохраняются локально в сессии вашего браузера для обеспечения безопасности. В рабочей среде ими следует управлять через защищенную конфигурацию бэкенда.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PachkaSettings;
