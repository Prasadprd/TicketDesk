import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api/api';
import {
  Box, Button, Input, FormControl, FormLabel, Heading, Text, useToast,
  InputGroup, InputLeftElement, InputRightElement, Flex, Icon, VStack
} from '@chakra-ui/react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaTicketAlt } from 'react-icons/fa';

// Import CSS
import './Login.css';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is being redirected from another page
  useEffect(() => {
    const from = location.state?.from?.pathname;
    if (from) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to access that page',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [location, toast]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log(form);
      const res = await api.post('/users/login', form);
      localStorage.setItem('token', res.data.token);
      console.log('Login successful:', res.data);
      toast({
        title: 'Login successful',
        description: 'Welcome back to TicketDesk!',
        status: 'success',
        duration: 3000,
        position: 'top',
        isClosable: true,
      });
      
      // Navigate to the page the user was trying to access, or dashboard
      // const from = '/dashboard';
      navigate('/dashboard');
    } catch (err) {
      toast({
        title: 'Login failed',
        description: err.response?.data?.message || 'Invalid credentials',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  return (
    <Box className="login-container">
      <Box className="login-card">
        <VStack className="login-header" spacing={2}>
          <Flex className="login-logo" justify="center" align="center">
            <Icon as={FaTicketAlt} boxSize={10} color="brand.500" />
          </Flex>
          <Heading className="login-title">Welcome to TicketDesk</Heading>
          <Text className="login-subtitle">Sign in to your account to continue</Text>
        </VStack>
        
        <form onSubmit={handleSubmit} className="login-form">
          <FormControl mb={4}>
            <FormLabel>Email</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaEnvelope} color="gray.400" />
              </InputLeftElement>
              <Input 
                name="email" 
                type="email" 
                value={form.email} 
                onChange={handleChange} 
                placeholder="Enter your email"
                className="login-input"
                required 
              />
            </InputGroup>
          </FormControl>
          
          <FormControl mb={6}>
            <FormLabel>Password</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaLock} color="gray.400" />
              </InputLeftElement>
              <Input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                value={form.password} 
                onChange={handleChange} 
                placeholder="Enter your password"
                className="login-input"
                required 
              />
              <InputRightElement width="3rem">
                <Button 
                  h="1.5rem" 
                  size="sm" 
                  variant="ghost" 
                  onClick={togglePasswordVisibility}
                >
                  <Icon as={showPassword ? FaEyeSlash : FaEye} color="gray.500" />
                </Button>
              </InputRightElement>
            </InputGroup>
          </FormControl>
          
          <Button 
            colorScheme="brand" 
            type="submit" 
            isLoading={loading} 
            className="login-button"
            loadingText="Signing in"
          >
            Sign In
          </Button>
        </form>
        
        <Box className="login-footer">
          Don't have an account? <Link to="/register" className="login-link">Register</Link>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
