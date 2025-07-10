import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Box, Table, Thead, Tbody, Tr, Th, Td, Spinner } from '@chakra-ui/react';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
    fetchUsers();
  }, []);

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
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user._id}>
              <Td>{user.name}</Td>
              <Td>{user.email}</Td>
              <Td>{user.role}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default Users;
