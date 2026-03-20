import React, { useState } from 'react';
import { Shield, Activity, Users, Globe, Terminal, Search, XCircle, Bell } from 'lucide-react';
import { sendPachkaNotification, CHANNELS } from '../../utils/pachka';
import './ServerMonitor.css';

const ServerMonitor = () => {
  const [nodes] = useState([
    { id: 1, name: 'Germany #1', status: 'online', load: 45, users: 124, city: 'Frankfurt' },
    { id: 2, name: 'Germany #2', status: 'online', load: 82, users: 210, city: 'Frankfurt' },
    { id: 3, name: 'USA East', status: 'online', load: 12, users: 45, city: 'New York' },
    { id: 4, name: 'Finland', status: 'offline', load: 0, users: 0, city: 'Helsinki' },
  ]);

  const triggerAlert = async () => {
    const overloadedNode = nodes.find(n => n.load > 80);
    if (overloadedNode) {
      await sendPachkaNotification(CHANNELS.TECH, `⚠️ ВЫСОКАЯ НАГРУЗКА: Узел ${overloadedNode.name} почти заполнен: загрузка ${overloadedNode.load}%.`);
    }
    const offlineNode = nodes.find(n => n.status === 'offline');
    if (offlineNode) {
      await sendPachkaNotification(CHANNELS.TECH, `🚨 КРИТИЧЕСКИЙ АЛЕРТ: Узел ${offlineNode.name} НЕ ДОСТУПЕН! Требуется немедленная проверка.`);
      alert("Тестовый алерт отправлен в Пачку!");
    }
  };

  const activeUsers = [
    { id: 'u1', username: 'alex_22', server: 'de-02', duration: '2ч 15м', traffic: '1.2 ГБ' },
    { id: 'u2', username: 'maria_k', server: 'de-01', duration: '45м', traffic: '450 МБ' },
    { id: 'u3', username: 'tech_ninja', server: 'nl-01', duration: '12ч 05м', traffic: '8.4 ГБ' },
  ];

  return (
    <div className="vpn-monitor">
      {/* Stats Overview */}
      {/* ... (already localized in previous step) ... */}

      <div className="monitor-grid">
        {/* Server List */}
        <section className="section-card server-list">
          <div className="section-header">
            <div className="section-title">
              <Shield size={18} />
              <h3>Статус серверов</h3>
            </div>
            <div className="btn-group">
              <button className="btn-small ghost flex-center gap-2" onClick={triggerAlert}>
                <Bell size={14} />
                Тест алерта
              </button>
              <button className="btn-small">Обновить</button>
            </div>
          </div>
          
          <div className="servers-container">
            {nodes.map(server => (
              <div key={server.id} className={`server-item ${server.status}`}>
                <div className="server-info">
                  <div className="server-meta">
                    <span className="server-name">{server.name}</span>
                    <span className="server-type">{server.type === 'online' ? 'В сети' : 'Оффлайн'}</span>
                  </div>
                  <span className={`status-badge ${server.status} ${server.status === 'online' ? 'pulse-animation' : ''}`}>{server.status === 'online' ? 'В сети' : 'Оффлайн'}</span>
                </div>
                <div className="load-bar-container">
                  <div className="load-label">
                    <span>Нагрузка</span>
                    <span>{server.load}%</span>
                  </div>
                  <div className="load-bar">
                    <div 
                      className="load-fill" 
                      style={{ 
                        width: `${server.load}%`,
                        backgroundColor: server.load > 70 ? 'var(--danger)' : server.load > 40 ? 'var(--warning)' : 'var(--success)'
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* User Sessions */}
        <section className="section-card session-list">
          <div className="section-header">
            <div className="section-title">
              <Terminal size={18} />
              <h3>Активные сессии</h3>
            </div>
            <span className="badge">{activeUsers.length} онлайн</span>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Узел</th>
                  <th>Длительность</th>
                  <th>Трафик</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-circle"></div>
                        {user.username}
                      </div>
                    </td>
                    <td><span className="node-tag">{user.server}</span></td>
                    <td>{user.duration}</td>
                    <td>{user.traffic}</td>
                    <td>
                      <button className="action-icon danger" title="Принудительно отключить">
                        <XCircle size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ServerMonitor;
