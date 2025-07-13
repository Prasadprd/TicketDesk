import React, { useEffect, useState } from 'react';
import api from '../api/api';
import {
  Box, List, ListItem, Spinner, Heading, Text, Flex, Icon, Alert, AlertIcon, Button
} from '@chakra-ui/react';
import { FaBell, FaCheck } from 'react-icons/fa';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load notifications');
      }
      setLoading(false);
    };
    fetchNotifications();
  }, []);

  // Format date to be more readable
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  // Mark notification as read (placeholder function)
  const markAsRead = (id) => {
    console.log(`Marking notification ${id} as read`);
    // In a real implementation, you would call an API endpoint here
    // and update the state accordingly
  };

  if (loading) return (
    <Flex justify="center" align="center" height="80vh">
      <Spinner size="xl" thickness="4px" speed="0.65s" color="brand.500" />
    </Flex>
  );
  if (error) return (
    <Box p={6}>
      <Alert status="error" variant="left-accent" borderRadius="md">
        <AlertIcon />
        <Text fontWeight="medium">{error}</Text>
      </Alert>
    </Box>
  );

  return (
    <Box className="notifications-container">
      <Box className="notifications-header">
        <Heading as="h1" className="notifications-title">Notifications</Heading>
        {notifications.length > 0 && (
          <Button 
            leftIcon={<FaCheck />} 
            size="sm" 
            variant="outline" 
            colorScheme="blue"
            onClick={() => console.log('Mark all as read')}
          >
            Mark all as read
          </Button>
        )}
      </Box>
      
      <Box className="notifications-list-container">
        <List className="notifications-list" spacing={0}>
          {notifications.length > 0 ? notifications.map((n) => (
            <ListItem key={n._id} className={`notification-item ${n.read ? 'notification-read' : 'notification-unread'}`}>
              <Flex className="notification-icon">
                <Icon as={FaBell} />
              </Flex>
              <Box className="notification-content">
                <Text className="notification-title">{n.title}</Text>
                <Text className="notification-message">{n.message}</Text>
                <Text className="notification-time">{formatDate(n.createdAt)}</Text>
              </Box>
              {!n.read && (
                <Button 
                  className="notification-mark-read" 
                  size="xs" 
                  variant="ghost" 
                  leftIcon={<FaCheck />}
                  onClick={() => markAsRead(n._id)}
                >
                  Mark as read
                </Button>
              )}
            </ListItem>
          )) : (
            <ListItem p={4} textAlign="center">
              <Text color="gray.500">No notifications found</Text>
            </ListItem>
          )}
        </List>
      </Box>
    </Box>
  );
};

export default Notifications;
