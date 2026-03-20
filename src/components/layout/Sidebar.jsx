import React from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Sparkles, 
  Store, 
  BookOpen, 
  Trello, 
  Settings, 
  ChevronRight,
  LogOut,
  AppWindow,
  Users,
  Cpu,
  Layers,
  CircleDollarSign,
  Gamepad2,
  Truck,
  Newspaper,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const menuGroups = [
    {
      title: 'Главное',
      items: [
        { path: '/', icon: LayoutDashboard, label: 'Дашборд' },
        { path: '/news', icon: Newspaper, label: 'Новости' },
        { path: '/finance', icon: CircleDollarSign, label: 'Финансы' }
      ]
    },
    {
      title: 'Бизнес-юниты',
      items: [
        { path: '/vpn', icon: ShieldAlert, label: 'ZENT VPN' },
        { path: '/pixel', icon: Sparkles, label: 'Pixel AI Bot' },
      ]
    },
    {
      title: 'Маркетплейсы',
      items: [
        { path: '/marketplaces', icon: Store, label: 'Яндекс Маркет' },
        { path: '/marketplaces/ggsel', icon: Gamepad2, label: 'GGSEL' },
      ]
    },
    {
      title: 'Поставщики',
      items: [
        { path: '/suppliers/desslyhub', icon: Truck, label: 'DesslyHub' },
      ]
    },
    {
      title: 'Ресурсы и Активы',
      items: [
        { path: '/shared-accounts', icon: Users, label: 'Общие аккаунты' },
        { path: '/apple-certs', icon: Cpu, label: 'Apple Сертификаты' },
        { path: '/our-apps', icon: Layers, label: 'Наши приложения' },
      ]
    },
    {
      title: 'Рабочая среда',
      items: [
        { path: '/wiki', icon: BookOpen, label: 'База знаний' },
        { path: '/chats', icon: MessageSquare, label: 'Поддержка' },
        { path: '/tmq', icon: ShieldCheck, label: 'TMQ (Контроль)' },
        { path: '/kanban', icon: Trello, label: 'Канбан-доска' },
        { path: '/settings', icon: Settings, label: 'Интеграции' }
      ]
    }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <AppWindow className="logo-icon" size={28} />
          <span className="logo-text">Bazzar<span className="logo-subtext">Staff</span></span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="nav-group">
            <h3 className="group-title">{group.title}</h3>
            <ul className="group-items">
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink 
                    to={item.path} 
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className="nav-icon" size={20} />
                    <span className="nav-label">{item.label}</span>
                    <ChevronRight className="active-indicator" size={14} />
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar text-gradient">AD</div>
          <div className="user-info">
            <span className="user-name">Admin User</span>
            <span className="user-role">Супер-админ</span>
          </div>
        </div>
        <button className="logout-btn" title="Выход" onClick={handleLogout}>
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
