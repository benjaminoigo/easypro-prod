import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import './Sidebar.css';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: number | string;
}

export interface SidebarProps {
  title: string;
  subtitle?: string;
  navItems: NavItem[];
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'dark' | 'light' | 'primary';
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  title,
  subtitle,
  navItems,
  logo,
  footer,
  variant = 'dark',
  collapsed = false,
  onToggleCollapse,
  className = '',
}) => {
  return (
    <aside className={`sidebar sidebar-${variant} ${collapsed ? 'collapsed' : ''} ${className}`}>
      <div className="sidebar-header">
        {logo && <div className="sidebar-logo">{logo}</div>}
        <div className="sidebar-brand">
          <h1 className="sidebar-title">{title}</h1>
          {subtitle && <p className="sidebar-subtitle">{subtitle}</p>}
        </div>
        {onToggleCollapse && (
          <button 
            className="sidebar-toggle" 
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            ☰
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.path} className="nav-item">
              <NavLink
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <item.icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {footer && <div className="sidebar-footer">{footer}</div>}
    </aside>
  );
};

export default Sidebar;
