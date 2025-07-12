import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import {
  Box, Button, Input, FormControl, FormLabel, Heading, Text, useToast,
  InputGroup, InputLeftElement, InputRightElement, Flex, Icon, VStack
} from '@chakra-ui/react';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaTicketAlt } from 'react-icons/fa';

// Import CSS
import './Register.css';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    try {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = form;
      const res = await api.post('/users', userData);
      localStorage.setItem('token', res.data.token);
      toast({
        title: 'Registration successful',
        description: 'Welcome to TicketDesk!',
        status: 'success',
        duration: 3000,
        position: 'top',
        isClosable: true,
      });
      navigate('/dashboard');
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: err.response?.data?.message || 'Could not create account',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  return (
    <Box className="register-container">
      <Box className="register-card">
        <VStack className="register-header" spacing={2}>
          <Flex className="register-logo" justify="center" align="center">
            <Icon as={FaTicketAlt} boxSize={10} color="brand.500" />
          </Flex>
          <Heading className="register-title">Create an Account</Heading>
          <Text className="register-subtitle">Join TicketDesk to manage your projects</Text>
        </VStack>
        
        <form onSubmit={handleSubmit} className="register-form">
          <FormControl mb={4}>
            <FormLabel>Full Name</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaUser} color="gray.400" />
              </InputLeftElement>
              <Input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                placeholder="Enter your full name"
                className="register-input"
                required 
              />
            </InputGroup>
          </FormControl>
          
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
                className="register-input"
                required 
              />
            </InputGroup>
          </FormControl>
          
          <FormControl mb={4}>
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
                placeholder="Create a password"
                className="register-input"
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
          
          <FormControl mb={6}>
            <FormLabel>Confirm Password</FormLabel>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaLock} color="gray.400" />
              </InputLeftElement>
              <Input 
                name="confirmPassword" 
                type={showConfirmPassword ? "text" : "password"} 
                value={form.confirmPassword} 
                onChange={handleChange} 
                placeholder="Confirm your password"
                className="register-input"
                required 
              />
              <InputRightElement width="3rem">
                <Button 
                  h="1.5rem" 
                  size="sm" 
                  variant="ghost" 
                  onClick={toggleConfirmPasswordVisibility}
                >
                  <Icon as={showConfirmPassword ? FaEyeSlash : FaEye} color="gray.500" />
                </Button>
              </InputRightElement>
            </InputGroup>
          </FormControl>
          
          <Button 
            colorScheme="brand" 
            type="submit" 
            isLoading={loading} 
            className="register-button"
            loadingText="Creating account"
          >
            Create Account
          </Button>
        </form>
        
        <Box className="register-footer">
          Already have an account? <Link to="/login" className="register-link">Sign In</Link>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;
