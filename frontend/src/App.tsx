import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import WriterLayout from './layouts/WriterLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminWriters from './pages/Admin/Writers';
import AdminOrders from './pages/Admin/Orders';
import AdminShifts from './pages/Admin/Shifts';
import AdminAnalytics from './pages/Admin/Analytics';
import AdminPayments from './pages/Admin/Payments';
import AdminPendingApprovals from './pages/Admin/PendingApprovals';
import AdminSubmissions from './pages/Admin/Submissions';

// Writer Pages
import WriterDashboard from './pages/Writer/Dashboard';
import WriterMyOrders from './pages/Writer/MyOrders';
import WriterSubmissions from './pages/Writer/Submissions';
import WriterAnalytics from './pages/Writer/Analytics';
import WriterProfile from './pages/Writer/Profile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          
          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="writers" element={<AdminWriters />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="shifts" element={<AdminShifts />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="pending-approvals" element={<AdminPendingApprovals />} />
            <Route path="submissions" element={<AdminSubmissions />} />
          </Route>
          
          {/* Writer routes */}
          <Route
            path="/writer"
            element={
              <ProtectedRoute roles={['writer']}>
                <WriterLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<WriterDashboard />} />
            <Route path="dashboard" element={<WriterDashboard />} />
            <Route path="orders" element={<WriterMyOrders />} />
            <Route path="submissions" element={<WriterSubmissions />} />
            <Route path="analytics" element={<WriterAnalytics />} />
            <Route path="profile" element={<WriterProfile />} />
          </Route>
          
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
