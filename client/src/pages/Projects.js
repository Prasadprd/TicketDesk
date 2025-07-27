import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  TabPanel,
  TabPanels,
  Tab,
  Tabs,
  TabList,
  Heading,
  Text,
  Flex,
  Badge,
  Avatar,
  Textarea,
  Icon,
  Tooltip,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaPlus, FaEye, FaUsers, FaProjectDiagram, FaTicketAlt, FaClipboardList } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

// Import CSS
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [projectTickets, setProjectTickets] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const res = await api.get('/projects');
        setProjects(res.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load projects');
      }
      setLoading(false);
    };
    fetchProjects();
  }, []);

  // Teams functionality has been removed

  // Fetch project statistics and tickets
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (selectedProject) {
        try {
          // Fetch project stats
          const statsRes = await api.get(
            `/projects/${selectedProject._id}/stats`
          );
          setProjectStats(statsRes.data);

          // Fetch project tickets
          const ticketsRes = await api.get(
            `/projects/${selectedProject._id}/tickets`
          );
          setProjectTickets(ticketsRes.data);
        } catch (err) {
          console.error('Error fetching project details:', err);
        }
      }
    };
    fetchProjectDetails();
  }, [selectedProject]);


  // Form state for creating a project
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
  });

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create project
  const handleCreate = async () => {
    try {
      console.log("from create project", form);
      await api.post('/projects', form);
      toast({ title: 'Project created', status: 'success' });
      onClose();
      setForm({ name: '', description: '', category: '' });
      // Refresh list
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      toast({
        title: err.response?.data?.message || 'Failed to create project',
        status: 'error',
      });
    }
  };

  // View project details
  const handleView = (project) => {
    setSelectedProject(project);
    onOpen();
  };

  const handleTicketClick = (ticketId) => {
    navigate(`/tickets/${ticketId}`);
  };

  const canCreateProject = () => {
    // console.log('Inside create project, user:', user.role);
    
    return (user && (user.role === 'admin' || user.role === 'developer'));
  }

  if (loading) return (
    <Flex justify="center" align="center" height="50vh">
      <Spinner size="xl" thickness="4px" color="brand.500" />
    </Flex>
  );
  if (error) return (
    <Alert status="error" variant="left-accent" borderRadius="md" m={6}>
      <AlertIcon />
      {error}
    </Alert>
  );

  // Helper function to get category class
  const getCategoryClass = (category) => {
    const categoryMap = {
      'software': 'category-development',
      'business': 'category-operations',
      'marketing': 'category-marketing',
      'design': 'category-design',
      'support': 'category-support'
    };
    return categoryMap[category?.toLowerCase()] || 'category-development';
  };

  return (
    <Box className="projects-container">
      <Flex className="projects-header">
        <Heading className="projects-title" size="lg">
          <Flex align="center">
            <Icon as={FaProjectDiagram} mr={2} color="brand.500" />
            Projects
          </Flex>
        </Heading>
        {canCreateProject() && (
          <Button
            leftIcon={<FaPlus />}
            colorScheme="brand"
            onClick={() => {
              setSelectedProject(null);
              onOpen();
            }}
          >
            Create Project
          </Button>
        )}
      </Flex>

      {projects.length === 0 ? (
        <Alert status="info" variant="subtle" borderRadius="md" mt={4}>
          <AlertIcon />
          No projects found. {canCreateProject() ? 'Create your first project to get started!' : 'Projects will appear here once they are created.'}
        </Alert>
      ) : (
        <Table variant="simple" className="projects-table">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Key</Th>
              <Th>Owner</Th>
              <Th>Category</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {projects.map((project) => (
              <Tr key={project._id}>
                <Td fontWeight="500">{project.name}</Td>
                <Td>
                  <span className="project-key">{project.key}</span>
                </Td>
                <Td>
                  {project.owner ? (
                    <div className="project-owner">
                      <Avatar size="xs" name={project.owner.name} src={project.owner.avatar} mr={2} />
                      {project.owner.name}
                    </div>
                  ) : (
                    <Text color="gray.500">—</Text>
                  )}
                </Td>
                <Td>
                  {project.category ? (
                    <span className={`project-category ${getCategoryClass(project.category)}`}>
                      {project.category}
                    </span>
                  ) : (
                    <Text color="gray.500">—</Text>
                  )}
                </Td>
                <Td>
                  <Button
                    size="sm"
                    onClick={() => handleView(project)}
                    colorScheme="brand"
                    leftIcon={<FaEye />}
                  >
                    View
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Modal for create/view project */}
      <Modal isOpen={isOpen} onClose={onClose} size={selectedProject ? "xl" : "md"}>
        <ModalOverlay />
        <ModalContent className="project-modal-content">
          <ModalHeader className="project-modal-header">
            {selectedProject ? (
              <Flex align="center">
                <Icon as={FaProjectDiagram} mr={2} color="brand.500" />
                {selectedProject.name}
              </Flex>
            ) : (
              <Flex align="center">
                <Icon as={FaPlus} mr={2} color="brand.500" />
                Create New Project
              </Flex>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody className="project-modal-body">
            {selectedProject ? (
              <Box>
                <Flex wrap="wrap" gap={6}>
                  <Box className="project-detail-section" flex="1" minW="250px">
                    <div className="project-detail-title">Project Key</div>
                    <div className="project-detail-content">
                      <span className="project-key">{selectedProject.key}</span>
                    </div>
                  </Box>
                  
                  <Box className="project-detail-section" flex="1" minW="250px">
                    <div className="project-detail-title">Category</div>
                    <div className="project-detail-content">
                      {selectedProject.category ? (
                        <span className={`project-category ${getCategoryClass(selectedProject.category)}`}>
                          {selectedProject.category}
                        </span>
                      ) : (
                        <Text color="gray.500">Not specified</Text>
                      )}
                    </div>
                  </Box>
                </Flex>
                
                <Box className="project-detail-section">
                  <div className="project-detail-title">Description</div>
                  <div className="project-detail-content">
                    {selectedProject.description || <Text color="gray.500">No description provided</Text>}
                  </div>
                </Box>
                
                <Box className="project-detail-section" flex="1" minW="250px">
                  <div className="project-detail-title">Owner</div>
                  <div className="project-detail-content">
                    {selectedProject.owner ? (
                      <div className="project-owner">
                        <Avatar size="sm" name={selectedProject.owner.name} src={selectedProject.owner.avatar} mr={2} />
                        {selectedProject.owner.name}
                      </div>
                    ) : (
                      <Text color="gray.500">No owner assigned</Text>
                    )}
                  </div>
                </Box>
                
                <Box className="project-detail-section">
                  <div className="project-detail-title">Members</div>
                  <div className="project-detail-content">
                    {selectedProject.members?.length > 0 ? (
                      <Flex wrap="wrap" gap={2}>
                        {selectedProject.members.map((member, index) => (
                          <Badge key={index} colorScheme="brand" borderRadius="full" px={2} py={1}>
                            {member.user?.name}
                          </Badge>
                        ))}
                      </Flex>
                    ) : (
                      <Text color="gray.500">No members assigned</Text>
                    )}
                  </div>
                </Box>

                {/* Project statistics */}
                <Box className="project-detail-section" mt={6}>
                  <Heading size="sm" mb={3}>
                    <Flex align="center">
                      <Icon as={FaClipboardList} mr={2} color="brand.500" />
                      Project Statistics
                    </Flex>
                  </Heading>
                  <div className="project-stats">
                    <div className="stat-card">
                      <div className="stat-label">Total Tickets</div>
                      <div className="stat-value">{projectStats?.totalTickets || 0}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Open Tickets</div>
                      <div className="stat-value">{projectStats?.openTickets || 0}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Closed Tickets</div>
                      <div className="stat-value">{projectStats?.closedTickets || 0}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Assigned</div>
                      <div className="stat-value">
                        {projectStats?.assignedTickets || (projectTickets.filter(t => t.assignee).length)}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Unassigned</div>
                      <div className="stat-value">
                        {projectStats?.unassignedTickets || (projectTickets.filter(t => !t.assignee).length)}
                      </div>
                    </div>
                  </div>
                </Box>

                {/* Project tickets */}
                <Box className="project-detail-section" mt={6}>
                  <Heading size="sm" mb={3}>
                    <Flex align="center">
                      <Icon as={FaTicketAlt} mr={2} color="brand.500" />
                      Project Tickets
                    </Flex>
                  </Heading>
                  
                  {projectTickets.length > 0 ? (
                    <Table variant="simple" className="project-tickets-table">
                      <Thead>
                        <Tr>
                          <Th>Title</Th>
                          <Th>Status</Th>
                          <Th>Priority</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {projectTickets.map((ticket) => (
                          <Tr key={ticket._id}>
                            <Td fontWeight="500">{ticket.title}</Td>
                            <Td>
                              <span className={`status-badge status-${ticket.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                {ticket.status}
                              </span>
                            </Td>
                            <Td>
                              <span className={`priority-badge priority-${ticket.priority?.toLowerCase()}`}>
                                {ticket.priority}
                              </span>
                            </Td>
                            <Td>
                              <Button
                                size="sm"
                                onClick={() => handleTicketClick(ticket._id)}
                                colorScheme="brand"
                                variant="outline"
                                leftIcon={<FaEye />}
                              >
                                View
                              </Button>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Alert status="info" variant="subtle" borderRadius="md">
                      <AlertIcon />
                      No tickets found for this project.
                    </Alert>
                  )}
                </Box>
              </Box>
            ) : (
              <form>
                <FormControl className="project-form-group">
                  <FormLabel className="project-form-label">Project Name*</FormLabel>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter project name"
                    className="project-form-input"
                    required
                  />
                </FormControl>
                
                <FormControl className="project-form-group">
                  <FormLabel className="project-form-label">Description</FormLabel>
                  <Textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Enter project description"
                    className="project-form-input"
                    rows={4}
                  />
                </FormControl>
                
                <Alert status="info" mb={4}>
                  <AlertIcon />
                  Project key will be auto-generated based on the project name.
                </Alert>
                
                <FormControl className="project-form-group">
                  <FormLabel className="project-form-label">Category</FormLabel>
                  <Select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="project-form-input"
                  >
                    <option value="">Select category</option>
                    <option value="software">Software</option>
                    <option value="business">Business</option>
                    <option value="marketing">Marketing</option>
                    <option value="design">Design</option>
                    <option value="support">Support</option>
                  </Select>
                </FormControl>
              </form>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedProject ? (
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            ) : (
              <>
                <Button
                  colorScheme="brand"
                  mr={3}
                  onClick={handleCreate}
                  isLoading={loading}
                  leftIcon={<FaPlus />}
                >
                  Create Project
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Projects;
