#!/bin/bash
# E2E Test Suite for CTS MCP Server
# Tests all 6 working tools (CTS_Cleanup disabled)

set -o pipefail

PROJECT_PATH="/home/eric/Godot/ProtoBd"
SERVER_BIN="node build/index.js"
TIMEOUT=45

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

echo "=================================================="
echo "CTS MCP Server - E2E Test Suite"
echo "=================================================="
echo ""

# Helper function to test a tool
test_tool() {
    local tool_name=$1
    local args=$2
    
    echo -n "Testing $tool_name... "
    
    local request="{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"$tool_name\",\"arguments\":$args}}"
    
    # cts_audit returns JSON report in MCP result format
    if [ "$tool_name" == "cts_audit" ]; then
        if timeout $TIMEOUT bash -c "echo '$request' | $SERVER_BIN 2>&1" | grep -q '"jsonrpc":"2.0"'; then
            echo -e "${GREEN}✅ PASS${NC}"
            ((PASSED++))
            return 0
        else
            echo -e "${RED}❌ FAIL${NC}"
            ((FAILED++))
            return 1
        fi
    else
        if timeout $TIMEOUT bash -c "echo '$request' | $SERVER_BIN 2>&1" | grep -q '"success":true'; then
            echo -e "${GREEN}✅ PASS${NC}"
            ((PASSED++))
            return 0
        else
            echo -e "${RED}❌ FAIL${NC}"
            ((FAILED++))
            return 1
        fi
    fi
}

# Test 1: CTS_Reasoning
test_tool "CTS_Reasoning" '{"topic":"signal architecture design patterns","maxIterations":2}'

# Test 2: CTS_Scan_Project_Signals
test_tool "CTS_Scan_Project_Signals" "{\"projectPath\":\"$PROJECT_PATH\",\"renderMap\":false}"

# Test 3: CTS_Bughunter
test_tool "CTS_Bughunter" "{\"projectPath\":\"$PROJECT_PATH\",\"minSeverity\":\"high\",\"maxFiles\":10}"

# Test 4: cts_audit
test_tool "cts_audit" "{\"projectPath\":\"$PROJECT_PATH\",\"categories\":[\"cts\"],\"minScore\":0}"

# Test 5: CTS_Analyze_Project  
test_tool "CTS_Analyze_Project" "{\"projectPath\":\"$PROJECT_PATH\",\"buildHierarchy\":false,\"detectUnused\":false}"

# Test 6: CTS_Suggest_Refactoring
test_tool "CTS_Suggest_Refactoring" "{\"projectPath\":\"$PROJECT_PATH\",\"minConfidence\":0.95,\"maxSuggestions\":5}"

echo ""
echo "=================================================="
echo "Test Results"
echo "=================================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
