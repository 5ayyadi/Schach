#!/bin/bash

# Chess E2E Test Runner
# Comprehensive test suite for the chess application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 Chess E2E Test Runner${NC}"
echo "=================================="

# Function to check if a service is running
check_service() {
    local url=$1
    local name=$2
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $name is running${NC}"
        return 0
    else
        echo -e "${RED}✗ $name is not running${NC}"
        return 1
    fi
}

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

FRONTEND_OK=false
BACKEND_OK=false

if check_service "http://localhost:3000" "Frontend (React)"; then
    FRONTEND_OK=true
fi

if check_service "http://localhost:8000" "Backend (FastAPI)"; then
    BACKEND_OK=true
fi

if [ "$FRONTEND_OK" = false ] || [ "$BACKEND_OK" = false ]; then
    echo -e "\n${RED}❌ Prerequisites not met!${NC}"
    echo "Please ensure the following services are running:"
    echo "1. MongoDB and RabbitMQ: docker-compose up -d"
    echo "2. Backend server: http://localhost:8000"
    echo "3. Frontend server: http://localhost:3000"
    exit 1
fi

echo -e "\n${GREEN}✅ All prerequisites met!${NC}"

# Parse command line arguments
TEST_TYPE=${1:-all}
TEST_MODE=${2:-normal}

case $TEST_TYPE in
    "scholars")
        echo -e "\n${BLUE}🏛️ Running Scholar's Mate test...${NC}"
        npx playwright test scholars-mate.spec.js
        ;;
    "fools")
        echo -e "\n${BLUE}🃏 Running Fool's Mate test...${NC}"
        npx playwright test fools-mate.spec.js
        ;;
    "flow")
        echo -e "\n${BLUE}🎮 Running complete game flow tests...${NC}"
        npx playwright test game-flow.spec.js
        ;;
    "smoke")
        echo -e "\n${BLUE}💨 Running smoke tests...${NC}"
        npx playwright test smoke.spec.js
        ;;
    "general")
        echo -e "\n${BLUE}⚙️ Running general functionality tests...${NC}"
        npx playwright test general-functionality.spec.js
        ;;
    "all")
        echo -e "\n${BLUE}🎯 Running all E2E tests...${NC}"
        if [ "$TEST_MODE" = "headed" ]; then
            npx playwright test --headed
        elif [ "$TEST_MODE" = "debug" ]; then
            npx playwright test --debug
        elif [ "$TEST_MODE" = "ui" ]; then
            npx playwright test --ui
        else
            npx playwright test
        fi
        ;;
    *)
        echo -e "\n${RED}❌ Unknown test type: $TEST_TYPE${NC}"
        echo "Usage: $0 [test-type] [mode]"
        echo ""
        echo "Test types:"
        echo "  scholars  - Scholar's Mate test only"
        echo "  fools     - Fool's Mate test only"
        echo "  flow      - Complete game flow tests"
        echo "  smoke     - Basic functionality tests"
        echo "  general   - General functionality tests"
        echo "  all       - All tests (default)"
        echo ""
        echo "Modes:"
        echo "  normal    - Normal test execution (default)"
        echo "  headed    - Run with visible browser"
        echo "  debug     - Run in debug mode"
        echo "  ui        - Run with Playwright UI"
        exit 1
        ;;
esac

TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    echo -e "${GREEN}View detailed report: npx playwright show-report${NC}"
else
    echo -e "\n${RED}❌ Some tests failed!${NC}"
    echo -e "${YELLOW}View detailed report: npx playwright show-report${NC}"
    echo -e "${YELLOW}Debug failed tests: npm run test:debug${NC}"
fi

exit $TEST_EXIT_CODE
