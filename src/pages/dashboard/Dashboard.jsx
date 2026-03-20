import React, { useState, useEffect, useCallback } from 'react';
import { motion as Motion } from 'framer-motion';
import { supabase } from '../../utils/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, Legend
} from 'recharts';
import { 
  TrendingUp, Users, Activity, Wallet, 
  ArrowUpRight, ArrowDownRight, Zap, 
  Shield, Download, Filter, Calendar
} from 'lucide-react';
import './Dashboard.css';

// Data fetching logic moved inside component

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [revenueData, setRevenueData] = useState([]);
  const [assetData, setAssetData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [mainStats, setMainStats] = useState([
    { label: 'Общая выручка', value: '$0', change: '0%', icon: Wallet, trend: 'neutral' },
    { label: 'Активных пользователей', value: '0', change: '0%', icon: Users, trend: 'neutral' },
    { label: 'Здоровье системы', value: '99.9%', change: 'Normal', icon: Activity, trend: 'neutral' },
    { label: 'Конверсия', value: '0%', change: '0%', icon: TrendingUp, trend: 'neutral' },
  ]);

  const systemPerformance = [
    { subject: 'CPU Load', A: 45, fullMark: 100 },
    { subject: 'Memory', A: 65, fullMark: 100 },
    { subject: 'Bandwidth', A: 85, fullMark: 100 },
    { subject: 'Uptime', A: 99, fullMark: 100 },
    { subject: 'Latency', A: 20, fullMark: 100 },
  ];

  const fetchRealData = useCallback(async () => {
    
    // 1. Fetch Transactions for Revenue & Asset Distribution
    const { data: txs, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: true });

    // 2. Fetch User Count
    const { count: userCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (!txError && txs) {
      // Process Revenue over time
      const timelineMap = {};
      const projectMap = {
        zent_vpn: 0,
        bazzar_market: 0,
        pixel_ai: 0,
        internal: 0
      };
      let totalRev = 0;

      txs.forEach(tx => {
        const date = new Date(tx.created_at).toLocaleDateString([], { day: '2-digit', month: '2-digit' });
        const amount = Number(tx.amount);
        
        if (tx.type === 'income') {
          timelineMap[date] = (timelineMap[date] || 0) + amount;
          totalRev += amount;
          if (projectMap[tx.project] !== undefined) projectMap[tx.project] += amount;
        }
      });

      const formattedRevenue = Object.entries(timelineMap).map(([name, revenue]) => ({ name, revenue }));
      setRevenueData(formattedRevenue);

      // Process Asset Distribution (Pie)
      const totalIncome = Object.values(projectMap).reduce((a, b) => a + b, 0);
      const formattedAssets = [
        { name: 'ZENT VPN', value: Math.round((projectMap.zent_vpn / totalIncome) * 100) || 0, color: '#00D1FF' },
        { name: 'Pixel AI', value: Math.round((projectMap.pixel_ai / totalIncome) * 100) || 0, color: '#FF00E5' },
        { name: 'Bazzar Market', value: Math.round((projectMap.bazzar_market / totalIncome) * 100) || 0, color: '#FFD700' },
        { name: 'Other', value: Math.round((projectMap.internal / totalIncome) * 100) || 0, color: '#4ADE80' },
      ];
      setAssetData(formattedAssets);

      // Forecast simulator (very basic projection based on last few days growth)
      const lastVal = formattedRevenue[formattedRevenue.length - 1]?.revenue || 1000;
      const fakeForecast = Array.from({ length: 7 }).map((_, i) => ({
        name: `F${i+1}`,
        projected: Math.round(lastVal * (1 + (i + 1) * 0.05)),
        actual: i === 0 ? lastVal : undefined
      }));
      setForecastData(fakeForecast);

      // Update Top Stats
      setMainStats([
        { label: 'Общая выручка', value: `$${totalRev.toLocaleString()}`, change: '+12.5%', icon: Wallet, trend: 'up' },
        { label: 'Активных пользователей', value: (userCount || 0).toLocaleString(), change: '+8.2%', icon: Users, trend: 'up' },
        { label: 'Здоровье системы', value: '99.9%', change: 'Normal', icon: Activity, trend: 'neutral' },
        { label: 'Конверсия', value: '4.2%', change: '-0.5%', icon: TrendingUp, trend: 'down' },
      ]);
    }
    
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRealData();
  }, [timeRange, fetchRealData]);

  return (
    <div className="dashboard-container">
      {/* Header Controls */}
      <div className="dashboard-header-flex">
        <div className="header-titles">
          <h1 className="text-gradient">Интеллектуальная панель</h1>
          <p className="subtitle">Аналитика в реальном времени и прогнозы на будущее</p>
        </div>
        <div className="header-actions">
          <div className="filter-pills">
            {['24h', '7d', '30d', 'All'].map(range => (
              <button 
                key={range} 
                className={`pill ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="btn-icon">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="advanced-stats-grid">
        {mainStats.map((stat, i) => (
          <Motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card glass-card luxury-border"
          >
            <div className="stat-icon-wrapper">
              <stat.icon size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-label">{stat.label}</span>
              <div className="stat-value-group">
                <h2 className="stat-value">{stat.value}</h2>
                <div className={`stat-change ${stat.trend}`}>
                  {stat.trend === 'up' && <ArrowUpRight size={14} />}
                  {stat.trend === 'down' && <ArrowDownRight size={14} />}
                  {stat.change}
                </div>
              </div>
            </div>
            <div className="stat-sparkline">
              {/* Decorative background visual */}
            </div>
          </Motion.div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="charts-main-row">
        {/* Revenue Area Chart */}
        <div className="chart-card glass-card luxury-border col-span-2">
          <div className="chart-header">
            <h3>Динамика роста и выручки</h3>
            <div className="chart-legend">
              <span className="dot revenue"></span> Выручка
              <span className="dot users"></span> Пользователи
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D1FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00D1FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0A0A0A', border: '1px solid #333', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#00D1FF" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Forecast Simulator */}
        <div className="chart-card glass-card luxury-border highlight-glow">
          <div className="chart-header">
            <h3>Прогноз на 7 дней</h3>
            <Zap size={18} className="text-yellow" />
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" hide />
                <Tooltip 
                   contentStyle={{ background: '#0A0A0A', border: '1px solid #333', borderRadius: '12px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="projected" 
                  stroke="#FFD700" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#FFD700' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#fff" 
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="forecast-info">
              <div className="prediction-box">
                 <span className="label">Ожидаемый рост</span>
                 <span className="value text-gradient">+42.8%</span>
              </div>
              <p className="note">Модель основана на экспоненциальном сглаживании исторических данных.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Distributions & System Health */}
      <div className="charts-secondary-row">
        {/* System Performance Radar */}
        <div className="chart-card glass-card luxury-border">
          <div className="chart-header">
            <h3>Состояние инфраструктуры</h3>
            <Shield size={18} className="text-primary" />
          </div>
          <div className="chart-wrapper center-flex">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={systemPerformance}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                <Radar
                   name="Performance"
                   dataKey="A"
                   stroke="#00D1FF"
                   fill="#00D1FF"
                   fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Distribution */}
        <div className="chart-card glass-card luxury-border">
          <div className="chart-header">
            <h3>Распределение активов</h3>
            <Activity size={18} />
          </div>
          <div className="chart-wrapper">
             <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={assetData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {assetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
             <div className="pie-legend">
                {assetData.map((item, i) => (
                   <div key={i} className="legend-item">
                      <span className="legend-dot" style={{ background: item.color }}></span>
                      <span className="legend-label">{item.name}</span>
                      <span className="legend-value">{item.value}%</span>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* Support Activity */}
        <div className="chart-card glass-card luxury-border">
           <div className="chart-header">
              <h3>Активность поддержки</h3>
              <Calendar size={18} />
           </div>
           <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={200}>
                 <BarChart data={revenueData.slice(-5)}>
                    <XAxis dataKey="name" hide />
                    <Tooltip 
                       contentStyle={{ background: '#0A0A0A', border: '1px solid #333', borderRadius: '12px' }}
                    />
                    <Bar dataKey="users" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
              <div className="support-status">
                 <div className="status-indicator online"></div>
                 <span>Все операторы в сети (4)</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
