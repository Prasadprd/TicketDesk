import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Heading,
  Text,
  Flex,
  Badge,
  Spinner,
  useToast,
  Grid,
  Divider,
  InputGroup,
  InputLeftElement,
  Stack,
  HStack,
  Avatar,
  Tag,
  TagLabel,
  IconButton,
  filter,
  TagCloseButton
} from '@chakra-ui/react';
import { FaUser, FaArrowLeft, FaSave } from 'react-icons/fa';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectResults, setProjectResults] = useState([]);
  const [projectLoading, setProjectLoading] = useState(false);
  // Define default ticket statuses, priorities, and types
  const [statuses, setStatuses] = useState([
    { name: 'To Do', color: '#718096', order: 0 },
    { name: 'In Progress', color: '#4299E1', order: 1 },
    { name: 'Review', color: '#805AD5', order: 2 },
    { name: 'Done', color: '#38A169', order: 3 }
  ]);
  
  const [priorities, setPriorities] = useState([
    { name: 'Low', color: '#38A169', order: 0 },
    { name: 'Medium', color: '#4299E1', order: 1 },
    { name: 'High', color: '#DD6B20', order: 2 },
    { name: 'Critical', color: '#E53E3E', order: 3 }
  ]);
  
  const [types, setTypes] = useState([
    { name: 'Bug', icon: 'bug', color: '#E53E3E' },
    { name: 'Feature', icon: 'star', color: '#38A169' },
    { name: 'Task', icon: 'check-circle', color: '#4299E1' },
    { name: 'Epic', icon: 'lightning', color: '#805AD5' }
  ]);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    project: '',
    status: '',
    priority: '',
    type: '',
    assignee: null
  });

  useEffect(() => {
    const initializeTicket = async () => {
      setLoading(true);
      try {
        // Fetch ticket data first
        const ticketRes = await api.get(`/tickets/${id}`);
        const ticketData = ticketRes.data.ticket;
        console.log('Ticket data:', ticketData);
        
        if (!ticketData) {
          throw new Error('No ticket data received');
        }
        
        setTicket(ticketData);

        // Fetch projects
        const projectsRes = await api.get('/projects');
        const projectsList = projectsRes.data.projects || projectsRes.data;
        setProjects(projectsList);

        // Set project search value if ticket has a project
        if (ticketData.project && ticketData.project.name) {
          setProjectSearch(ticketData.project.name);
        }

        // Ensure we're using the correct project ID format
        const projectId = ticketData.project && ticketData.project._id ? 
          ticketData.project._id : 
          (typeof ticketData.project === 'string' ? ticketData.project : '');

        // Set form data with ticket values
        const formData = {
          title: ticketData.title || '',
          description: ticketData.description || '',
          project: projectId,
          status: ticketData.status || '',
          priority: ticketData.priority || '',
          type: ticketData.type || '',
          assignee: ticketData.assignee && ticketData.assignee._id ? ticketData.assignee._id : ''
        };
        
        setForm(formData);
        console.log("Form initialized with data:", formData);

        // Set assignee name if exists
        if (ticketData.assignee && ticketData.assignee.name) {
          setUserSearch(ticketData.assignee.name);
        }

        setError(null);
      } catch (err) {
        console.error('Error loading ticket:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load ticket');
        toast({
          title: 'Error',
          description: err.response?.data?.message || err.message || 'Failed to load ticket',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    initializeTicket();
  }, [id, toast]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // If project changed, update the project search field
    if (name === 'project' && value) {
      // Find the project name and update the search field
      const selectedProject = projects.find(p => p._id === value);
      if (selectedProject) {
        setProjectSearch(selectedProject.name);
      }
    }
  };

  const handleProjectSearch = (name) => {
    setProjectSearch(name);
    console.log("name:",name)
    if (!name) {
      setProjectResults([]);
      return;
    }

    setProjectLoading(true);
    // Filter projects based on name
    const filteredProjects = projects.filter(project => {
      // Check if project and project.name exist before calling toLowerCase
      if (!project || !project.name) return false;
      return project.name.toLowerCase().includes(name.toLowerCase());
    });
    console.log("setting",filteredProjects)
    setProjectResults(filteredProjects);
    setProjectLoading(false);
  };

  const handleSelectProject = (projectId, projectName) => {
    if (!projectId || !projectName) {
      toast({
        title: 'Error',
        description: 'Invalid project selected',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Update form with the selected project ID
    setForm(prev => ({ ...prev, project: projectId }));
    setProjectSearch(projectName);
    setProjectResults([]);
    
    console.log('Project selected:', projectId, projectName);
    
    // Clear assignee when project changes as the assignee might not be a member of the new project
    setForm(prev => ({ ...prev, assignee: null }));
    setUserSearch('');
    setUserResults([]);
  };

  const handleUserSearch = async (name) => {
    setUserSearch(name);
    if (!name) {
      setUserResults([]);
      return;
    }

    setAssigneeLoading(true);
    try {
      const projectId = form.project;
      if (!projectId) {
        toast({
          title: 'Project Required',
          description: 'Please select a project first',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        setAssigneeLoading(false);
        return;
      }

      // Ensure name is properly encoded for the API call
      const encodedName = encodeURIComponent(name);
      const projectIdValue = typeof projectId === 'object' ? projectId._id : projectId;
      
      console.log('Searching users with:', { name, encodedName, projectId: projectIdValue });
      
      // Use startsWith parameter to get users starting with the entered name
      const res = await api.get(`/users/search?name=${encodedName}&project=${projectIdValue}&startsWith=true`);
      
      if (res.data && Array.isArray(res.data)) {
        // Sort results to prioritize exact matches and then by name
        const sortedResults = res.data.sort((a, b) => {
          // Exact matches first
          if (a.name.toLowerCase() === name.toLowerCase()) return -1;
          if (b.name.toLowerCase() === name.toLowerCase()) return 1;
          // Then sort by name
          return a.name.localeCompare(b.name);
        });
        
        setUserResults(sortedResults);
        console.log('User search results:', sortedResults);
      } else {
        setUserResults([]);
        console.log('No user search results found');
      }
    } catch (err) {
      console.error('Error searching users:', err);
      console.error('Error details:', err.response?.data || err.message);
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to search users',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    setAssigneeLoading(false);
  };

  const handleAssignUser = (userId, userName) => {
    setForm({ ...form, assignee: userId });
    setUserSearch(userName);
    setUserResults([]);
  };

  const handleUnassign = () => {
    setForm({ ...form, assignee: null });
    setUserSearch('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const missingFields = [];
    if (!form.title) missingFields.push('Title');
    if (!form.description) missingFields.push('Description');
    if (!form.project) missingFields.push('Project');
    if (!form.status) missingFields.push('Status');
    if (!form.priority) missingFields.push('Priority');
    if (!form.type) missingFields.push('Type');

    if (missingFields.length > 0) {
      toast({
        title: 'Please fill all required fields',
        description: `Missing: ${missingFields.join(', ')}`,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSaving(true);
    try {
      // Ensure we're sending the project ID, not the project object
      const projectId = typeof form.project === 'object' ? 
        (form.project._id ? form.project._id : form.project) : form.project;
      
      console.log('Project ID being sent:', projectId);
      
      const updateData = {
        title: form.title,
        description: form.description,
        project: projectId,
        status: form.status,
        priority: form.priority,
        type: form.type,
        assignee: form.assignee || null
      };

      // console.log('Updating ticket with data:', updateData);
      const res = await api.put(`/tickets/${id}`, updateData);
      
      if (!res.data) {
        throw new Error('No response data received after update');
      }
      
      setTicket(res.data);

      toast({
        title: 'Success',
        description: 'Ticket updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Redirect to tickets page after successful update
      navigate('/tickets');
    } catch (err) {
      console.error('Error updating ticket:', err);
      toast({
        title: 'Error',
        description: err.response?.data?.message || err.message || 'Failed to update ticket',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setSaving(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Low':
        return <Badge colorScheme="green">Low</Badge>;
      case 'Medium':
        return <Badge colorScheme="yellow">Medium</Badge>;
      case 'High':
        return <Badge colorScheme="orange">High</Badge>;
      case 'Critical':
        return <Badge colorScheme="red">Critical</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open':
        return <Badge colorScheme="blue">Open</Badge>;
      case 'In Progress':
        return <Badge colorScheme="yellow">In Progress</Badge>;
      case 'Resolved':
        return <Badge colorScheme="green">Resolved</Badge>;
      case 'Closed':
        return <Badge colorScheme="gray">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'Bug':
        return <Badge colorScheme="red">Bug</Badge>;
      case 'Feature':
        return <Badge colorScheme="purple">Feature</Badge>;
      case 'Task':
        return <Badge colorScheme="blue">Task</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" />
        <Text ml={4}>Loading ticket...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Text color="red.500" fontSize="lg" mb={4}>
          {error}
        </Text>
        <Button
          leftIcon={<FaArrowLeft />}
          onClick={() => navigate('/tickets')}
        >
          Back to Tickets
        </Button>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="container.xl" mx="auto">
      <Flex align="center" mb={6}>
        <IconButton
          icon={<FaArrowLeft />}
          mr={3}
          onClick={() => navigate('/tickets')}
          aria-label="Back to tickets"
        />
        <Heading size="lg">Edit Ticket {ticket?.ticketNumber}</Heading>
      </Flex>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        <Box>
          <Box as="form" onSubmit={handleSubmit}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Project</FormLabel>
                <InputGroup>
                  <Input
                    value={projectSearch}
                    onChange={(e) => handleProjectSearch(e.target.value)}
                    placeholder="Search for project"
                  />
                </InputGroup>
                {projectLoading && <Spinner size="sm" mt={2} />}
                {projectResults.length > 0 && (
                  <Box border="1px" borderColor="gray.200" borderRadius="md" mt={1} maxH="200px" overflowY="auto">
                    {projectResults.map((project) => (
                      <Flex
                        key={project._id}
                        p={2}
                        cursor="pointer"
                        _hover={{ bg: 'gray.50' }}
                        onClick={() => handleSelectProject(project._id, project.name)}
                      >
                        <Text>{project.name || 'Unnamed Project'}</Text>
                      </Flex>
                    ))}
                  </Box>
                )}
                {projectResults.length === 0 && projectSearch && !projectLoading && (
                  <Text color="gray.500" fontSize="sm" mt={1}>
                    {console.log(projectResults, projectSearch, projectLoading)}
                    No projects found matching '{projectSearch}'
                  </Text>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Status</FormLabel>
                <Select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  placeholder="Select status"
                >
                  {statuses.map((status) => (
                    <option key={status.name} value={status.name}>
                      {status.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Priority</FormLabel>
                <Select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  placeholder="Select priority"
                >
                  {priorities.map((priority) => (
                    <option key={priority.name} value={priority.name}>
                      {priority.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Type</FormLabel>
                <Select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  placeholder="Select type"
                >
                  {types.map((type) => (
                    <option key={type.name} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Assignee</FormLabel>
                <InputGroup>
                  <InputLeftElement>
                    <FaUser />
                  </InputLeftElement>
                  <Input
                    value={userSearch}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    placeholder="Search for user to assign"
                    autoComplete="off"
                    bg="white"
                  />
                </InputGroup>
                {assigneeLoading && <Spinner size="sm" mt={2} />}
                {userResults.length > 0 && (
                  <Box 
                    border="1px" 
                    borderColor="gray.200" 
                    borderRadius="md" 
                    mt={1} 
                    maxH="200px" 
                    overflowY="auto"
                    boxShadow="lg"
                    zIndex="10"
                    position="relative"
                    bg="white"
                  >
                    {userResults.map((user) => (
                      <Flex
                        key={user._id}
                        p={2}
                        cursor="pointer"
                        _hover={{ bg: 'blue.50' }}
                        onClick={() => handleAssignUser(user._id, user.name)}
                        alignItems="center"
                        borderBottom="1px"
                        borderColor="gray.100"
                      >
                        <Avatar size="sm" name={user.name} src={user.avatar} mr={2} />
                        <Text fontWeight={user.name.toLowerCase().startsWith(userSearch.toLowerCase()) ? "bold" : "normal"}>
                          {user.name}
                        </Text>
                      </Flex>
                    ))}
                  </Box>
                )}
                {userResults.length === 0 && userSearch && !assigneeLoading && (
                  <Text color="gray.500" fontSize="sm" mt={1}>
                    No users found matching '{userSearch}'
                  </Text>
                )}
                {form.assignee && (
                  <Tag mt={2} size="md" variant="solid" colorScheme="blue">
                    <Avatar size="xs" name={userSearch} mr={1} />
                    <TagLabel>Assigned to: {userSearch}</TagLabel>
                    <TagCloseButton onClick={handleUnassign} aria-label="Remove assignee" />
                  </Tag>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={6}
                />
              </FormControl>

              <HStack spacing={4}>
                <Button
                  variant="outline"
                  onClick={() => navigate('/tickets')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  leftIcon={<FaSave />}
                  isLoading={saving}
                  loadingText="Saving..."
                >
                  Save Changes
                </Button>
              </HStack>
            </Stack>
          </Box>
        </Box>

        {ticket && (
          <Box>
            <Heading size="md" mb={4}>
              Ticket Information
            </Heading>
            <Stack spacing={3}>
              <Box>
                <Text fontWeight="bold">Ticket Number:</Text>
                <Text>{ticket.ticketNumber}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Created By:</Text>
                <Text>{ticket.reporter?.name || 'Unknown'}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Created At:</Text>
                <Text>{new Date(ticket.createdAt).toLocaleString()}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Last Updated:</Text>
                <Text>{new Date(ticket.updatedAt).toLocaleString()}</Text>
              </Box>
              <Divider />
              <Box>
                <Text fontWeight="bold">Status:</Text>
                {getStatusBadge(ticket.status)}
              </Box>
              <Box>
                <Text fontWeight="bold">Priority:</Text>
                {getPriorityBadge(ticket.priority)}
              </Box>
              <Box>
                <Text fontWeight="bold">Type:</Text>
                {getTypeBadge(ticket.type)}
              </Box>
              <Box>
                <Text fontWeight="bold">Assignee:</Text>
                <Text>{ticket.assignee?.name || 'Unassigned'}</Text>
              </Box>
            </Stack>
          </Box>
        )}
      </Grid>
    </Box>
  );
    // </Box>
  
};

export default TicketDetail;