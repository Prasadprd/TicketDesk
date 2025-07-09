const mongoose = require('mongoose');
const colors = require('colors');
const dotenv = require('dotenv');
const { connectDB } = require('../config/db');
const { users, teams, projects, generateTickets, generateComments } = require('./seedData');

// Models
const User = require('../models/userModel');
const Team = require('../models/teamModel');
const Project = require('../models/projectModel');
const Ticket = require('../models/ticketModel');
const Comment = require('../models/commentModel');
const Activity = require('../models/activityModel');
const Notification = require('../models/notificationModel');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Import data into DB
const importData = async () => {
  try {
    // Clear all collections
    await User.deleteMany();
    await Team.deleteMany();
    await Project.deleteMany();
    await Ticket.deleteMany();
    await Comment.deleteMany();
    await Activity.deleteMany();
    await Notification.deleteMany();

    console.log('Data cleared...'.red.inverse);

    // Create users
    const createdUsers = await User.insertMany(users);
    const adminUser = createdUsers[0]._id;
    const johnUser = createdUsers[1]._id;
    const janeUser = createdUsers[2]._id;
    const bobUser = createdUsers[3]._id;
    const sarahUser = createdUsers[4]._id;

    console.log('Users imported...'.green.inverse);

    // Create teams with members
    const engineeringTeam = {
      ...teams[0],
      owner: adminUser,
      members: [
        { user: adminUser, role: 'admin', joinedAt: Date.now() },
        { user: johnUser, role: 'admin', joinedAt: Date.now() },
        { user: janeUser, role: 'member', joinedAt: Date.now() },
        { user: bobUser, role: 'member', joinedAt: Date.now() },
      ],
    };

    const designTeam = {
      ...teams[1],
      owner: johnUser,
      members: [
        { user: johnUser, role: 'admin', joinedAt: Date.now() },
        { user: sarahUser, role: 'admin', joinedAt: Date.now() },
        { user: janeUser, role: 'member', joinedAt: Date.now() },
      ],
    };

    const qaTeam = {
      ...teams[2],
      owner: adminUser,
      members: [
        { user: adminUser, role: 'admin', joinedAt: Date.now() },
        { user: bobUser, role: 'admin', joinedAt: Date.now() },
        { user: sarahUser, role: 'member', joinedAt: Date.now() },
      ],
    };

    const createdTeams = await Team.insertMany([
      engineeringTeam,
      designTeam,
      qaTeam,
    ]);

    // Update users with team memberships
    await User.findByIdAndUpdate(adminUser, {
      $push: { teams: [createdTeams[0]._id, createdTeams[2]._id] },
    });
    await User.findByIdAndUpdate(johnUser, {
      $push: { teams: [createdTeams[0]._id, createdTeams[1]._id] },
    });
    await User.findByIdAndUpdate(janeUser, {
      $push: { teams: [createdTeams[0]._id, createdTeams[1]._id] },
    });
    await User.findByIdAndUpdate(bobUser, {
      $push: { teams: [createdTeams[0]._id, createdTeams[2]._id] },
    });
    await User.findByIdAndUpdate(sarahUser, {
      $push: { teams: [createdTeams[1]._id, createdTeams[2]._id] },
    });

    console.log('Teams imported...'.green.inverse);

    // Create projects with team assignments and members
    const websiteProject = {
      ...projects[0],
      owner: johnUser,
      team: createdTeams[0]._id, // Engineering team
      members: [
        { user: johnUser, role: 'admin', joinedAt: Date.now() },
        { user: janeUser, role: 'admin', joinedAt: Date.now() },
        { user: sarahUser, role: 'member', joinedAt: Date.now() },
        { user: bobUser, role: 'viewer', joinedAt: Date.now() },
      ],
    };

    const mobileProject = {
      ...projects[1],
      owner: janeUser,
      team: createdTeams[0]._id, // Engineering team
      members: [
        { user: janeUser, role: 'admin', joinedAt: Date.now() },
        { user: johnUser, role: 'member', joinedAt: Date.now() },
        { user: bobUser, role: 'member', joinedAt: Date.now() },
      ],
    };

    const apiProject = {
      ...projects[2],
      owner: adminUser,
      team: createdTeams[2]._id, // QA team
      members: [
        { user: adminUser, role: 'admin', joinedAt: Date.now() },
        { user: bobUser, role: 'admin', joinedAt: Date.now() },
        { user: janeUser, role: 'member', joinedAt: Date.now() },
      ],
    };

    const createdProjects = await Project.insertMany([
      websiteProject,
      mobileProject,
      apiProject,
    ]);

    // Update teams with project references
    await Team.findByIdAndUpdate(createdTeams[0]._id, {
      $push: { projects: [createdProjects[0]._id, createdProjects[1]._id] },
    });
    await Team.findByIdAndUpdate(createdTeams[2]._id, {
      $push: { projects: createdProjects[2]._id },
    });

    console.log('Projects imported...'.green.inverse);

    // Create tickets for each project
    const websiteTickets = generateTickets(
      createdProjects[0]._id,
      johnUser,
      janeUser
    );
    const mobileTickets = generateTickets(
      createdProjects[1]._id,
      janeUser,
      bobUser
    );
    const apiTickets = generateTickets(
      createdProjects[2]._id,
      adminUser,
      janeUser
    );

    const createdWebsiteTickets = await Ticket.insertMany(websiteTickets);
    const createdMobileTickets = await Ticket.insertMany(mobileTickets);
    const createdApiTickets = await Ticket.insertMany(apiTickets);

    console.log('Tickets imported...'.green.inverse);

    // Create comments for tickets
    const websiteComments = [
      ...generateComments(createdWebsiteTickets[0]._id, janeUser),
      ...generateComments(createdWebsiteTickets[1]._id, janeUser),
    ];

    const mobileComments = [
      ...generateComments(createdMobileTickets[0]._id, bobUser),
      ...generateComments(createdMobileTickets[1]._id, johnUser),
    ];

    const apiComments = [
      ...generateComments(createdApiTickets[0]._id, janeUser),
      ...generateComments(createdApiTickets[2]._id, bobUser),
    ];

    await Comment.insertMany([
      ...websiteComments,
      ...mobileComments,
      ...apiComments,
    ]);

    console.log('Comments imported...'.green.inverse);

    // Create some activity logs
    const activities = [
      {
        user: johnUser,
        action: 'created',
        entityType: 'project',
        entityId: createdProjects[0]._id,
        project: createdProjects[0]._id,
        team: createdTeams[0]._id,
        details: { name: 'Website Redesign' },
      },
      {
        user: janeUser,
        action: 'created',
        entityType: 'project',
        entityId: createdProjects[1]._id,
        project: createdProjects[1]._id,
        team: createdTeams[0]._id,
        details: { name: 'Mobile App Development' },
      },
      {
        user: adminUser,
        action: 'created',
        entityType: 'project',
        entityId: createdProjects[2]._id,
        project: createdProjects[2]._id,
        team: createdTeams[2]._id,
        details: { name: 'API Integration' },
      },
      {
        user: johnUser,
        action: 'created',
        entityType: 'ticket',
        entityId: createdWebsiteTickets[0]._id,
        project: createdProjects[0]._id,
        team: createdTeams[0]._id,
        details: {
          title: 'Setup project structure',
          ticketNumber: createdWebsiteTickets[0].ticketNumber,
        },
      },
      {
        user: janeUser,
        action: 'updated_status',
        entityType: 'ticket',
        entityId: createdWebsiteTickets[0]._id,
        project: createdProjects[0]._id,
        team: createdTeams[0]._id,
        details: {
          title: 'Setup project structure',
          ticketNumber: createdWebsiteTickets[0].ticketNumber,
          from: 'todo',
          to: 'done',
        },
      },
    ];

    await Activity.insertMany(activities);

    console.log('Activities imported...'.green.inverse);

    // Create some notifications
    const notifications = [
      {
        recipient: janeUser,
        sender: johnUser,
        type: 'ticket_assigned',
        title: 'Ticket Assigned',
        message: `You have been assigned to ticket ${createdWebsiteTickets[0].ticketNumber}: ${createdWebsiteTickets[0].title}`,
        read: false,
        entityType: 'ticket',
        entityId: createdWebsiteTickets[0]._id,
        link: `/tickets/${createdWebsiteTickets[0]._id}`,
      },
      {
        recipient: bobUser,
        sender: janeUser,
        type: 'ticket_assigned',
        title: 'Ticket Assigned',
        message: `You have been assigned to ticket ${createdMobileTickets[0].ticketNumber}: ${createdMobileTickets[0].title}`,
        read: false,
        entityType: 'ticket',
        entityId: createdMobileTickets[0]._id,
        link: `/tickets/${createdMobileTickets[0]._id}`,
      },
      {
        recipient: johnUser,
        sender: janeUser,
        type: 'ticket_comment',
        title: 'New Comment',
        message: `New comment on ticket ${createdWebsiteTickets[1].ticketNumber}: ${createdWebsiteTickets[1].title}`,
        read: true,
        readAt: Date.now(),
        entityType: 'ticket',
        entityId: createdWebsiteTickets[1]._id,
        link: `/tickets/${createdWebsiteTickets[1]._id}`,
      },
    ];

    await Notification.insertMany(notifications);

    console.log('Notifications imported...'.green.inverse);

    console.log('All data imported!'.green.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

// Delete all data from DB
const destroyData = async () => {
  try {
    await User.deleteMany();
    await Team.deleteMany();
    await Project.deleteMany();
    await Ticket.deleteMany();
    await Comment.deleteMany();
    await Activity.deleteMany();
    await Notification.deleteMany();

    console.log('Data destroyed!'.red.inverse);
    process.exit();
  } catch (error) {
    console.error(`${error}`.red.inverse);
    process.exit(1);
  }
};

// Check command line args
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}