
import React, { useEffect, useState, useContext } from 'react';
import api from '../api/api';
import {
  Box, Table, Thead, Tbody, Tr, Th, Td, Spinner, Button, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, Select, useDisclosure,
  Heading, Text, Flex, Icon, Badge, Avatar, Alert, AlertIcon
} from '@chakra-ui/react';
import { FaUser, FaUsers, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
  const [isEdit, setIsEdit] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { user } = useContext(AuthContext);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (u) => {
    setSelectedUser(u);
    setEditForm({ name: u.name, email: u.email, role: u.role });
    setIsEdit(true);
    onOpen();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast({ title: 'User deleted', status: 'success' });
      fetchUsers();
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed to delete user', status: 'error' });
    }
  };

  const handleChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await api.put(`/users/${selectedUser._id}`, editForm);
      toast({ title: 'User updated', status: 'success' });
      onClose();
      fetchUsers();
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed to update user', status: 'error' });
    }
  };

  const isAdmin = user && user.role === 'admin';

  // Helper function to get user initials
  const getUserInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Helper function to get role badge styling
  const getRoleBadge = (role) => {
    let className = "user-role-badge user-role-user";
    if (role === "admin") className = "user-role-badge user-role-admin";
    if (role === "developer") className = "user-role-badge user-role-developer";
    
    return (
      <Badge className={className}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
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
    <Box className="users-container">
      <Box className="users-header">
        <Heading as="h1" className="users-title">Users</Heading>
        {isAdmin && (
          <Button 
            leftIcon={<FaPlus />} 
            colorScheme="brand" 
            onClick={() => { /* Add user functionality if needed */ }}
          >
            Add User
          </Button>
        )}
      </Box>
      
      <Box className="users-table-container">
        <Table variant="simple" className="users-table">
          <Thead>
            <Tr>
              <Th>User</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              {isAdmin && <Th width="150px">Actions</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {users.length > 0 ? users.map((u) => (
              <Tr key={u._id}>
                <Td>
                  <Flex align="center">
                    <Avatar 
                      size="sm" 
                      name={u.name} 
                      bg="brand.500" 
                      color="white" 
                      mr={3}
                    />
                    <Text fontWeight="medium">{u.name}</Text>
                  </Flex>
                </Td>
                <Td>{u.email}</Td>
                <Td>{getRoleBadge(u.role)}</Td>
                {isAdmin && (
                  <Td>
                    <Button 
                      size="sm" 
                      colorScheme="blue" 
                      mr={2} 
                      onClick={() => handleEdit(u)}
                      leftIcon={<FaEdit />}
                      variant="outline"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDelete(u._id)}
                      isDisabled={u._id === user._id}
                      leftIcon={<FaTrash />}
                      variant="outline"
                  >
                    Delete
                  </Button>
                </Td>
              )}
            </Tr>
            )) : (
              <Tr>
                <Td colSpan={isAdmin ? 4 : 3} textAlign="center" py={6}>
                  <Text color="gray.500">No users found</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Edit User Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent className="user-modal-content">
          <ModalHeader>
            <Flex align="center">
              <Icon as={FaUser} mr={2} color="brand.500" />
              Edit User
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form className="user-form-container">
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input 
                  name="name" 
                  value={editForm.name} 
                  onChange={handleChange} 
                  placeholder="Enter user name"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input 
                  name="email" 
                  value={editForm.email} 
                  onChange={handleChange} 
                  placeholder="Enter user email"
                  type="email"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select 
                  name="role" 
                  value={editForm.role} 
                  onChange={handleChange}
                  bg="white"
                >
                  <option value="user">User</option>
                  <option value="developer">Developer</option>
                  <option value="admin">Admin</option>
                </Select>
              </FormControl>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={handleSave}
              leftIcon={<FaEdit />}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Users;
