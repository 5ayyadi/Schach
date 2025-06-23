# Chess E2E Tests with Playwright

Comprehensive end-to-end tests for the browser-based chess game, including famous checkmate patterns like Scholar's Mate and Fool's Mate.

## 🎯 Test Coverage

### Main Test Suites

1. **game-flow.spec.js** - Complete game flow tests with two famous checkmate patterns
2. **scholars-mate.spec.js** - Focused test for Scholar's Mate (4-move checkmate)
3. **fools-mate.spec.js** - Focused test for Fool's Mate (2-move checkmate, fastest possible)
4. **smoke.spec.js** - Basic functionality validation
5. **general-functionality.spec.js** - Comprehensive feature testing

### Famous Checkmate Patterns Tested

#### Scholar's Mate (4 moves)
```
1. e4    e5
2. Bc4   Nc6
3. Qh5   Nf6??
4. Qxf7# (White wins)
```

#### Fool's Mate (2 moves - fastest possible)
```
1. f3    e5
2. g4    Qh4#  (Black wins)
```

## 🚀 Prerequisites

Before running tests, ensure the following services are running:

1. **MongoDB and RabbitMQ** (via Docker Compose)
   ```bash
   docker-compose up -d
   ```

2. **Backend Server** (FastAPI on port 8000)
   ```bash
   cd backend
   python main.py
   # Should be accessible at http://localhost:8000
   ```

3. **Frontend Server** (React on port 3000)
   ```bash
   cd frontend
   npm run dev
   # Should be accessible at http://localhost:3000
   ```

## 📦 Installation

1. Navigate to the e2e-tests directory:
   ```bash
   cd e2e-tests
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

## 🧪 Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Scholar's Mate only
npx playwright test scholars-mate

# Fool's Mate only  
npx playwright test fools-mate

# Complete game flow
npx playwright test game-flow

# Smoke tests
npx playwright test smoke

# General functionality
npx playwright test general-functionality
```

### Run Tests with UI (Debug Mode)
```bash
npm run test:ui
```

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:headed
```

### Debug Specific Test
```bash
npm run test:debug -- --grep "Scholar's Mate"
```

## 🎮 Test Strategy

### Real User Simulation
- **Two Browser Contexts**: Each test creates separate browser contexts for Player 1 and Player 2
- **Authentic UI Interactions**: Uses actual click, drag, and form interactions
- **No Shortcuts**: Tests follow the complete user journey from login to game completion

### User Journey Flow
1. **User 1**: Opens landing page → Logs in → Creates game → Gets game link
2. **User 2**: Opens new browser → Logs in → Joins game via link
3. **Gameplay**: Both users make moves using UI interactions only
4. **Verification**: Tests verify winner display and game state

### Move Interaction Methods
The tests use multiple strategies for chess moves:
1. **Data-square attributes**: `page.locator('[data-square="e2"]').click()`
2. **Drag and drop**: `page.dragAndDrop(fromSelector, toSelector)`
3. **Coordinate-based**: Calculate board positions and use mouse events

## 🛠️ Utilities and Page Objects

### ChessTestUtils
Helper class providing:
- User authentication
- Game creation and joining
- Move execution with fallback strategies
- Turn validation
- Winner verification

### ChessGamePage
Page Object Model providing:
- Structured element access
- Game state queries
- Move interaction methods
- Winner detection

## 📸 Screenshots and Reports

- **Automatic Screenshots**: Taken on test failures
- **Final State Screenshots**: Captured after checkmate for both players
- **HTML Report**: Generated automatically with test results
- **Videos**: Recorded for failed tests

View reports:
```bash
npx playwright show-report
```

## 🎯 Test Scenarios

### Scholar's Mate Test
Simulates the classic beginner trap where White wins in 4 moves by attacking the f7 square.

### Fool's Mate Test  
Demonstrates the fastest possible checkmate where Black wins in just 2 moves due to White's terrible opening moves.

### Smoke Tests
Validates basic functionality:
- Landing page loads
- Authentication works
- Game creation succeeds
- Two-player setup functions
- Basic moves execute

### General Functionality Tests
Comprehensive testing of:
- User authentication flows
- Game setup options
- Turn-based gameplay
- Error handling
- Game information display

## 🐛 Debugging

### Common Issues

1. **Services Not Running**
   ```bash
   # Check if services are up
   curl http://localhost:8000/health  # Backend
   curl http://localhost:3000         # Frontend
   ```

2. **Move Interactions Failing**
   - Tests include multiple fallback strategies
   - Screenshots are taken on failures
   - Use headed mode to see interactions

3. **Timing Issues**
   - Tests include appropriate waits
   - WebSocket connections may need time
   - Increase timeouts if needed

### Debug Commands
```bash
# Run single test with debug output
npx playwright test scholars-mate --debug

# Run with console logs
npx playwright test --headed --slowMo=1000

# Generate trace for failed tests
npx playwright test --trace=on
```

## 📝 Notes

- Tests are designed to be independent and can run in any order
- Each test uses unique usernames to avoid conflicts
- Browser contexts are properly cleaned up after each test
- Screenshots and videos are preserved for failed tests only
- Tests validate actual game logic, not just UI interactions

## 🎉 Expected Output

When tests pass, you'll see console output like:
```
✓ White: 1.e4
✓ Black: 1...e5
✓ White: 2.Bc4
✓ Black: 2...Nc6
✓ White: 3.Qh5
✓ Black: 3...Nf6?? (the blunder!)
✓ White: 4.Qxf7# (CHECKMATE!)
🎉 Scholar's Mate completed! White wins by checkmate in 4 moves.
```

This demonstrates that the tests successfully simulate real user interactions and validate the complete chess game flow from start to checkmate.
