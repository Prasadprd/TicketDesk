import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Box, Button, Table, Thead, Tbody, Tr, Th, Td, Spinner, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, useDisclosure } from '@chakra-ui/react';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    const fetchTeams = async () => {
      setLoading(true);
      try {
        const res = await api.get('/teams');
        setTeams(res.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load teams');
      }
      setLoading(false);
    };
    fetchTeams();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    try {
      await api.post('/teams', form);
      toast({ title: 'Team created', status: 'success' });
      onClose();
      setForm({ name: '', description: '' });
      const res = await api.get('/teams');
      setTeams(res.data);
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed to create team', status: 'error' });
    }
  };

  const handleView = (team) => {
    setSelectedTeam(team);
    onOpen();
  };

  if (loading) return <Spinner size="xl" />;
  if (error) return <Box color="red.500">{error}</Box>;

  return (
    <Box p={6}>
      <Button colorScheme="blue" mb={4} onClick={() => { setSelectedTeam(null); onOpen(); }}>Create Team</Button>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Description</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {teams.map((team) => (
            <Tr key={team._id}>
              <Td>{team.name}</Td>
              <Td>{team.description}</Td>
              <Td>
                <Button size="sm" onClick={() => handleView(team)} colorScheme="teal">View</Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedTeam ? 'Team Details' : 'Create Team'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTeam ? (
              <Box>
                <Box><b>Name:</b> {selectedTeam.name}</Box>
                <Box><b>Description:</b> {selectedTeam.description}</Box>
                <Box><b>Owner:</b> {selectedTeam.owner?.name}</Box>
                <Box><b>Members:</b> {selectedTeam.members?.map(m => m.user?.name).join(', ')}</Box>
              </Box>
            ) : (
              <form>
                <FormControl mb={2}>
                  <FormLabel>Name</FormLabel>
                  <Input name="name" value={form.name} onChange={handleChange} />
                </FormControl>
                <FormControl mb={2}>
                  <FormLabel>Description</FormLabel>
                  <Input name="description" value={form.description} onChange={handleChange} />
                </FormControl>
              </form>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedTeam ? null : (
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

export default Teams;
