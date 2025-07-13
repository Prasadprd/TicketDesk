import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Box, Button, Table, Thead, Tbody, Tr, Th, Td, Spinner, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, useDisclosure, Heading, Text, Flex, Icon, Textarea, Avatar, Tag, TagLabel, Alert, AlertIcon } from '@chakra-ui/react';
import { FaUsers, FaPlus, FaEye, FaUser } from 'react-icons/fa';
import './Teams.css';

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

  // Helper function to get team member initials
  const getTeamInitials = (name) => {
    if (!name) return "TM";
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Box className="teams-container">
      <Box className="teams-header">
        <Heading as="h1" className="teams-title">Teams</Heading>
        <Button 
          leftIcon={<FaPlus />} 
          colorScheme="brand" 
          onClick={() => { setSelectedTeam(null); onOpen(); }}
        >
          Create Team
        </Button>
      </Box>
      
      <Box className="teams-table-container">
        <Table variant="simple" className="teams-table">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Description</Th>
              <Th>Owner</Th>
              <Th>Members</Th>
              <Th width="100px">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {teams.length > 0 ? teams.map((team) => (
              <Tr key={team._id}>
                <Td fontWeight="medium">{team.name}</Td>
                <Td>{team.description}</Td>
                <Td>
                  <Flex align="center">
                    <Icon as={FaUser} color="gray.500" mr={2} />
                    <Text>{team.owner?.name || 'Not assigned'}</Text>
                  </Flex>
                </Td>
                <Td>
                  <Text>{team.members?.length || 0} members</Text>
                </Td>
                <Td>
                  <Button 
                    size="sm" 
                    onClick={() => handleView(team)} 
                    colorScheme="teal"
                    variant="outline"
                    leftIcon={<FaEye />}
                  >
                    View
                  </Button>
                </Td>
              </Tr>
            )) : (
              <Tr>
                <Td colSpan={5} textAlign="center" py={6}>
                  <Text color="gray.500">No teams found</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>
      {/* Team Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent className="team-modal-content">
          <ModalHeader>
            <Flex align="center">
              <Icon as={FaUsers} mr={2} color="brand.500" />
              {selectedTeam ? 'Team Details' : 'Create Team'}
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTeam ? (
              <Box>
                <Box className="team-detail-item">
                  <Text className="team-detail-label">Name</Text>
                  <Text className="team-detail-value" fontWeight="medium">{selectedTeam.name}</Text>
                </Box>
                
                <Box className="team-detail-item">
                  <Text className="team-detail-label">Description</Text>
                  <Text className="team-detail-value">{selectedTeam.description}</Text>
                </Box>
                
                <Box className="team-detail-item">
                  <Text className="team-detail-label">Owner</Text>
                  <Flex align="center">
                    <Avatar size="sm" name={selectedTeam.owner?.name} mr={2} bg="brand.500" />
                    <Text className="team-detail-value">{selectedTeam.owner?.name || 'Not assigned'}</Text>
                  </Flex>
                </Box>
                
                <Box className="team-detail-item">
                  <Text className="team-detail-label">Members ({selectedTeam.members?.length || 0})</Text>
                  {selectedTeam.members && selectedTeam.members.length > 0 ? (
                    <Box className="team-members-list">
                      {selectedTeam.members.map(member => (
                        <Tag key={member.user?._id} size="md" borderRadius="full" variant="subtle" colorScheme="blue">
                          <Avatar
                            size="xs"
                            name={member.user?.name}
                            ml={-1}
                            mr={2}
                          />
                          <TagLabel>{member.user?.name}</TagLabel>
                        </Tag>
                      ))}
                    </Box>
                  ) : (
                    <Text color="gray.500">No members in this team</Text>
                  )}
                </Box>
              </Box>
            ) : (
              <form className="team-form-container">
                <FormControl>
                  <FormLabel>Team Name</FormLabel>
                  <Input 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    placeholder="Enter team name"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea 
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    placeholder="Enter team description"
                    rows={4}
                  />
                </FormControl>
              </form>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedTeam ? (
              <Button variant="ghost" onClick={onClose}>Close</Button>
            ) : (
              <>
                <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
                <Button 
                  colorScheme="brand" 
                  onClick={handleCreate}
                  leftIcon={<FaPlus />}
                  isDisabled={!form.name}
                >
                  Create Team
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Teams;
