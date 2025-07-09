# TicketDesk

A comprehensive ticket management system for teams and projects, built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- **User Management**: Registration, authentication, and profile management
- **Team Management**: Create and manage teams with different member roles
- **Project Management**: Create and manage projects within teams
- **Ticket Tracking**: Create, assign, and track tickets with customizable types, statuses, and priorities
- **Comments & Attachments**: Add comments and attachments to tickets
- **Activity Tracking**: Track all activities across users, teams, and projects
- **Notifications**: Real-time notifications for ticket assignments, comments, and more

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Express Validator

### Frontend
- React
- Chakra UI
- Axios
- React Router
- Zustand (State Management)

## Project Structure

```
├── client/                 # React frontend
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # Reusable components
│       ├── context/        # React context
│       ├── hooks/          # Custom hooks
│       ├── pages/          # Page components
│       ├── store/          # Zustand store
│       ├── utils/          # Utility functions
│       └── App.js          # Main App component
└── server/                 # Node.js backend
    ├── config/             # Configuration files
    ├── controllers/        # Route controllers
    ├── data/               # Data files
    ├── middleware/         # Express middleware
    ├── models/             # Mongoose models
    ├── routes/             # Express routes
    ├── utils/              # Utility functions
    └── index.js            # Entry point
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/ticketdesk.git
   cd ticketdesk
   ```

2. Install server dependencies
   ```bash
   cd server
   npm install
   ```

3. Install client dependencies
   ```bash
   cd ../client
   npm install
   ```

4. Create a `.env` file in the server directory with the following variables
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

### Running the Application

1. Seed the database (optional)
   ```bash
   cd server
   npm run seed
   ```

2. Start the server
   ```bash
   npm run dev
   ```

3. In a separate terminal, start the client
   ```bash
   cd ../client
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Default Users

After seeding the database, you can log in with the following credentials:

- Admin: admin@example.com / 123456
- User: john@example.com / 123456

## API Documentation

### Authentication

- `POST /api/users` - Register a new user
- `POST /api/users/login` - Login a user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Teams

- `POST /api/teams` - Create a new team
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Add team member
- `DELETE /api/teams/:id/members/:userId` - Remove team member
- `PUT /api/teams/:id/members/:userId/role` - Update member role

### Projects

- `POST /api/projects` - Create a new project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add project member
- `DELETE /api/projects/:id/members/:userId` - Remove project member
- `PUT /api/projects/:id/members/:userId/role` - Update member role

### Tickets

- `POST /api/tickets` - Create a new ticket
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:id` - Get ticket by ID
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket
- `PUT /api/tickets/:id/assign` - Assign ticket
- `PUT /api/tickets/:id/status` - Update ticket status
- `POST /api/tickets/:id/watchers` - Add watcher
- `DELETE /api/tickets/:id/watchers/:userId` - Remove watcher
- `GET /api/tickets/:id/history` - Get ticket history

### Comments

- `POST /api/comments` - Create a new comment
- `GET /api/comments/ticket/:ticketId` - Get comments for a ticket
- `GET /api/comments/:id` - Get comment by ID
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Notifications

- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread/count` - Get unread notifications count
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification
- `DELETE /api/notifications` - Delete all notifications

### Activities

- `GET /api/activities/user/:userId?` - Get user activity
- `GET /api/activities/project/:projectId` - Get project activity
- `GET /api/activities/team/:teamId` - Get team activity
- `GET /api/activities/entity/:entityType/:entityId` - Get entity activity

## License

This project is licensed under the MIT License - see the LICENSE file for details.