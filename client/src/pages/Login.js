import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { Box, Button, Input, FormControl, FormLabel, Heading, useToast } from '@chakra-ui/react';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/users/login', form);
      localStorage.setItem('token', res.data.token);
      toast({ title: 'Login successful', status: 'success' });
      navigate('/dashboard');
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Login failed', status: 'error' });
    }
    setLoading(false);
  };

  return (
    <Box maxW="sm" mx="auto" mt={20} p={8} borderWidth={1} borderRadius={8} boxShadow="lg">
      <Heading mb={6}>Login</Heading>
      <form onSubmit={handleSubmit}>
        <FormControl mb={4}>
          <FormLabel>Email</FormLabel>
          <Input name="email" type="email" value={form.email} onChange={handleChange} required />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Password</FormLabel>
          <Input name="password" type="password" value={form.password} onChange={handleChange} required />
        </FormControl>
        <Button colorScheme="blue" type="submit" isLoading={loading} width="full">Login</Button>
      </form>
      <Box mt={4} textAlign="center">
        Don't have an account? <Link to="/register" style={{ color: '#3182ce' }}>Register</Link>
      </Box>
    </Box>
  );
};

export default Login;
