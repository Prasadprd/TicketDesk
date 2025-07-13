import React, { useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Flex, Spinner, useColorModeValue } from '@chakra-ui/react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import { AuthContext } from './context/AuthContext';

// Lazy loaded page components
const Projects = React.lazy(() => import('./pages/Projects'));
const Tickets = React.lazy(() => import('./pages/Tickets'));
const Teams = React.lazy(() => import('./pages/Teams'));
const Users = React.lazy(() => import('./pages/Users'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Activity = React.lazy(() => import('./pages/Activity'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  // console.log('from ProtectedROute', isAuthenticated)
  const location = useLocation();
  
  if (loading) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    );
  }
  
  if (!isAuthenticated) {
    console.log("User is not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

function App() {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  
  return (
    <Box minH="100vh" bg={bgColor}>
      <Navbar />
      <Box as="main" className="page-container">
        <React.Suspense fallback={
          <Flex justify="center" align="center" h="50vh">
            <Spinner size="xl" color="brand.500" thickness="4px" />
          </Flex>
        }>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/projects/*" element={
              
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/tickets/*" element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            } />
            <Route path="/teams/*" element={
              <ProtectedRoute>
                <Teams />
              </ProtectedRoute>
            } />
            <Route path="/users/*" element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            } />
            <Route path="/notifications/*" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/activity/*" element={
              <ProtectedRoute>
                <Activity />
              </ProtectedRoute>
            } />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </React.Suspense>
      </Box>
    </Box>
  );
}

export default App;
