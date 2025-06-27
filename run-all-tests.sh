#!/bin/bash

# Comprehensive Integration Test Runner for M107 Blockchain Certificate System
# This script runs both backend and frontend integration tests in sequence
# and provides a summary of results

echo "==========================================="
echo "M107 Blockchain Certificate System"
echo "Integration Test Suite Runner"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
BACKEND_RESULT=0
FRONTEND_RESULT=0
E2E_RESULT=0
BACKEND_SERVER_STARTED=false

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "SUCCESS" ]; then
        echo -e "${GREEN}✓ $message${NC}"
    elif [ "$status" = "ERROR" ]; then
        echo -e "${RED}✗ $message${NC}"
    elif [ "$status" = "WARNING" ]; then
        echo -e "${YELLOW}⚠ $message${NC}"
    elif [ "$status" = "INFO" ]; then
        echo -e "${BLUE}ℹ $message${NC}"
    else
        echo "$message"
    fi
}

# Function to check if a directory exists
check_directory() {
    if [ ! -d "$1" ]; then
        print_status "ERROR" "Directory $1 not found!"
        exit 1
    fi
}

# Function to check if Node.js is available
check_node() {
    if ! command -v node &> /dev/null; then
        print_status "ERROR" "Node.js is not installed or not in PATH"
        exit 1
    fi
    print_status "INFO" "Using Node.js $(node --version)"
}

# Function to check if backend server is running
check_backend_server() {
    if curl -s http://localhost:3001/ping > /dev/null 2>&1; then
        print_status "SUCCESS" "Backend server is already running at http://localhost:3001"
        return 0
    else
        print_status "WARNING" "Backend server not running at http://localhost:3001"
        return 1
    fi
}

# Function to start backend server for tests
start_backend_server() {
    print_status "INFO" "Starting backend server for integration tests..."
    cd backend
    
    # Start server in background
    nohup node src/network/CertificateNode.js 3001 http://localhost:3001 > /dev/null 2>&1 &
    SERVER_PID=$!
    BACKEND_SERVER_STARTED=true
    
    # Wait for server to start
    sleep 5
    
    if curl -s http://localhost:3001/ping > /dev/null 2>&1; then
        print_status "SUCCESS" "Backend server started successfully (PID: $SERVER_PID)"
        cd ..
        return 0
    else
        print_status "ERROR" "Failed to start backend server"
        cd ..
        return 1
    fi
}

# Function to stop backend server
stop_backend_server() {
    if [ "$BACKEND_SERVER_STARTED" = true ] && [ ! -z "$SERVER_PID" ]; then
        print_status "INFO" "Stopping backend server (PID: $SERVER_PID)..."
        kill $SERVER_PID 2>/dev/null || true
        sleep 2
        print_status "SUCCESS" "Backend server stopped"
    fi
}

# Function to install dependencies if needed
install_dependencies() {
    local dir=$1
    local name=$2
    
    if [ ! -d "$dir/node_modules" ]; then
        print_status "WARNING" "$name dependencies not found. Installing..."
        cd "$dir"
        if npm install > /dev/null 2>&1; then
            print_status "SUCCESS" "$name dependencies installed"
        else
            print_status "ERROR" "Failed to install $name dependencies"
            cd ..
            exit 1
        fi
        cd ..
    else
        print_status "INFO" "$name dependencies already installed"
    fi
}

# Function to run backend integration tests
run_backend_tests() {
    print_status "INFO" "Starting Backend Integration Tests..."
    echo "==========================================="
    
    cd backend
    
    # Check if the integration test file exists
    if [ ! -f "src/test/IntegrationTest.js" ]; then
        print_status "ERROR" "Backend integration test file not found!"
        cd ..
        return 1
    fi
    
    # Run the integration tests
    echo ""
    print_status "INFO" "Executing: npm run test:integration"
    echo ""
    
    if npm run test:integration; then
        BACKEND_RESULT=0
        print_status "SUCCESS" "Backend integration tests completed successfully"
    else
        BACKEND_RESULT=1
        print_status "ERROR" "Backend integration tests failed"
    fi
    
    cd ..
    echo ""
    return $BACKEND_RESULT
}

# Function to run frontend integration tests
run_frontend_tests() {
    print_status "INFO" "Starting Frontend Integration Tests..."
    echo "==========================================="
    
    cd frontend
    
    # Check if the integration test file exists
    if [ ! -f "integration-test.js" ]; then
        print_status "ERROR" "Frontend integration test file not found!"
        cd ..
        return 1
    fi
    
    # Run the integration tests
    echo ""
    print_status "INFO" "Executing: npm run test:integration"
    echo ""
    
    if npm run test:integration; then
        FRONTEND_RESULT=0
        print_status "SUCCESS" "Frontend integration tests completed successfully"
    else
        FRONTEND_RESULT=1
        print_status "ERROR" "Frontend integration tests failed"
    fi
    
    cd ..
    echo ""
    return $FRONTEND_RESULT
}

