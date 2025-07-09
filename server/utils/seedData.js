const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

/**
 * Generate seed data for the application
 * This can be used for development and testing purposes
 */

// Sample user data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: bcrypt.hashSync('123456', 10),
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff',
    bio: 'System administrator',
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: bcrypt.hashSync('123456', 10),
    role: 'user',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff',
    bio: 'Project manager',
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: bcrypt.hashSync('123456', 10),
    role: 'user',
    avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=0D8ABC&color=fff',
    bio: 'Senior developer',
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    password: bcrypt.hashSync('123456', 10),
    role: 'user',
    avatar: 'https://ui-avatars.com/api/?name=Bob+Johnson&background=0D8ABC&color=fff',
    bio: 'QA Engineer',
  },
  {
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    password: bcrypt.hashSync('123456', 10),
    role: 'user',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Williams&background=0D8ABC&color=fff',
    bio: 'UX Designer',
  },
];

// Sample team data
const teams = [
  {
    name: 'Engineering Team',
    description: 'Core engineering and development team',
    avatar: 'https://ui-avatars.com/api/?name=Engineering+Team&background=2E7D32&color=fff',
  },
  {
    name: 'Design Team',
    description: 'UI/UX design team',
    avatar: 'https://ui-avatars.com/api/?name=Design+Team&background=C2185B&color=fff',
  },
  {
    name: 'QA Team',
    description: 'Quality assurance and testing team',
    avatar: 'https://ui-avatars.com/api/?name=QA+Team&background=7B1FA2&color=fff',
  },
];

// Sample project data
const projects = [
  {
    name: 'Website Redesign',
    key: 'WEB',
    description: 'Redesign the company website with modern UI/UX',
    status: 'active',
    category: 'web',
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-06-30'),
  },
  {
    name: 'Mobile App Development',
    key: 'MOB',
    description: 'Develop a new mobile application for iOS and Android',
    status: 'active',
    category: 'mobile',
    startDate: new Date('2023-02-15'),
    endDate: new Date('2023-08-15'),
  },
  {
    name: 'API Integration',
    key: 'API',
    description: 'Integrate third-party APIs into our platform',
    status: 'active',
    category: 'backend',
    startDate: new Date('2023-03-01'),
    endDate: new Date('2023-05-30'),
  },
];

// Sample ticket data (to be populated with actual IDs during seeding)
const generateTickets = (projectId, reporterId, assigneeId) => [
  {
    title: 'Setup project structure',
    description: 'Create initial project structure and configuration files',
    project: projectId,
    reporter: reporterId,
    assignee: assigneeId,
    type: 'task',
    status: 'done',
    priority: 'medium',
    dueDate: new Date('2023-01-15'),
    estimatedTime: 8,
    spentTime: 6,
    labels: ['setup', 'infrastructure'],
  },
  {
    title: 'Implement user authentication',
    description: 'Create user authentication system with login, registration, and password reset',
    project: projectId,
    reporter: reporterId,
    assignee: assigneeId,
    type: 'feature',
    status: 'inprogress',
    priority: 'high',
    dueDate: new Date('2023-02-01'),
    estimatedTime: 16,
    spentTime: 8,
    labels: ['auth', 'security'],
  },
  {
    title: 'Fix navigation menu on mobile',
    description: 'The navigation menu is not displaying correctly on mobile devices',
    project: projectId,
    reporter: reporterId,
    assignee: assigneeId,
    type: 'bug',
    status: 'todo',
    priority: 'high',
    dueDate: new Date('2023-02-15'),
    estimatedTime: 4,
    spentTime: 0,
    labels: ['mobile', 'ui'],
  },
];

// Sample comment data (to be populated with actual IDs during seeding)
const generateComments = (ticketId, userId) => [
  {
    ticket: ticketId,
    user: userId,
    content: 'I\'ve started working on this. Will update soon.',
    attachments: [],
  },
  {
    ticket: ticketId,
    user: userId,
    content: 'Making good progress. Should be done by tomorrow.',
    attachments: [],
  },
];

module.exports = {
  users,
  teams,
  projects,
  generateTickets,
  generateComments,
};