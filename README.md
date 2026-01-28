# Election System - Full Stack Application

A comprehensive full-stack election management system for managing national elections, district elections, party management, and seat allocation calculations.

## Project Overview

This Election System is a complete application designed to manage and display election results across multiple administrative levels (National, Provincial, and District). It provides administrators with tools to manage election data, calculate seat allocations, and display results to users.

## System Architecture

```
Election System
├── Backend (Java)
│   ├── ElectionServer
│   ├── Controller Layer
│   ├── Service Layer
│   └── Database Layer
└── Frontend (React + TypeScript)
    ├── Pages
    ├── Components
    ├── API Services
    └── State Management
```

## Project Structure

```
FinalSystem/
├── backend/                           # Java Backend Server
│   ├── ElectionApp.java              # Main application entry point
│   ├── server/
│   │   └── ElectionServer.java       # Server configuration and setup
│   ├── controller/                   # Request handlers
│   │   ├── ElectionHandler.java
│   │   ├── ProvinceController.java
│   │   ├── DistrictHandler.java
│   │   ├── DistrictElectionHandler.java
│   │   ├── PartyHandler.java
│   │   ├── PartyVotesHandler.java
│   │   └── SeatAllocationHandler.java
│   ├── services/                     # Business logic
│   │   └── ElectionService.java
│   ├── db/                          # Database operations
│   │   └── DatabaseConnector.java
│   ├── models/                      # Data models
│   │   ├── User.java
│   │   └── KeyValue.java
│   └── lib/                         # External libraries
│
├── frontend/                          # React + TypeScript Frontend
│   ├── src/
│   │   ├── api/                     # API service integrations
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Page components
│   │   ├── store/                   # State management (Zustand)
│   │   ├── utils/                   # Utility functions
│   │   ├── data/                    # Static data
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env                         # Environment variables
│   ├── .gitignore                   # Git ignore patterns
│   ├── package.json                 # Dependencies
│   ├── vite.config.ts              # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── tsconfig.json                # TypeScript configuration
│   └── README.md                    # Frontend documentation
│
├── run.bat                          # Script to run the application
├── delete.bat                       # Script to clean up files
└── README.md                        # This file
```

## Key Features

### Backend Features
- **Election Management**: Create and manage election events
- **Province Management**: Organize geographical divisions
- **District Management**: Manage districts within provinces
- **Party Management**: Register and manage political parties
- **Vote Tracking**: Record and calculate votes
- **Seat Allocation**: Automatic seat distribution algorithm
- **Results Calculation**: Aggregate and display election results
- **User Authentication**: Secure login and authorization

### Frontend Features
- **Responsive UI**: Mobile-friendly design with Tailwind CSS
- **Real-time Results**: Display live election results
- **Admin Dashboard**: Comprehensive administration panel
- **Data Management**: Create, read, update, delete operations
- **User Authentication**: Login and session management
- **Protected Routes**: Role-based access control
- **Result Visualization**: Charts and detailed statistics

## Technology Stack

### Backend
- **Language**: Java
- **Runtime**: JVM
- **Server**: Custom HTTP Server
- **Database**: (Configure as needed)

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Node Version**: 18+

## Prerequisites

### Backend
- Java Development Kit (JDK) 11 or higher
- Command line access (cmd/PowerShell)

### Frontend
- Node.js 18+ and npm
- Command line access

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Compile Java files**
   ```bash
   javac -d . *.java
   javac -d . controller/*.java
   javac -d . services/*.java
   javac -d . db/*.java
   javac -d . models/*.java
   javac -d . server/*.java
   ```

3. **Run the server**
   ```bash
   java ElectionApp
   ```
   The server will start on `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   # .env file content:
   VITE_API_URL=http://localhost:8080
   VITE_APP_NAME=Election System
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`

5. **Build for production**
   ```bash
   npm run build
   ```

## Running the Application

### Option 1: Using Batch Scripts
```bash
# Run both backend and frontend
./run.bat
```

### Option 2: Manual Start
1. **Terminal 1 - Start Backend**
   ```bash
   cd backend
   java ElectionApp
   ```

2. **Terminal 2 - Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

## Project Components

### Backend Components

#### ElectionServer
- HTTP server configuration
- Request routing
- Response handling

#### Controllers
- **ElectionHandler**: Election CRUD operations
- **ProvinceController**: Province management
- **DistrictHandler**: District management
- **PartyHandler**: Party operations
- **PartyVotesHandler**: Vote recording and tracking
- **SeatAllocationHandler**: Seat calculation
- **DistrictElectionHandler**: District-level election data

#### Services
- **ElectionService**: Core business logic
- Data processing and calculations

#### Database Layer
- **DatabaseConnector**: Database connectivity
- Query execution and data persistence

### Frontend Components

#### Pages
- **HomePage**: Landing page with election overview
- **LoginPage**: User authentication
- **AdminPanel**: Admin dashboard
- **NationalResults**: National election results
- **ResultsPage**: Detailed result views
- **AboutPage**: System information

#### Admin Components
- **ProvinceManagement**: Province CRUD
- **DistrictManagement**: District CRUD
- **PartyManagement**: Party management
- **ResultsManagement**: Result input and editing
- **SeatCalculation**: Seat allocation configuration
- **SettingsPage**: System settings

#### API Services
- **ElectionService**: Election API calls
- **ProvinceService**: Province API calls
- **DistrictService**: District API calls
- **PartyService**: Party API calls
- **PartyVotesService**: Vote API calls
- **SeatAllocationService**: Seat allocation API calls
- **DistrictElectionService**: District election API calls

