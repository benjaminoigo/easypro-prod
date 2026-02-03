import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Upload,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Zap,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatUSD } from '../../utils/formatUSD';
import './WriterLayout.css';

const WriterLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/writer', icon: LayoutDashboard },
    { name: 'My Orders', href: '/writer/orders', icon: FileText },
    { name: 'Submissions', href: '/writer/submissions', icon: Upload },
    { name: 'Analytics', href: '/writer/analytics', icon: BarChart3 },
    { name: 'Profile', href: '/writer/profile', icon: User },
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/writer') {
      return location.pathname === '/writer' || location.pathname === '/writer/';
    }
    return location.pathname.startsWith(href);
  };

  const getPageTitle = () => {
    const currentNav = navItems.find(item => isActiveRoute(item.href));
    return currentNav?.name || 'Writer';
  };

  const balance = user?.writerProfile?.balanceUSD || 0;

  return (
    <div className="writer-layout">
      {/* Sidebar */}
      <aside className={`writer-layout-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="writer-sidebar-header">
          <div className="writer-sidebar-logo">
            <div className="writer-sidebar-logo-icon">
              <Zap />
            </div>
            <span className="writer-sidebar-logo-text">Writer<span>Street</span></span>
          </div>
          <button className="writer-sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
            <X />
          </button>
        </div>

        <div className="writer-sidebar-user">
          <div className="writer-sidebar-user-info">
            <div className="writer-sidebar-user-avatar">
              <User />
            </div>
            <div className="writer-sidebar-user-details">
              <h4>{user?.firstName} {user?.lastName}</h4>
              <p>Writer</p>
            </div>
          </div>
        </div>

        <div className="writer-sidebar-balance">
          <div className="writer-sidebar-balance-label">Current Balance</div>
          <div className="writer-sidebar-balance-amount">{formatUSD(balance)}</div>
        </div>

        <nav className="writer-sidebar-nav">
          <div className="writer-sidebar-nav-section">
            <div className="writer-sidebar-nav-title">Navigation</div>
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`writer-sidebar-nav-item ${isActiveRoute(item.href) ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        <div className="writer-sidebar-footer">
          <button className="writer-sidebar-logout-btn" onClick={handleLogout}>
            <LogOut />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="writer-layout-main">
        <header className="writer-layout-header">
          <div className="writer-header-left">
            <button className="writer-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu />
            </button>
            <h1 className="writer-page-title">{getPageTitle()}</h1>
          </div>
          <div className="writer-header-right">
            <div className="writer-header-shift">
              <Clock />
              <span>Shift Active</span>
            </div>
            <button className="writer-notification-btn">
              <Bell />
              <span className="writer-notification-badge"></span>
            </button>
          </div>
        </header>

        <div className="writer-layout-content">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      <div 
        className={`writer-sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
    </div>
  );
};

export default WriterLayout;
