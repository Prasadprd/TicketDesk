import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { Box, Heading, Text, SimpleGrid, Flex, Spinner, Alert, AlertIcon, AlertTitle, AlertDescription, Card, CardHeader, CardBody, CardFooter, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Divider } from '@chakra-ui/react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { FaUsers, FaProjectDiagram, FaTicketAlt, FaUserFriends } from 'react-icons/fa';
import 'chart.js/auto';
import './Dashboard.css';

const Dashboard = () => {
  console.log('Rendering Dashboard');
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Redirect to login if no token
    const token = localStorage.getItem('token');
    console.log('Checking token:', token);
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewRes, distRes, projRes, activityRes] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/ticket-distribution'),
          api.get('/dashboard/project-stats'),
          // api.get('/activity?limit=5'),
        ]);
        console.log('Fetched data:', { overviewRes, distRes, projRes, activityRes });
        setOverview(overviewRes.data);
        setDistribution(distRes.data);
        setProjectStats(projRes.data);
        // setRecentActivity(activityRes.data || []);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      }
      setLoading(false);
    };
    fetchData();
  }, [navigate]);

  if (loading) return (
    <Flex justify="center" align="center" height="80vh">
      <Spinner size="xl" thickness="4px" speed="0.65s" color="brand.500" />
    </Flex>
  );
  
  if (error) return (
    <Box p={6}>
      <Alert status="error" variant="left-accent" borderRadius="md">
        <AlertIcon />
        <AlertTitle mr={2}>Error!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </Box>
  );

  return (
    <Box className="dashboard-container">
      <Box className="dashboard-header">
        <Heading as="h1" className="dashboard-title">Dashboard Overview</Heading>
        <Text className="dashboard-subtitle">Welcome back! Here's what's happening with your projects today.</Text>
      </Box>
      
      {/* Stats Overview */}
      <SimpleGrid className="stats-grid" columns={{ base: 1, sm: 2, md: 4 }} spacing={5} mb={8}>
        <Box className="stat-card">
          <Flex align="center">
            <Box className="stat-icon">
              <FaUsers size={24} />
            </Box>
            <Box>
              <Text className="stat-title">Users</Text>
              <Text className="stat-value">{overview.users}</Text>
            </Box>
          </Flex>
        </Box>
        
        <Box className="stat-card">
          <Flex align="center">
            <Box className="stat-icon">
              <FaProjectDiagram size={24} />
            </Box>
            <Box>
              <Text className="stat-title">Projects</Text>
              <Text className="stat-value">{overview.projects}</Text>
            </Box>
          </Flex>
        </Box>
        
        <Box className="stat-card">
          <Flex align="center">
            <Box className="stat-icon">
              <FaTicketAlt size={24} />
            </Box>
            <Box>
              <Text className="stat-title">Tickets</Text>
              <Text className="stat-value">{overview.tickets}</Text>
            </Box>
          </Flex>
        </Box>
        
        <Box className="stat-card">
          <Flex align="center">
            <Box className="stat-icon">
              <FaUserFriends size={24} />
            </Box>
            <Box>
              <Text className="stat-title">Teams</Text>
              <Text className="stat-value">{overview.teams}</Text>
            </Box>
          </Flex>
        </Box>
      </SimpleGrid>

      {/* Ticket Distribution */}
      <Box className="chart-section">
        <Box className="chart-header">
          <Heading as="h2" className="chart-title">Ticket Distribution</Heading>
        </Box>
        
        <SimpleGrid className="chart-grid" columns={{ base: 1, md: 3 }} spacing={6}>
          <Box className="chart-card">
            <Heading as="h3" size="sm" mb={4}>By Status</Heading>
            <Box className="chart-container">
              <Pie 
                data={{
                  labels: distribution.byStatus.map(s => s._id),
                  datasets: [{
                    data: distribution.byStatus.map(s => s.count),
                    backgroundColor: ['#3182CE', '#E53E3E', '#38A169', '#805AD5', '#DD6B20', '#00B5D8'],
                    borderWidth: 1,
                    borderColor: '#fff',
                  }],
                }}
                options={{
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        padding: 15,
                      },
                    },
                  },
                  maintainAspectRatio: false,
                }}
              />
            </Box>
          </Box>
          
          <Box className="chart-card">
            <Heading as="h3" size="sm" mb={4}>By Priority</Heading>
            <Box className="chart-container">
              <Doughnut 
                data={{
                  labels: distribution.byPriority.map(s => s._id),
                  datasets: [{
                    data: distribution.byPriority.map(s => s.count),
                    backgroundColor: ['#E53E3E', '#DD6B20', '#D69E2E', '#38A169', '#3182CE'],
                    borderWidth: 1,
                    borderColor: '#fff',
                  }],
                }}
                options={{
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        padding: 15,
                      },
                    },
                  },
                  maintainAspectRatio: false,
                }}
              />
            </Box>
          </Box>
          
          <Box className="chart-card">
            <Heading as="h3" size="sm" mb={4}>By Type</Heading>
            <Box className="chart-container">
              <Pie 
                data={{
                  labels: distribution.byType.map(s => s._id),
                  datasets: [{
                    data: distribution.byType.map(s => s.count),
                    backgroundColor: ['#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5'],
                    borderWidth: 1,
                    borderColor: '#fff',
                  }],
                }}
                options={{
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        padding: 15,
                      },
                    },
                  },
                  maintainAspectRatio: false,
                }}
              />
            </Box>
          </Box>
        </SimpleGrid>
      </Box>

      {/* Tickets per Project */}
      <Box className="chart-section">
        <Box className="chart-header">
          <Heading as="h2" className="chart-title">Tickets per Project</Heading>
        </Box>
        
        <Box className="bar-chart-container">
          <Bar 
            data={{
              labels: projectStats.map(p => p.project),
              datasets: [{
                label: 'Number of Tickets',
                data: projectStats.map(p => p.count),
                backgroundColor: '#3182CE',
                borderRadius: 6,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)',
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                },
              },
            }}
          />
        </Box>
      </Box>
      
      {/* Recent Activity */}
      <Box className="chart-section">
        <Box className="chart-header">
          <Heading as="h2" className="chart-title">Recent Activity</Heading>
        </Box>
        
        <Box className="chart-card">
          {recentActivity.length > 0 ? (
            <Box>
              {recentActivity.map((activity, index) => (
                <Box key={activity._id || index}>
                  <Flex justify="space-between" align="center" py={3}>
                    <Box>
                      <Text fontWeight="medium">{activity.description}</Text>
                      <Text fontSize="sm" color="gray.500">{activity.user?.name || 'System'}</Text>
                    </Box>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(activity.createdAt).toLocaleString()}
                    </Text>
                  </Flex>
                  {index < recentActivity.length - 1 && <Divider />}
                </Box>
              ))}
            </Box>
          ) : (
            <Text color="gray.500" textAlign="center" py={4}>No recent activity</Text>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