# Function to run basic E2E tests
run_e2e_tests() {
    print_status "INFO" "Starting End-to-End Validation Tests..."
    echo "==========================================="
    
    local tests_passed=0
    local total_tests=3
    
    # Test ping endpoint
    if curl -s http://localhost:3001/ping > /dev/null 2>&1; then
        print_status "SUCCESS" "Ping endpoint accessible"
        tests_passed=$((tests_passed + 1))
    else
        print_status "ERROR" "Ping endpoint failed"
    fi
    
    # Test blockchain endpoint
    if curl -s http://localhost:3001/blockchain > /dev/null 2>&1; then
        print_status "SUCCESS" "Blockchain endpoint accessible"
        tests_passed=$((tests_passed + 1))
    else
        print_status "ERROR" "Blockchain endpoint failed"
    fi
    
    # Test wallets endpoint
    if curl -s http://localhost:3001/wallets > /dev/null 2>&1; then
        print_status "SUCCESS" "Wallets endpoint accessible"
        tests_passed=$((tests_passed + 1))
    else
        print_status "ERROR" "Wallets endpoint failed"
    fi
    
    if [ $tests_passed -eq $total_tests ]; then
        E2E_RESULT=0
        print_status "SUCCESS" "All E2E validation tests passed ($tests_passed/$total_tests)"
    else
        E2E_RESULT=1
        print_status "ERROR" "E2E validation tests failed ($tests_passed/$total_tests)"
    fi
    
    echo ""
    return $E2E_RESULT
}

# Function to display final results
display_summary() {
    echo "==========================================="
    echo "TEST EXECUTION SUMMARY"
    echo "==========================================="
    echo ""
    
    if [ $BACKEND_RESULT -eq 0 ]; then
        print_status "SUCCESS" "Backend Integration Tests: PASSED"
    else
        print_status "ERROR" "Backend Integration Tests: FAILED"
    fi
    
    if [ $FRONTEND_RESULT -eq 0 ]; then
        print_status "SUCCESS" "Frontend Integration Tests: PASSED"
    else
        print_status "ERROR" "Frontend Integration Tests: FAILED"
    fi
    
    if [ $E2E_RESULT -eq 0 ]; then
        print_status "SUCCESS" "End-to-End Tests: PASSED"
    else
        print_status "ERROR" "End-to-End Tests: FAILED"
    fi
    
    echo ""
    
    local total_failed=$((BACKEND_RESULT + FRONTEND_RESULT + E2E_RESULT))
    local total_suites=3
    local passed_suites=$((total_suites - total_failed))
    
    echo "Test Suites: $passed_suites/$total_suites passed"
    
    if [ $total_failed -eq 0 ]; then
        print_status "SUCCESS" "All integration test suites passed! 🎉"
        echo ""
        echo "The blockchain certificate system is working correctly."
        return 0
    else
        print_status "ERROR" "$total_failed test suite(s) failed"
        echo ""
        echo "Please check the test output above for details."
        return 1
    fi
}

# Cleanup function
cleanup() {
    echo ""
    print_status "INFO" "Cleaning up..."
    stop_backend_server
}

# Main execution flow
main() {
    echo "Starting comprehensive integration test execution..."
    echo ""
    
    # Set up trap for cleanup
    trap cleanup EXIT INT
    
    # Pre-flight checks
    print_status "INFO" "Performing pre-flight checks..."
    check_node
    check_directory "backend"
    check_directory "frontend"
    echo ""
    
    # Install dependencies if needed
    print_status "INFO" "Checking dependencies..."
    install_dependencies "backend" "Backend"
    install_dependencies "frontend" "Frontend"
    echo ""
    
    # Check if backend server is running, start if needed
    if ! check_backend_server; then
        if ! start_backend_server; then
            print_status "ERROR" "Cannot proceed without backend server"
            exit 1
        fi
    fi
    echo ""
    
    # Run backend tests
    run_backend_tests
    
    # Small delay between test suites
    sleep 2
    
    # Run frontend tests
    run_frontend_tests
    
    # Small delay before E2E tests
    sleep 2
    
    # Run E2E tests
    run_e2e_tests
    
    # Display summary
    display_summary
    
    # Exit with appropriate code
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo "Integration test execution completed successfully!"
    else
        echo "Integration test execution completed with failures."
    fi
    
    return $exit_code
}

# Handle script interruption
trap 'echo ""; print_status "WARNING" "Test execution interrupted by user"; cleanup; exit 130' INT

# Run main function
main "$@"
exit $?
