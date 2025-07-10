import React, { useEffect, useState } from 'react';
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
} from '@chakra-ui/react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [form, setForm] = useState({
    name: '',
    key: '',
    description: '',
    team: '',
    category: '',
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

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

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Create project
  const handleCreate = async () => {
    try {
      await api.post('/projects', form);
      toast({ title: 'Project created', status: 'success' });
      onClose();
      setForm({ name: '', key: '', description: '', team: '', category: '' });
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

  if (loading) return <Spinner size="xl" />;
  if (error) return <Box color="red.500">{error}</Box>;

  return (
    <Box p={6}>
      <Button
        colorScheme="blue"
        mb={4}
        onClick={() => {
          setSelectedProject(null);
          onOpen();
        }}
      >
        Create Project
      </Button>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Key</Th>
            <Th>Team</Th>
            <Th>Category</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {projects.map((project) => (
            <Tr key={project._id}>
              <Td>{project.name}</Td>
              <Td>{project.key}</Td>
              <Td>{project.team?.name}</Td>
              <Td>{project.category}</Td>
              <Td>
                <Button
                  size="sm"
                  onClick={() => handleView(project)}
                  colorScheme="teal"
                >
                  View
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Modal for create/view project */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedProject ? 'Project Details' : 'Create Project'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedProject ? (
              <Box>
                <Box>
                  <b>Name:</b> {selectedProject.name}
                </Box>
                <Box>
                  <b>Key:</b> {selectedProject.key}
                </Box>
                <Box>
                  <b>Description:</b> {selectedProject.description}
                </Box>
                <Box>
                  <b>Team:</b> {selectedProject.team?.name}
                </Box>
                <Box>
                  <b>Category:</b> {selectedProject.category}
                </Box>
                <Box>
                  <b>Owner:</b> {selectedProject.owner?.name}
                </Box>
                <Box>
                  <b>Members:</b>{' '}
                  {selectedProject.members
                    ?.map((m) => m.user?.name)
                    .join(', ')}
                </Box>
              </Box>
            ) : (
              <form>
                <FormControl mb={2}>
                  <FormLabel>Name</FormLabel>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                  />
                </FormControl>
                <FormControl mb={2}>
                  <FormLabel>Key</FormLabel>
                  <Input
                    name="key"
                    value={form.key}
                    onChange={handleChange}
                  />
                </FormControl>
                <FormControl mb={2}>
                  <FormLabel>Description</FormLabel>
                  <Input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                  />
                </FormControl>
                <FormControl mb={2}>
                  <FormLabel>Team (ID)</FormLabel>
                  <Input
                    name="team"
                    value={form.team}
                    onChange={handleChange}
                  />
                </FormControl>
                <FormControl mb={2}>
                  <FormLabel>Category</FormLabel>
                  <Select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    <option value="">Select</option>
                    <option value="software">Software</option>
                    <option value="business">Business</option>
                  </Select>
                </FormControl>
              </form>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedProject ? null : (
              <Button
                colorScheme="blue"
                mr={3}
                onClick={handleCreate}
                isLoading={loading}
              >
                Create
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Projects;
