import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { 
  Activity, Users, MousePointer2, MessageSquare, 
  RefreshCcw, Filter, Globe, Bot, AlertCircle 
} from 'lucide-react';
import { supabase } from '../../utils/supabase';
import './Monitoring.css';

const Monitoring = () => {
  const [loading, setLoading] = useState(true);
  const [siteData, setSiteData] = useState([]);
  const [botData, setBotData] = useState([]);
  const [stats, setStats] = useState({
    todayViews: 0,
    activeSessions: 0,
    botMessages: 0,
    errorRate: 0
  });
  const [filter, setFilter] = useState('all'); // all, bazzar-market, bazzar-app

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Analytics (Views)
      const { data: views } = await supabase
        .from('analytics_views')
        .select('*')
        .order('created_at', { ascending: true });

      // 2. Fetch Bot Activity (Support Messages)
      const { data: messages } = await supabase
        .from('support_messages')
        .select('created_at, sender_type')
        .order('created_at', { ascending: true });

      processAnalytics(views, messages);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (views = [], messages = []) => {
    // Process Views for AreaChart
    const viewsByDay = {};
    const today = new Date().toISOString().split('T')[0];
    let todayCount = 0;

    views.forEach(v => {
      const date = v.created_at.split('T')[0];
      if (filter !== 'all' && v.project_name !== filter) return;
      
      viewsByDay[date] = (viewsByDay[date] || 0) + 1;
      if (date === today) todayCount++;
    });

    const chartData = Object.keys(viewsByDay).map(date => ({
      date,
      views: viewsByDay[date]
    })).slice(-14); // Last 14 days

    // Process Bot Messages for BarChart
    const botByDay = {};
    messages.forEach(m => {
      const date = m.created_at.split('T')[0];
      botByDay[date] = (botByDay[date] || 0) + 1;
    });

    const botChartData = Object.keys(botByDay).map(date => ({
      date,
      messages: botByDay[date]
    })).slice(-14);

    setSiteData(chartData);
    setBotData(botChartData);
    setStats({
      todayViews: todayCount,
      activeSessions: new Set(messages.map(m => m.session_id)).size, // Mockish
      botMessages: messages.filter(m => m.sender_type === 'ai').length,
      errorRate: 0.2 // Placeholder
    });
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  return (
    <div className="monitoring-page">
      {/* Filters & Header */}
      <div className="monitoring-header">
        <div className="monitoring-title">
          <Activity className="text-gradient" size={24} />
          <h1>Системный мониторинг</h1>
        </div>
        <div className="monitoring-actions">
          <div className="filter-group">
            <Filter size={16} />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Все проекты</option>
              <option value="bazzar-market">BAZZAR Market</option>
              <option value="bazzar-app">BAZZAR App</option>
              <option value="staff-portal">Staff Portal</option>
            </select>
          </div>
          <button className="btn-refresh" onClick={fetchData} disabled={loading}>
            <RefreshCcw className={loading ? 'spinning' : ''} size={18} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon views"><MousePointer2 size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Просмотры (сегодня)</span>
            <span className="stat-value">{stats.todayViews}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bot"><Bot size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Ответы AI Бота</span>
            <span className="stat-value">{stats.botMessages}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon sessions"><Users size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Всего сессий чата</span>
            <span className="stat-value">{stats.activeSessions}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon errors"><AlertCircle size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Ошибки системы</span>
            <span className="stat-value">{stats.errorRate}%</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-container">
          <div className="chart-header">
            <h3>Посещаемость сайтов</h3>
            <Globe size={16} />
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={siteData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#8b5cf6' }}
                />
                <Area type="monotone" dataKey="views" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>Нагрузка на саппорт-бота</h3>
            <MessageSquare size={16} />
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={botData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#ec4899' }}
                />
                <Bar dataKey="messages" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
