# Chess Frontend Application

A modern, minimal chess game frontend built with React, Vite, react-chessboard, and chess.js.

## Features

### 🏠 Landing Page
- Clean welcome interface
- Single "Play Chess" button to start

### 🔐 Authentication
- Login/Registration toggle
- Username and password authentication (simulated)
- Local state management

### ⚙️ Game Setup
- Quick-start options: Bullet, Blitz, Rapid, Daily
- Custom time controls
- Color selection: White, Black, Random
- Game creation with loading states

### ♟️ Game Board
- Full interactive chessboard using react-chessboard
- Real-time game information display
- Player management and turn indicators
- Move validation using chess.js
- Game end detection (checkmate, draw)
- Navigation controls

## Technology Stack

- **React 19** - UI Framework
- **Vite** - Build tool and dev server  
- **react-chessboard** - Interactive chess board component
- **chess.js** - Chess game logic and validation
- **react-router-dom** - Client-side routing
- **Vitest** - Testing framework
- **@testing-library/react** - Component testing utilities

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run lint` - Run ESLint

## Application Flow

1. **Landing Page** (`/`) - Welcome screen with "Play Chess" button
2. **Auth Page** (`/auth`) - Login or create account
3. **Game Setup** (`/setup`) - Configure game settings
4. **Game Page** (`/game/:gameId`) - Play chess with interactive board

## Testing

The application includes comprehensive test coverage:

- **Integration Tests** - Test component interactions and user flows
- **Chess Logic Tests** - Validate game rules and move validation
- **End-to-End Tests** - Test complete user journeys

Run tests with:
```bash
npm test
```

All 29 tests passing! ✅

## UI Design

The application features a clean, minimal design with:
- Responsive layout that works on desktop and mobile
- Modern color scheme with intuitive navigation
- Clear visual hierarchy and accessibility considerations
- Loading states and error handling

## Future Enhancements

Ready for backend integration:
- WebSocket connections for real-time multiplayer
- User authentication and persistence
- Game history and statistics
- Tournament modes
- Chat functionality

## File Structure

```
src/
├── components/
│   ├── LandingPage.jsx    # Welcome screen
│   ├── AuthPage.jsx       # Login/registration
│   ├── GameSetupPage.jsx  # Game configuration
│   └── GamePage.jsx       # Chess game interface
├── tests/
│   ├── integration.test.jsx    # Component integration tests
│   └── chess-game.test.jsx     # Chess logic and E2E tests
├── App.jsx                # Main app with routing
├── App.css               # Global styles
└── main.jsx              # Application entry point
```

## Development Notes

- Uses React hooks for state management
- Modular component architecture for easy extension
- Comprehensive error handling for invalid moves
- Placeholder for WebSocket integration
- Responsive design with mobile-first approach

---

**Ready for fullstack integration!** This frontend can easily connect to the existing backend chess API for a complete multiplayer chess experience.
