# Chess E2E Tests

End-to-end tests for the fullstack chess application using Playwright.

## Test Scenarios

### Core Chess Mate Tests
- **Fool's Mate** (`fools-mate-blitz.spec.js`) - Tests fastest checkmate (2 moves)
- **Scholar's Mate** (`scholars-mate-blitz.spec.js`) - Tests 4-move checkmate  
- **Fastest Stalemate** (`fastest-stalemate.spec.js`) - Tests quickest stalemate

## Setup

```bash
npm install
npx playwright install
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test
npx playwright test fools-mate-blitz.spec.js

# Run with UI mode
npm run test:ui
```

## Test Flow

1. Player 1 registers/logs in and creates game
2. Player 2 registers/logs in and joins game  
3. Both players execute chess moves via browser UI
4. Verify game ends with expected result (checkmate/stalemate)

All tests use real browser interactions and WebSocket connections.
