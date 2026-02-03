import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Clock,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Zap,
  User,
  UserCheck,
  Send,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './AdminLayout.css';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Pending Approvals', href: '/admin/pending-approvals', icon: UserCheck },
    { name: 'Writers', href: '/admin/writers', icon: Users },
    { name: 'Orders', href: '/admin/orders', icon: FileText },
    { name: 'Submissions', href: '/admin/submissions', icon: Send },
    { name: 'Shifts', href: '/admin/shifts', icon: Clock },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(href);
  };

  const getPageTitle = () => {
    const currentNav = navItems.find(item => isActiveRoute(item.href));
    return currentNav?.name || 'Admin';
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-layout-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Zap />
            </div>
            <span className="sidebar-logo-text">Writer<span>Street</span></span>
          </div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
            <X />
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">
              <User />
            </div>
            <div className="sidebar-user-details">
              <h4>{user?.firstName} {user?.lastName}</h4>
              <p>{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-section">
            <div className="sidebar-nav-title">Main Menu</div>
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-nav-item ${isActiveRoute(item.href) ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <LogOut />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-layout-main">
        <header className="admin-layout-header">
          <div className="admin-header-left">
            <button className="admin-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu />
            </button>
            <h1 className="admin-page-title">{getPageTitle()}</h1>
          </div>
          <div className="admin-header-right">
            <span className="admin-header-date">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <button className="admin-notification-btn">
              <Bell />
              <span className="admin-notification-badge"></span>
            </button>
          </div>
        </header>

        <div className="admin-layout-content">
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
