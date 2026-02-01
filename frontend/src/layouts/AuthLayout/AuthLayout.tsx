import React from 'react';
import { Outlet } from 'react-router-dom';
import './AuthLayout.css';

const AuthLayout: React.FC = () => {
  return (
    <div className="auth-layout">
      <div className="auth-layout-children">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
