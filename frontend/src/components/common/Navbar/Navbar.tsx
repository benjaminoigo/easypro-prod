import React from 'react';
import { Bell, Search, User, Menu, ChevronDown, LogOut } from 'lucide-react';
import './Navbar.css';

export interface NavbarProps {
  title?: string;
  user?: {
    name: string;
    email?: string;
    avatar?: string;
    role?: string;
  };
  onLogout?: () => void;
  onMenuToggle?: () => void;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  notifications?: number;
  onNotificationClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({
  title,
  user,
  onLogout,
  onMenuToggle,
  showSearch = false,
  onSearch,
  notifications = 0,
  onNotificationClick,
  className = '',
  children,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className={`navbar ${className}`}>
      <div className="navbar-left">
        {onMenuToggle && (
          <button className="navbar-menu-btn" onClick={onMenuToggle}>
            <Menu />
          </button>
        )}
        {title && <h2 className="navbar-title">{title}</h2>}
        {children}
      </div>

      <div className="navbar-right">
        {showSearch && (
          <form className="navbar-search" onSubmit={handleSearchSubmit}>
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        )}

        {onNotificationClick && (
          <button className="navbar-notification-btn" onClick={onNotificationClick}>
            <Bell />
            {notifications > 0 && (
              <span className="notification-badge">
                {notifications > 99 ? '99+' : notifications}
              </span>
            )}
          </button>
        )}

        {user && (
          <div className="navbar-user">
            <button 
              className="user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder">
                  <User />
                </div>
              )}
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                {user.role && <span className="user-role">{user.role}</span>}
              </div>
              <ChevronDown className={`dropdown-icon ${showUserMenu ? 'open' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <span className="dropdown-user-name">{user.name}</span>
                  {user.email && <span className="dropdown-user-email">{user.email}</span>}
                </div>
                <div className="dropdown-divider" />
                {onLogout && (
                  <button className="dropdown-item logout" onClick={onLogout}>
                    <LogOut />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
