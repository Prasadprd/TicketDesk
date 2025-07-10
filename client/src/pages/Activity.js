import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Box, List, ListItem, Spinner } from '@chakra-ui/react';

const Activity = () => {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const res = await api.get('/activities/user/me');
        setActivity(res.data.activities || res.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load activity');
      }
      setLoading(false);
    };
    fetchActivity();
  }, []);

  if (loading) return <Spinner size="xl" />;
  if (error) return <Box color="red.500">{error}</Box>;

  return (
    <Box p={6}>
      <List spacing={3}>
        {activity.map((act) => (
          <ListItem key={act._id}>
            <b>{act.action}</b> {act.entityType} {act.details?.name || act.details?.title || ''} ({new Date(act.createdAt).toLocaleString()})
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Activity;