## API Endpoints

The backend provides REST API endpoints for all operations:

```
POST   /api/election      - Create election
GET    /api/election      - List elections
PUT    /api/election/:id  - Update election
DELETE /api/election/:id  - Delete election

POST   /api/province      - Create province
GET    /api/province      - List provinces
PUT    /api/province/:id  - Update province
DELETE /api/province/:id  - Delete province

POST   /api/district      - Create district
GET    /api/district      - List districts
PUT    /api/district/:id  - Update district
DELETE /api/district/:id  - Delete district

POST   /api/party         - Create party
GET    /api/party         - List parties
PUT    /api/party/:id     - Update party
DELETE /api/party/:id     - Delete party

POST   /api/votes         - Record votes
GET    /api/votes         - List votes
PUT    /api/votes/:id     - Update votes

POST   /api/seats         - Calculate seats
GET    /api/seats         - Get seat allocation

POST   /api/login         - User authentication
```

## Database Schema

The system uses a relational database with tables for:
- Elections
- Provinces
- Districts
- Parties
- Votes/Results
- Users
- SeatAllocations

## State Management (Frontend)

### Auth Store
- User authentication state
- Current user information
- Login/logout operations

### Election Store
- Election data
- Results and votes
- Seat allocations
- Province and district information

## Development Workflow

1. **Backend Development**
   - Modify Java files in backend/
   - Recompile changes
   - Test API endpoints

2. **Frontend Development**
   - Modify React components
   - Hot reload with Vite
   - Test UI and API integration

3. **Version Control**
   - Commit changes regularly
   - Push to main branch
   - Follow conventional commit messages

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:8080
VITE_APP_NAME=Election System
```

### Backend
- No .env file needed (configure in code if necessary)

## Git Configuration

The `.gitignore` file prevents pushing:
- `node_modules/` - npm dependencies
- `.env` - Environment variables
- `dist/` and `dist-ssr/` - Build outputs
- Editor configurations
- System files

## Troubleshooting

### Backend Issues

#### Port already in use
- Check if another Java application is running on port 8080
- Kill the process or change the port in ElectionServer.java

#### Compilation errors
- Ensure Java 11+ is installed
- Check all imports are correct
- Verify all files are in the correct directories

#### Database connection failed
- Verify database is running
- Check DatabaseConnector.java configuration
- Ensure database credentials are correct

### Frontend Issues

#### API connection errors
- Ensure backend is running on http://localhost:8080
- Check VITE_API_URL in .env file
- Verify network connectivity

#### Port already in use
- Change dev port: `npm run dev -- --port 5174`

#### Build errors
- Clear node_modules: `rm -rf node_modules/`
- Reinstall: `npm install`
- Check TypeScript errors: `npm run lint`

### General Issues

#### Application won't start
- Ensure all prerequisites are installed
- Check terminal error messages
- Verify all ports are available
- Review configuration files

## Testing

### Backend Testing
- Manual API testing with tools like Postman
- Verify request/response formats
- Test error handling

### Frontend Testing
- Manual UI testing
- Component functionality verification
- User flow testing
- Cross-browser compatibility

## Performance Optimization

### Backend
- Use connection pooling for database
- Implement caching for frequently accessed data
- Optimize database queries

### Frontend
- Lazy load components
- Code splitting with Vite
- Image optimization
- State management optimization

## Security Considerations

- Implement proper authentication
- Use HTTPS in production
- Validate all user inputs
- Protect sensitive data
- Implement CORS properly
- Use environment variables for secrets

## Deployment

### Backend Deployment
- Package as JAR file
- Deploy to production server
- Configure database for production
- Set up proper logging

### Frontend Deployment
- Build: `npm run build`
- Deploy dist/ folder to static hosting
- Configure API URL for production
- Set up CDN for assets

## Future Enhancements

### Short Term
- Add unit tests
- Improve error handling
- Add loading states
- Enhance UI/UX

### Long Term
- Real-time updates with WebSockets
- Advanced analytics
- Multi-language support (i18n)
- Mobile app version
- Performance metrics dashboard
- Advanced reporting features

## Contributing Guidelines

1. Create feature branch from main
2. Follow code style conventions
3. Write meaningful commit messages
4. Test changes thoroughly
5. Create pull request with description
6. Request code review

## Code Style

### Backend (Java)
- Follow Java naming conventions
- Use meaningful variable names
- Add javadoc comments for public methods
- Implement proper error handling

### Frontend (TypeScript/React)
- Use functional components with hooks
- Follow React best practices
- Add type annotations
- Use ESLint configuration

## Documentation

- [Backend Documentation](backend/README.md) - Backend setup and API details
- [Frontend Documentation](frontend/README.md) - Frontend setup and components

## Support & Contact

For issues, questions, or suggestions:
- Review troubleshooting section
- Check existing documentation
- Contact development team
- File bug reports with details

## License

This project is part of the University of Vavuniya Internship Program at SGIC.

## Project Information

- **Organization**: University of Vavuniya
- **Department**: SGIC (Sri Gitendra Information Center)
- **Project**: Election System
- **Status**: Active Development

## Changelog

### Version 1.0.0
- Initial project setup
- Backend server implementation
- Frontend application structure
- API endpoints implementation
- Admin panel features

---

**Last Updated**: January 28, 2026

For the latest updates and detailed information, refer to the individual README files in backend/ and frontend/ directories.
