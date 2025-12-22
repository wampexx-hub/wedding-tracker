import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import InstallmentCalendar from './components/InstallmentCalendar';

import CurrencyTrackerPage from './components/CurrencyTrackerPage';
import PartnerManagement from './components/PartnerManagement';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/AdminRoute';

const MainApp = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expenseFilter, setExpenseFilter] = useState('purchased');
  const [editingExpense, setEditingExpense] = useState(null);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!user.wedding_date || !user.city) {
    return <Navigate to="/onboarding" />;
  }

  // If user is admin trying to access main app, maybe redirect to admin?
  // Or let them use the app too? Let's let them use the app too.

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setActiveTab('add');
  };

  const handleFormSuccess = () => {
    setEditingExpense(null);
    setActiveTab('expenses');
  };

  const handleFormCancel = () => {
    setEditingExpense(null);
    setActiveTab('expenses');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} setExpenseFilter={setExpenseFilter} />;
      case 'add':
        return (
          <ExpenseForm
            onSuccess={handleFormSuccess}
            initialData={editingExpense}
            onCancel={handleFormCancel}
          />
        );
      case 'expenses':
        return <ExpenseList onEdit={handleEditExpense} initialTab={expenseFilter} />;

      case 'currency':
        return <CurrencyTrackerPage />;
      case 'calendar':
        return <InstallmentCalendar />;
      case 'partner':
        return <PartnerManagement />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ExpenseProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route path="/" element={<MainApp />} />
          </Routes>
        </ExpenseProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
