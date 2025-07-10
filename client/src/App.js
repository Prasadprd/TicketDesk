import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
// Placeholder imports for new pages
const Projects = React.lazy(() => import('./pages/Projects'));
const Tickets = React.lazy(() => import('./pages/Tickets'));
const Teams = React.lazy(() => import('./pages/Teams'));
const Users = React.lazy(() => import('./pages/Users'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Activity = React.lazy(() => import('./pages/Activity'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));

function App() {
  return (
    <div>
      <Navbar />
      <React.Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects/*" element={<Projects />} />
          <Route path="/tickets/*" element={<Tickets />} />
          <Route path="/teams/*" element={<Teams />} />
          <Route path="/users/*" element={<Users />} />
          <Route path="/notifications/*" element={<Notifications />} />
          <Route path="/activity/*" element={<Activity />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </React.Suspense>
    </div>
  );
}

export default App;
