import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Flex, Button } from '@chakra-ui/react';

const Navbar = () => {
  return (
    <Box bg="blue.600" px={4} py={2} color="white">
      <Flex align="center" justify="space-between">
        <Box fontWeight="bold" fontSize="xl">
          TicketDesk
        </Box>
        <Flex gap={4}>
          <Button as={Link} to="/dashboard" colorScheme="blue" variant="ghost">Dashboard</Button>
          <Button as={Link} to="/projects" colorScheme="blue" variant="ghost">Projects</Button>
          <Button as={Link} to="/tickets" colorScheme="blue" variant="ghost">Tickets</Button>
          <Button as={Link} to="/teams" colorScheme="blue" variant="ghost">Teams</Button>
          <Button as={Link} to="/users" colorScheme="blue" variant="ghost">Users</Button>
          <Button as={Link} to="/notifications" colorScheme="blue" variant="ghost">Notifications</Button>
          <Button as={Link} to="/activity" colorScheme="blue" variant="ghost">Activity</Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;
