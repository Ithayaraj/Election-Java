# Election System - Frontend

A modern, responsive frontend application for managing and viewing election results using React, TypeScript, and Vite.

## Project Overview

This frontend application is built for the Election System that manages national elections, district elections, party management, and seat allocation calculations.

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: Zustand
- **Node Version**: 18+

## Project Structure

```
frontend/
├── src/
│   ├── api/                 # API service integrations
│   │   ├── axios.js
│   │   ├── DistrictElectionService.js
│   │   ├── DistrictService.js
│   │   ├── ElectionService.js
│   │   ├── PartyService.js
│   │   ├── PartyVotesService.js
│   │   ├── ProvinceService.js
│   │   └── SeatAllocationService.js
│   ├── components/          # Reusable UI components
│   │   ├── admin/           # Admin panel components
│   │   │   ├── DistrictManagement.tsx
│   │   │   ├── PartyManagement.tsx
│   │   │   ├── ProvinceManagement.tsx
│   │   │   ├── ResultsManagement.tsx
│   │   │   ├── SeatCalculation.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── List/            # List components
│   │   │   ├── DistrictList.jsx
│   │   │   └── ProvinceList.jsx
│   │   ├── Footer.tsx
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/               # Page components
│   │   ├── AboutPage.tsx
│   │   ├── AdminPanel.tsx
│   │   ├── HomePage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── NationalResults.tsx
│   │   └── ResultsPage.jsx
│   ├── store/               # State management
│   │   ├── authStore.ts
│   │   └── electionStore.ts
│   ├── utils/               # Utility functions
│   │   └── seatCalculator.ts
│   ├── data/                # Static data
│   │   └── initialData.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env                     # Environment variables
├── .gitignore              # Git ignore patterns
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS config
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## Key Features & Concepts

### 1. **Authentication & Authorization**
- Login page with credential validation
- Protected routes for admin and user access
- Authentication state management using Zustand
- Token-based session handling

### 2. **Admin Panel**
- Province Management: Create, update, delete provinces
- District Management: Manage districts within provinces
- Party Management: Register and manage political parties
- Results Management: Input and manage election results
- Seat Calculation: Automatic seat allocation based on votes
- Settings: System-wide configuration

### 3. **Election Data Management**
- National Results: Display country-wide election statistics
- District Elections: View election results by district
- Party Votes: Track votes received by each party
- Seat Allocation: Calculate seats based on voting results

### 4. **User Interface**
- Responsive design using Tailwind CSS
- Navigation bar with routing
- Footer with information links
- About page with system information
- Home page with election overview

### 5. **Data Persistence & State Management**
- Zustand stores for auth and election data
- API service layer for backend communication
- Axios interceptors for request handling
- Dynamic data loading from backend

### 6. **Utilities**
- Seat calculator for vote-to-seat conversion
- Service layer for API calls
- Protected route component for authorization

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create .env file**
   ```bash
   # .env file content:
   VITE_API_URL=http://localhost:8080
   VITE_APP_NAME=Election System
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env` file in the frontend root directory:

```env
VITE_API_URL=http://localhost:8080
VITE_APP_NAME=Election System
```

## API Integration

All API calls are made through service files in the `src/api/` directory:

- **ElectionService**: Main election data operations
- **ProvinceService**: Province-related operations
- **DistrictService**: District-related operations
- **PartyService**: Party management operations
- **PartyVotesService**: Vote tracking and management
- **SeatAllocationService**: Seat calculation operations
- **DistrictElectionService**: District-specific election data

## State Management

Using Zustand for lightweight state management:

- **authStore**: User authentication state
- **electionStore**: Election data and results

## Styling

- Tailwind CSS for utility-first styling
- Custom CSS in `src/index.css`
- Responsive design patterns

## Development Workflow

1. Create feature branch from main
2. Implement features in respective components
3. Use API services for backend communication
4. Test components and user flows
5. Commit and push changes
6. Create pull request for review

## Git Ignore

The `.gitignore` file is configured to exclude:
- `node_modules/` - npm dependencies
- `.env` - Environment variables
- `dist/` and `dist-ssr/` - Build outputs
- Editor configurations (.vscode/, .idea/)
- System files (.DS_Store)

## Future Enhancements

- Real-time result updates using WebSockets
- Advanced analytics and reporting
- Multi-language support (i18n)
- Accessibility improvements (a11y)
- Performance optimization
- Unit and integration tests

## Troubleshooting

### Port already in use
- Change the dev server port: `npm run dev -- --port 5174`

### API connection issues
- Ensure backend server is running on `http://localhost:8080`
- Check `VITE_API_URL` in `.env` file

### Build errors
- Clear `node_modules/` and reinstall: `npm install`
- Clear build cache: `rm -rf dist/`

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Keep components modular and reusable
4. Document complex logic

## License

This project is part of the University of Vavuniya Internship at SGIC.

## Support

For issues or questions, contact the development team.
