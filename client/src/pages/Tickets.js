import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Box, Button, Table, Thead, Tbody, Tr, Th, Td, Spinner, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, Select, useDisclosure, Heading, Text, Flex, Badge, Textarea, InputGroup, InputLeftElement, Icon, Tag, TagLabel, Divider } from '@chakra-ui/react';
import { FaSearch, FaTicketAlt, FaFilter, FaPlus, FaUser, FaProjectDiagram, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import './Tickets.css';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', project: '', type: '', priority: '', status: '', assignee: '' });
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [assigneeLoading, setAssigneeLoading] = useState(false);
  // Search users for assignment
  const handleUserSearch = async (name) => {
    setUserSearch(name);
    if (!name || !form.project) {
      setUserResults([]);
      return;
    }
    setAssigneeLoading(true);
    try {
      const res = await api.get(`/users/search?name=${encodeURIComponent(name)}&project=${form.project}`);
      setUserResults(res.data);
    } catch (err) {
      setUserResults([]);
    }
    setAssigneeLoading(false);
  };
  const [projects, setProjects] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [priorityOptions, setPriorityOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const res = await api.get('/tickets');
        setTickets(res.data.tickets || res.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tickets');
      }
      setLoading(false);
    };
    fetchTickets();
  }, []);

  // Fetch projects and their ticket options for dropdowns
  useEffect(() => {
    const fetchProjectsAndOptions = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data.tickets || res.data);
        setProjectOptions(res.data);
        // Use the first project for default options
        if (res.data.length > 0) {
          const project = res.data[0];
          setStatusOptions(project.ticketStatuses || []);
          setPriorityOptions(project.ticketPriorities || []);
          setTypeOptions(project.ticketTypes || []);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchProjectsAndOptions();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    // Validate required fields
    if (!form.title || !form.description || !form.project || !form.status || !form.priority || !form.type) {
      toast({ title: 'Please fill all fields', status: 'error' });
      return;
    }
    try {
      console.log('Submitting ticket:', form);
      await api.post('/tickets', form);
      toast({ title: 'Ticket created', status: 'success' });
      onClose();
      setForm({ title: '', description: '', project: '', type: '', priority: '', status: '' });
      const res = await api.get('/tickets');
      setTickets(res.data.tickets || res.data);
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed to create ticket', status: 'error' });
    }
  };

  const handleView = (ticket) => {
    setSelectedTicket(ticket);
    setUserSearch('');
    setUserResults([]);
    onOpen();
  };

  const handleAssign = async (ticketId, userId) => {
    try {
      await api.put(`/tickets/${ticketId}/assign`, { userId });
      const res = await api.get('/tickets');
      setTickets(res.data.tickets || res.data);
      // Update the selected ticket if it's open
      if (selectedTicket && selectedTicket._id === ticketId) {
        const updatedTicket = (res.data.tickets || res.data).find(t => t._id === ticketId);
        setSelectedTicket(updatedTicket);
      }
      toast({ title: userId ? 'Ticket assigned successfully' : 'Ticket unassigned successfully', status: 'success' });
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed to assign ticket', status: 'error' });
    }
  };

  if (loading) return (
    <Flex justify="center" align="center" height="80vh">
      <Spinner size="xl" thickness="4px" speed="0.65s" color="brand.500" />
    </Flex>
  );
  
  if (error) return (
    <Box p={6}>
      <Box bg="red.50" color="red.500" p={4} borderRadius="md" borderLeft="4px solid" borderLeftColor="red.500">
        <Flex align="center">
          <Icon as={FaExclamationCircle} mr={2} />
          <Text fontWeight="medium">{error}</Text>
        </Flex>
      </Box>
    </Box>
  );

  // Helper function to get status badge styling
  const getStatusBadge = (status) => {
    let colorScheme = "blue";
    if (status.toLowerCase().includes("progress")) colorScheme = "yellow";
    if (status.toLowerCase().includes("resolved") || status.toLowerCase().includes("done")) colorScheme = "green";
    if (status.toLowerCase().includes("closed")) colorScheme = "gray";
    
    return (
      <Badge colorScheme={colorScheme} borderRadius="full" px={2} py={1}>
        {status}
      </Badge>
    );
  };
  
  // Helper function to get priority styling
  const getPriorityBadge = (priority) => {
    let colorScheme = "blue";
    if (priority.toLowerCase().includes("medium")) colorScheme = "orange";
    if (priority.toLowerCase().includes("high") || priority.toLowerCase().includes("critical")) colorScheme = "red";
    
    return (
      <Badge colorScheme={colorScheme} variant="subtle">
        {priority}
      </Badge>
    );
  };

  return (
    <Box className="tickets-container" p={6}>
      <Box className="tickets-header">
        <Heading as="h1" className="tickets-title">Tickets</Heading>
        <Button 
          leftIcon={<FaPlus />} 
          colorScheme="brand" 
          onClick={() => { setSelectedTicket(null); onOpen(); }}
        >
          Create Ticket
        </Button>
      </Box>
      
      <Box className="tickets-table-container">
        <Table variant="simple" className="tickets-table">
          <Thead>
            <Tr>
              <Th>Title</Th>
              <Th>Project</Th>
              <Th>Status</Th>
              <Th>Priority</Th>
              <Th>Type</Th>
              <Th>Assignee</Th>
              <Th width="100px">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tickets.length > 0 ? tickets.map((ticket) => (
              <Tr key={ticket._id}>
                <Td fontWeight="medium">{ticket.title}</Td>
                <Td>
                  <Flex align="center">
                    <Icon as={FaProjectDiagram} color="gray.500" mr={2} />
                    <Text>{ticket.project?.name}</Text>
                  </Flex>
                </Td>
                <Td>{getStatusBadge(ticket.status)}</Td>
                <Td>{getPriorityBadge(ticket.priority)}</Td>
                <Td>
                  <Tag size="sm" variant="subtle" colorScheme="purple">
                    <TagLabel>{ticket.type}</TagLabel>
                  </Tag>
                </Td>
                <Td>
                  {ticket.assignee ? (
                    <Flex align="center">
                      <Icon as={FaUser} color="gray.500" mr={2} />
                      <Text>{ticket.assignee.name}</Text>
                    </Flex>
                  ) : (
                    <Text color="gray.500" fontSize="sm">Unassigned</Text>
                  )}
                </Td>
                <Td>
                  <Button 
                    size="sm" 
                    onClick={() => handleView(ticket)} 
                    colorScheme="teal"
                    variant="outline"
                    leftIcon={<FaTicketAlt />}
                  >
                    View
                  </Button>
                </Td>
              </Tr>
            )) : (
              <Tr>
                <Td colSpan={7} textAlign="center" py={6}>
                  <Text color="gray.500">No tickets found</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
      
      {/* Ticket Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent className="ticket-modal-content">
          <ModalHeader>
            <Flex align="center">
              <Icon as={FaTicketAlt} mr={2} color="brand.500" />
              {selectedTicket ? 'Ticket Details' : 'Create New Ticket'}
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTicket ? (
              <Box>
                <Box className="ticket-detail-item">
                  <Text className="ticket-detail-label">Title</Text>
                  <Text className="ticket-detail-value" fontWeight="medium">{selectedTicket.title}</Text>
                </Box>
                
                <Box className="ticket-detail-item">
                  <Text className="ticket-detail-label">Description</Text>
                  <Box className="ticket-description">{selectedTicket.description}</Box>
                </Box>
                
                <Flex flexWrap="wrap" gap={4} mb={4}>
                  <Box className="ticket-detail-item" flex="1" minW="150px">
                    <Text className="ticket-detail-label">Project</Text>
                    <Flex align="center">
                      <Icon as={FaProjectDiagram} color="gray.500" mr={2} />
                      <Text>{selectedTicket.project?.name}</Text>
                    </Flex>
                  </Box>
                  
                  <Box className="ticket-detail-item" flex="1" minW="150px">
                    <Text className="ticket-detail-label">Status</Text>
                    {getStatusBadge(selectedTicket.status)}
                  </Box>
                  
                  <Box className="ticket-detail-item" flex="1" minW="150px">
                    <Text className="ticket-detail-label">Priority</Text>
                    {getPriorityBadge(selectedTicket.priority)}
                  </Box>
                  
                  <Box className="ticket-detail-item" flex="1" minW="150px">
                    <Text className="ticket-detail-label">Type</Text>
                    <Tag size="md" variant="subtle" colorScheme="purple">
                      <TagLabel>{selectedTicket.type}</TagLabel>
                    </Tag>
                  </Box>
                </Flex>
                
                <Divider my={4} />
                
                <Box className="ticket-assignee-section">
                  <Text className="ticket-detail-label" mb={3}>Assignee</Text>
                  
                  <InputGroup mb={3}>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FaSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search user by name"
                      value={userSearch}
                      onChange={e => handleUserSearch(e.target.value)}
                    />
                  </InputGroup>
                  
                  {assigneeLoading && <Spinner size="sm" ml={2} />}
                  
                  {userResults.length > 0 && (
                    <Select
                      value={selectedTicket.assignee?._id || ''}
                      onChange={e => handleAssign(selectedTicket._id, e.target.value || null)}
                      placeholder="Select user to assign"
                      mb={3}
                    >
                      <option value="">Unassign</option>
                      {userResults.map(u => (
                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                      ))}
                    </Select>
                  )}
                  
                  <Flex align="center" bg="gray.50" p={3} borderRadius="md">
                    <Icon as={FaUser} color="gray.500" mr={2} />
                    <Box>
                      <Text fontWeight="medium">Current Assignee</Text>
                      <Text>{selectedTicket.assignee?.name || 'Unassigned'}</Text>
                    </Box>
                  </Flex>
                </Box>
              </Box>
            ) : (
              <form>
                <Box className="ticket-form-grid">
                  <FormControl className="ticket-form-full" mb={4}>
                    <FormLabel>Title</FormLabel>
                    <Input name="title" value={form.title} onChange={handleChange} placeholder="Enter ticket title" />
                  </FormControl>
                  
                  <FormControl className="ticket-form-full" mb={4}>
                    <FormLabel>Description</FormLabel>
                    <Textarea 
                      name="description" 
                      value={form.description} 
                      onChange={handleChange} 
                      placeholder="Enter ticket description"
                      rows={4}
                    />
                  </FormControl>
                  
                  <FormControl mb={4}>
                    <FormLabel>Project</FormLabel>
                    <Select 
                      name="project" 
                      value={form.project} 
                      onChange={e => {
                        handleChange(e);
                        // Update status/priority/type options when project changes
                        const selected = projectOptions.find(p => p._id === e.target.value);
                        setStatusOptions(selected?.ticketStatuses || []);
                        setPriorityOptions(selected?.ticketPriorities || []);
                        setTypeOptions(selected?.ticketTypes || []);
                      }}
                      placeholder="Select a project"
                    >
                      {projectOptions.map(project => (
                        <option key={project._id} value={project._id}>{project.name}</option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl mb={4}>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      name="status" 
                      value={form.status} 
                      onChange={handleChange}
                      placeholder="Select status"
                      isDisabled={!form.project}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt.name} value={opt.name}>{opt.name}</option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl mb={4}>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      name="priority" 
                      value={form.priority} 
                      onChange={handleChange}
                      placeholder="Select priority"
                      isDisabled={!form.project}
                    >
                      {priorityOptions.map(opt => (
                        <option key={opt.name} value={opt.name}>{opt.name}</option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl mb={4}>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      name="type" 
                      value={form.type} 
                      onChange={handleChange}
                      placeholder="Select type"
                      isDisabled={!form.project}
                    >
                      {typeOptions.map(opt => (
                        <option key={opt.name} value={opt.name}>{opt.name}</option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl className="ticket-form-full" mb={4}>
                    <FormLabel>Assign To</FormLabel>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={FaSearch} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Search user by name"
                        value={userSearch}
                        onChange={e => handleUserSearch(e.target.value)}
                        isDisabled={!form.project}
                      />
                    </InputGroup>
                    {assigneeLoading && <Spinner size="sm" ml={2} mt={2} />}
                    {userResults.length > 0 && (
                      <Select
                        name="assignee"
                        value={form.assignee}
                        onChange={e => setForm({ ...form, assignee: e.target.value })}
                        placeholder="Select user to assign"
                        mt={2}
                      >
                        {userResults.map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                        ))}
                      </Select>
                    )}
                  </FormControl>
                </Box>
              </form>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedTicket ? (
              <Button variant="ghost" onClick={onClose}>Close</Button>
            ) : (
              <>
                <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                <Button 
                  colorScheme="brand" 
                  onClick={handleCreate}
                  leftIcon={<FaPlus />}
                  isDisabled={!form.title || !form.description || !form.project || !form.status || !form.priority || !form.type}
                >
                  Create Ticket
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Tickets;
