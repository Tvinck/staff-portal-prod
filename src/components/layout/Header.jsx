import React from 'react';
import { Search, Bell, Menu, Sun, Moon } from 'lucide-react';
import './Header.css';

const Header = ({ title }) => {
  return (
    <header className="header glass">
      <div className="header-left">
        <h2 className="page-title">{title}</h2>
      </div>

      <div className="header-search">
        <div className="search-container">
          <Search className="search-icon" size={18} />
          <input type="text" placeholder="Поиск по системе... (⌘K)" />
        </div>
      </div>

      <div className="header-right">
        <button className="header-action-btn" title="Toggle Theme">
          <Moon size={20} />
        </button>
        <button className="header-action-btn" title="Notifications">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
