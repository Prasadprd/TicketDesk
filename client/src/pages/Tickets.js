import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Box, Button, Table, Thead, Tbody, Tr, Th, Td, Spinner, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, Select, useDisclosure } from '@chakra-ui/react';

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', project: '', type: '', priority: '', status: '' });
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
    onOpen();
  };

  if (loading) return <Spinner size="xl" />;
  if (error) return <Box color="red.500">{error}</Box>;

  return (
    <Box p={6}>
      <Button colorScheme="blue" mb={4} onClick={() => { setSelectedTicket(null); onOpen(); }}>Create Ticket</Button>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Title</Th>
            <Th>Project</Th>
            <Th>Status</Th>
            <Th>Priority</Th>
            <Th>Type</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {tickets.map((ticket) => (
            <Tr key={ticket._id}>
              <Td>{ticket.title}</Td>
              <Td>{ticket.project?.name}</Td>
              <Td>{ticket.status}</Td>
              <Td>{ticket.priority}</Td>
              <Td>{ticket.type}</Td>
              <Td>
                <Button size="sm" onClick={() => handleView(ticket)} colorScheme="teal">View</Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedTicket ? 'Ticket Details' : 'Create Ticket'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTicket ? (
              <Box>
                <Box><b>Title:</b> {selectedTicket.title}</Box>
                <Box><b>Description:</b> {selectedTicket.description}</Box>
                <Box><b>Project:</b> {selectedTicket.project?.name}</Box>
                <Box><b>Status:</b> {selectedTicket.status}</Box>
                <Box><b>Priority:</b> {selectedTicket.priority}</Box>
                <Box><b>Type:</b> {selectedTicket.type}</Box>
                <Box><b>Assignee:</b> {selectedTicket.assignee?.name}</Box>
              </Box>
            ) : (
              <form>
                <FormControl mb={2}>
                  <FormLabel>Title</FormLabel>
                  <Input name="title" value={form.title} onChange={handleChange} />
                </FormControl>
                <FormControl mb={2}>
                  <FormLabel>Description</FormLabel>
                  <Input name="description" value={form.description} onChange={handleChange} />
                </FormControl>
                <FormControl mb={2}>
                  <FormLabel>Project</FormLabel>
                  <Select name="project" value={form.project} onChange={e => {
                    handleChange(e);
                    // Update status/priority/type options when project changes
                    const selected = projectOptions.find(p => p._id === e.target.value);
                    setStatusOptions(selected?.ticketStatuses || []);
                    setPriorityOptions(selected?.ticketPriorities || []);
                    setTypeOptions(selected?.ticketTypes || []);
                  }}>
                    <option value="">Select a project</option>
                    {projectOptions.map(project => (
                      <option key={project._id} value={project._id}>{project.name}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl mb={2}>
                  <FormLabel>Status</FormLabel>
                  <Select name="status" value={form.status} onChange={handleChange}>
                    <option value="">Select status</option>
                    {statusOptions.map(opt => (
                      <option key={opt.name} value={opt.name}>{opt.name}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl mb={2}>
                  <FormLabel>Priority</FormLabel>
                  <Select name="priority" value={form.priority} onChange={handleChange}>
                    <option value="">Select priority</option>
                    {priorityOptions.map(opt => (
                      <option key={opt.name} value={opt.name}>{opt.name}</option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl mb={2}>
                  <FormLabel>Type</FormLabel>
                  <Select name="type" value={form.type} onChange={handleChange}>
                    <option value="">Select type</option>
                    {typeOptions.map(opt => (
                      <option key={opt.name} value={opt.name}>{opt.name}</option>
                    ))}
                  </Select>
                </FormControl>
              </form>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedTicket ? null : (
              <Button colorScheme="blue" mr={3} onClick={handleCreate}>
                Create
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Tickets;
