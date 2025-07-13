import React, { useEffect, useState } from 'react';
import api from '../api/api';
import {
  Box, List, ListItem, Spinner, Heading, Text, Flex, Icon, Alert, AlertIcon
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaUserTag } from 'react-icons/fa';
import './Activity.css';

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

  // Helper function to get the appropriate icon for each action type
  const getActivityIcon = (action) => {
    switch(action.toLowerCase()) {
      case 'create':
        return <Icon as={FaPlus} />
      case 'update':
        return <Icon as={FaEdit} />
      case 'delete':
        return <Icon as={FaTrash} />
      case 'assign':
        return <Icon as={FaUserTag} />
      default:
        return <Icon as={FaEdit} />
    }
  };

  // Helper function to get the appropriate icon background class
  const getActivityIconClass = (action) => {
    let className = "activity-icon activity-icon-update";
    if (action.toLowerCase() === 'create') className = "activity-icon activity-icon-create";
    if (action.toLowerCase() === 'delete') className = "activity-icon activity-icon-delete";
    if (action.toLowerCase() === 'assign') className = "activity-icon activity-icon-assign";
    return className;
  };

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
    <Box className="activity-container">
      <Box className="activity-header">
        <Heading as="h1" className="activity-title">Activity History</Heading>
      </Box>
      
      <Box className="activity-list-container">
        <List className="activity-list" spacing={0}>
          {activity.length > 0 ? activity.map((act) => (
            <ListItem key={act._id} className="activity-item">
              <Flex className={getActivityIconClass(act.action)}>
                {getActivityIcon(act.action)}
              </Flex>
              <Box className="activity-content">
                <Flex alignItems="center" flexWrap="wrap">
                  <Text className="activity-action">{act.action}</Text>
                  <Text className="activity-entity">{act.entityType}</Text>
                  <Text className="activity-name">{act.details?.name || act.details?.title || ''}</Text>
                </Flex>
                <Text className="activity-time">{formatDate(act.createdAt)}</Text>
              </Box>
            </ListItem>
          )) : (
            <ListItem p={4} textAlign="center">
              <Text color="gray.500">No activity found</Text>
            </ListItem>
          )}
        </List>
      </Box>
    </Box>
  );
};

export default Activity;
