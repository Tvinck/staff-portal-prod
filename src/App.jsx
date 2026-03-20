import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import './App.css';

// Feature Components
import ServerMonitor from './pages/vpn/ServerMonitor';
import PixelManager from './pages/pixel/PixelManager';
import MarketManager from './pages/market/MarketManager';
import Marketplaces from './pages/marketplaces/YandexMarket';
import GGSel from './pages/marketplaces/GGSel';
import Digiseller from './pages/marketplaces/Digiseller';
import Wiki from './pages/workspace/Wiki';
import Kanban from './pages/workspace/Kanban';
import PachkaSettings from './pages/settings/PachkaSettings';
import SharedAccounts from './pages/assets/SharedAccounts';
import AppleManagement from './pages/assets/AppleManagement';
import InternalApps from './pages/assets/InternalApps';
import DesslyHub from './pages/marketplaces/DesslyHub';
import Dashboard from './pages/dashboard/Dashboard';
import Finance from './pages/finance/Finance';
import News from './pages/news/News';
import SupportChats from './pages/support/SupportChats';
import TMQPage from './pages/support/TMQPage';
import Login from './pages/auth/Login';
import { supabase } from './utils/supabase';

// Pages - Dashboard moved to its own file

const AppContent = () => {
  const [session, setSession] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const location = useLocation();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }
  
  const getPageTitle = (path) => {
    switch(path) {
      case '/': return 'Общий обзор';
      case '/news': return 'Новости';
      case '/vpn': return 'Управление ZENT VPN';
      case '/pixel': return 'Управление Pixel AI Bot';
      case '/market': return 'Администрирование Bazzar Market';
      case '/marketplaces': return 'Яндекс Маркет';
      case '/marketplaces/ggsel': return 'GGSEL Marketplace';
      case '/marketplaces/digiseller': return 'Digiseller';
      case '/marketplaces/desslyhub': return 'DesslyHub API';
      case '/suppliers/desslyhub': return 'DesslyHub — Поставщик';
      case '/wiki': return 'База знаний';
      case '/kanban': return 'Канбан-доска';
      case '/finance': return 'Управление финансами';
      case '/shared-accounts': return 'Управление общими аккаунтами';
      case '/apple-certs': return 'Apple UDID & Сертификаты';
      case '/our-apps': return 'Каталог приложений';
      case '/settings': return 'Интеграции и автоматизация';
      case '/chats': return 'Центр поддержки клиентов';
      case '/tmq': return 'Контроль качества (TMQ)';
      default: return 'Стафф Портал';
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header title={getPageTitle(location.pathname)} />
        <main className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/news" element={<News />} />
            <Route path="/vpn" element={<ServerMonitor />} />
            <Route path="/pixel" element={<PixelManager />} />
            <Route path="/market" element={<MarketManager />} />
            <Route path="/marketplaces" element={<Marketplaces />} />
            <Route path="/marketplaces/ggsel" element={<GGSel />} />
            <Route path="/marketplaces/digiseller" element={<Digiseller />} />
            <Route path="/marketplaces/desslyhub" element={<DesslyHub />} />
            <Route path="/suppliers/desslyhub" element={<DesslyHub />} />
            <Route path="/wiki" element={<Wiki />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/shared-accounts" element={<SharedAccounts />} />
            <Route path="/apple-certs" element={<AppleManagement />} />
            <Route path="/our-apps" element={<InternalApps />} />
            <Route path="/settings" element={<PachkaSettings />} />
            <Route path="/chats" element={<SupportChats />} />
            <Route path="/tmq" element={<TMQPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
