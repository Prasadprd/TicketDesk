
import React, { useEffect, useState, useContext } from 'react';
import api from '../api/api';
import {
  Box, Table, Thead, Tbody, Tr, Th, Td, Spinner, Button, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, FormControl, FormLabel, Input, Select, useDisclosure
} from '@chakra-ui/react';
import { AuthContext } from '../context/AuthContext';

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

  if (loading) return <Spinner size="xl" />;
  if (error) return <Box color="red.500">{error}</Box>;

  return (
    <Box p={6}>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Role</Th>
            {isAdmin && <Th>Actions</Th>}
          </Tr>
        </Thead>
        <Tbody>
          {users.map((u) => (
            <Tr key={u._id}>
              <Td>{u.name}</Td>
              <Td>{u.email}</Td>
              <Td>{u.role}</Td>
              {isAdmin && (
                <Td>
                  <Button size="sm" colorScheme="blue" mr={2} onClick={() => handleEdit(u)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDelete(u._id)}
                    isDisabled={u._id === user._id}
                  >
                    Delete
                  </Button>
                </Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Edit User Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={2}>
              <FormLabel>Name</FormLabel>
              <Input name="name" value={editForm.name} onChange={handleChange} />
            </FormControl>
            <FormControl mb={2}>
              <FormLabel>Email</FormLabel>
              <Input name="email" value={editForm.email} onChange={handleChange} />
            </FormControl>
            <FormControl mb={2}>
              <FormLabel>Role</FormLabel>
              <Select name="role" value={editForm.role} onChange={handleChange}>
                <option value="user">User</option>
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSave}>
              Save
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Users;
