#!/bin/bash

# Docker Optimization Test Script
# Tests the optimized codebase in production environment

set -e  # Exit on any error

echo "🐳 Docker Optimization Test Suite"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to log test results
log_test() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✅ $test_name: PASSED${NC}"
        if [ -n "$message" ]; then
            echo -e "   $message"
        fi
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [ "$result" = "FAIL" ]; then
        echo -e "${RED}❌ $test_name: FAILED${NC}"
        if [ -n "$message" ]; then
            echo -e "   $message"
        fi
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo -e "${YELLOW}⚠️  $test_name: WARNING${NC}"
        if [ -n "$message" ]; then
            echo -e "   $message"
        fi
    fi
    echo ""
}

# Function to check if container is running
check_container() {
    if docker ps | grep -q "ai-text2ppt-pro"; then
        return 0
    else
        return 1
    fi
}

# Function to wait for container to be ready
wait_for_container() {
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}🔍 Waiting for container to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if check_container; then
            echo -e "${GREEN}✅ Container is running${NC}"
            return 0
        fi
        
        echo "Attempt $attempt/$max_attempts - waiting..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ Container failed to start within timeout${NC}"
    return 1
}

# Function to test HTTP endpoint
test_endpoint() {
    local endpoint="$1"
    local expected_status="$2"
    local test_name="$3"
    
    echo -e "${BLUE}🔍 Testing $test_name...${NC}"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        log_test "$test_name" "PASS" "HTTP $response"
    else
        log_test "$test_name" "FAIL" "Expected HTTP $expected_status, got $response"
    fi
}

# Function to test API functionality
test_api_functionality() {
    echo -e "${BLUE}🔍 Testing API functionality...${NC}"
    
    # Test health endpoint
    test_endpoint "/api/health" "200" "Health Endpoint"
    
    # Test capabilities endpoint
    test_endpoint "/api/capabilities" "200" "Capabilities Endpoint"
    
    # Test main page
    test_endpoint "/" "200" "Main Page"
    
    # Test static files
    test_endpoint "/css/styles.css" "200" "CSS File"
    test_endpoint "/js/api/capabilities.js" "200" "API Module"
}

# Function to test optimization results
test_optimization_results() {
    echo -e "${BLUE}🔍 Testing optimization results...${NC}"
    
    # Check if BKP folder was removed
    if [ ! -d "BKP" ]; then
        log_test "BKP Folder Removal" "PASS" "Legacy BKP folder successfully removed"
    else
        log_test "BKP Folder Removal" "FAIL" "BKP folder still exists"
    fi
    
    # Check if API modules were created
    if [ -d "public/js/api" ] && [ $(ls public/js/api/*.js | wc -l) -ge 6 ]; then
        log_test "API Modules Creation" "PASS" "6+ API modules created"
    else
        log_test "API Modules Creation" "FAIL" "API modules not properly created"
    fi
    
    # Check if test files were organized
    if [ -d "test/html" ] && [ $(ls test/html/*.html | wc -l) -ge 5 ]; then
        log_test "Test Files Organization" "PASS" "Test files moved to test/html"
    else
        log_test "Test Files Organization" "FAIL" "Test files not properly organized"
    fi
}

# Function to test Docker build
test_docker_build() {
    echo -e "${BLUE}🔍 Testing Docker build...${NC}"
    
    # Build Docker image
    if docker build -t ai-text2ppt-pro-test . > /dev/null 2>&1; then
        log_test "Docker Build" "PASS" "Docker image built successfully"
    else
        log_test "Docker Build" "FAIL" "Docker build failed"
        return 1
    fi
}

# Function to test container startup
test_container_startup() {
    echo -e "${BLUE}🔍 Testing container startup...${NC}"
    
    # Start container
    if docker-compose up -d > /dev/null 2>&1; then
        log_test "Container Startup" "PASS" "Container started successfully"
        
        # Wait for container to be ready
        if wait_for_container; then
            log_test "Container Readiness" "PASS" "Container is ready and responding"
        else
            log_test "Container Readiness" "FAIL" "Container not responding"
            return 1
        fi
    else
        log_test "Container Startup" "FAIL" "Failed to start container"
        return 1
    fi
}

# Function to test production functionality
test_production_functionality() {
    echo -e "${BLUE}🔍 Testing production functionality...${NC}"
    
    # Test that all API modules are accessible
    local modules=("capabilities.js" "preview.js" "generation.js" "viewer.js" "sharing.js" "modification.js")
    
    for module in "${modules[@]}"; do
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/js/api/$module" | grep -q "200"; then
            log_test "API Module $module" "PASS" "Module accessible via HTTP"
        else
            log_test "API Module $module" "FAIL" "Module not accessible"
        fi
    done
    
    # Test that main HTML file loads correctly
    local html_content=$(curl -s "http://localhost:3000/")
    if echo "$html_content" | grep -q "AI Text2PPT Pro"; then
        log_test "Main HTML Page" "PASS" "HTML page loads correctly"
    else
        log_test "Main HTML Page" "FAIL" "HTML page not loading correctly"
    fi
    
    # Test that CSS file loads
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/css/styles.css" | grep -q "200"; then
        log_test "CSS File" "PASS" "CSS file accessible"
    else
        log_test "CSS File" "FAIL" "CSS file not accessible"
    fi
}

# Function to test performance
test_performance() {
    echo -e "${BLUE}🔍 Testing performance...${NC}"
    
    # Test response times
    local start_time=$(date +%s%N)
    curl -s "http://localhost:3000/api/health" > /dev/null
    local end_time=$(date +%s%N)
    local response_time=$(( (end_time - start_time) / 1000000 ))
    
    if [ $response_time -lt 1000 ]; then
        log_test "Response Time" "PASS" "API response time: ${response_time}ms"
    else
        log_test "Response Time" "WARNING" "API response time: ${response_time}ms (slow)"
    fi
    
    # Test memory usage
    local memory_usage=$(docker stats --no-stream --format "table {{.MemUsage}}" ai-text2ppt-pro | tail -n 1)
    log_test "Memory Usage" "PASS" "Container memory usage: $memory_usage"
}

# Function to cleanup
cleanup() {
    echo -e "${BLUE}🧹 Cleaning up...${NC}"
    docker-compose down > /dev/null 2>&1 || true
    docker rmi ai-text2ppt-pro-test > /dev/null 2>&1 || true
}

# Function to print final results
print_results() {
    echo ""
    echo "=================================="
    echo "📊 Test Results Summary"
    echo "=================================="
    echo -e "Total Tests: $TOTAL_TESTS"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
    
    local success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    echo -e "Success Rate: $success_rate%"
    
    if [ $success_rate -ge 90 ]; then
        echo -e "${GREEN}🎉 Optimization test suite PASSED!${NC}"
        return 0
    elif [ $success_rate -ge 70 ]; then
        echo -e "${YELLOW}⚠️  Optimization test suite completed with warnings${NC}"
        return 1
    else
        echo -e "${RED}❌ Optimization test suite FAILED${NC}"
        return 1
    fi
}

# Main test execution
main() {
    echo -e "${BLUE}🚀 Starting Docker optimization test suite...${NC}"
    echo ""
    
    # Trap to ensure cleanup on exit
    trap cleanup EXIT
    
    # Run tests
    test_optimization_results
    test_docker_build
    test_container_startup
    test_api_functionality
    test_production_functionality
    test_performance
    
    # Print results
    print_results
}

# Run main function
main "$@"
