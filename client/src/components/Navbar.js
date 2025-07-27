import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Flex, Button, Avatar, Menu, MenuButton, MenuList, MenuItem, IconButton, useColorModeValue, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure, Input, InputGroup, InputLeftElement, useToast } from '@chakra-ui/react';
import { HamburgerIcon, ChevronDownIcon, SearchIcon } from '@chakra-ui/icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/api';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchQuery, setSearchQuery] = useState('');
  const toast = useToast();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      // Search for ticket by ticket number
      const res = await api.get(`/tickets?search=${searchQuery.trim()}`);
      
      if (res.data.tickets && res.data.tickets.length > 0) {
        // If ticket found, navigate to it
        navigate(`/tickets/${res.data.tickets[0]._id}`);
      } else {
        // If no ticket found, show toast message
        toast({
          title: 'Ticket not found',
          description: `No ticket found with number ${searchQuery}`,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to search for ticket',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    
    // Clear search input
    setSearchQuery('');
  };

  return (
    <Box className="navbar" bg="brand.600" px={4} py={3} color="white">
      <Flex className="navbar-container" align="center" justify="space-between">
        <Flex align="center">
          <Box className="navbar-brand" fontWeight="bold" fontSize="xl" mr={8}>
            TicketDesk
          </Box>
          
          {/* Desktop Navigation */}
          <Flex className="navbar-links" display={{ base: 'none', md: 'flex' }} gap={1}>
            <Button as={Link} to="/dashboard" className="navbar-link" colorScheme="brand" variant="ghost" size="md">Dashboard</Button>
            <Button as={Link} to="/projects" className="navbar-link" colorScheme="brand" variant="ghost" size="md">Projects</Button>
            <Button as={Link} to="/tickets" className="navbar-link" colorScheme="brand" variant="ghost" size="md">Tickets</Button>
            {/* <Button as={Link} to="/teams" className="navbar-link" colorScheme="brand" variant="ghost" size="md">Teams</Button> */}
            <Button as={Link} to="/users" className="navbar-link" colorScheme="brand" variant="ghost" size="md">Users</Button>
            <Button as={Link} to="/notifications" className="navbar-link" colorScheme="brand" variant="ghost" size="md">Notifications</Button>
            <Button as={Link} to="/activity" className="navbar-link" colorScheme="brand" variant="ghost" size="md">Activity</Button>
          </Flex>
        </Flex>
        
        {/* Ticket Search */}
        <form onSubmit={handleSearch} style={{ marginRight: '20px' }}>
          <InputGroup size="sm" width="250px">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              type="text"
              placeholder="Search ticket by number"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              borderRadius="md"
            />
          </InputGroup>
        </form>
        
        {/* Mobile menu button */}
        <IconButton
          className="navbar-menu-button"
          display={{ base: 'flex', md: 'none' }}
          aria-label="Open menu"
          fontSize="20px"
          color="white"
          variant="ghost"
          icon={<HamburgerIcon />}
          onClick={onOpen}
        />
        
        {/* User menu */}
        {user ? (
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              variant="ghost"
              _hover={{ bg: 'brand.700' }}
              _active={{ bg: 'brand.700' }}
            >
              <Flex align="center">
                <Avatar className="navbar-avatar" size="sm" name={user.name} src={user.avatar} mr={2} />
                <Box display={{ base: 'none', md: 'block' }}>{user.name}</Box>
              </Flex>
            </MenuButton>
            <MenuList bg="white" color="gray.800">
              <MenuItem as={Link} to="/profile">Profile</MenuItem>
              <MenuItem as={Link} to="/settings">Settings</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Flex gap={2}>
            <Button as={Link} to="/login" variant="ghost" size="sm">Login</Button>
            <Button as={Link} to="/register" variant="solid" size="sm" bg="white" color="brand.600">Register</Button>
          </Flex>
        )}
      </Flex>
      
      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader bg="brand.600" color="white">TicketDesk</DrawerHeader>
          <DrawerBody p={0}>
            <Flex direction="column">
              <Button as={Link} to="/dashboard" variant="ghost" onClick={onClose} justifyContent="flex-start" borderRadius={0} py={6}>Dashboard</Button>
              <Button as={Link} to="/projects" variant="ghost" onClick={onClose} justifyContent="flex-start" borderRadius={0} py={6}>Projects</Button>
              <Button as={Link} to="/tickets" variant="ghost" onClick={onClose} justifyContent="flex-start" borderRadius={0} py={6}>Tickets</Button>
              {/* Teams functionality has been removed */}
              <Button as={Link} to="/users" variant="ghost" onClick={onClose} justifyContent="flex-start" borderRadius={0} py={6}>Users</Button>
              <Button as={Link} to="/notifications" variant="ghost" onClick={onClose} justifyContent="flex-start" borderRadius={0} py={6}>Notifications</Button>
              <Button as={Link} to="/activity" variant="ghost" onClick={onClose} justifyContent="flex-start" borderRadius={0} py={6}>Activity</Button>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Navbar;
