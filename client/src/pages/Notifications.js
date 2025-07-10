import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Box, List, ListItem, Spinner } from '@chakra-ui/react';

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

  if (loading) return <Spinner size="xl" />;
  if (error) return <Box color="red.500">{error}</Box>;

  return (
    <Box p={6}>
      <List spacing={3}>
        {notifications.map((n) => (
          <ListItem key={n._id}>
            <b>{n.title}</b>: {n.message} ({new Date(n.createdAt).toLocaleString()})
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Notifications;
