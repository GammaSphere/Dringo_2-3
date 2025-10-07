#!/bin/bash

# Dringo Lite - System Check Script
# This script checks if all components are properly installed and working
# Author: System Check
# Version: 1.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check Node.js
check_nodejs() {
    log "Checking Node.js..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        success "Node.js: $NODE_VERSION"
        
        # Check version
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -ge 14 ]; then
            success "Node.js version is compatible"
        else
            warning "Node.js version is too old (need 14+)"
        fi
    else
        error "Node.js not found"
        return 1
    fi
    
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        success "npm: $NPM_VERSION"
    else
        error "npm not found"
        return 1
    fi
}

# Check MongoDB
check_mongodb() {
    log "Checking MongoDB..."
    
    if command -v mongod &> /dev/null; then
        MONGODB_VERSION=$(mongod --version | head -n1)
        success "MongoDB: $MONGODB_VERSION"
    else
        error "MongoDB not found"
        return 1
    fi
    
    # Check if service is running
    if systemctl is-active --quiet mongod; then
        success "MongoDB service is running"
    else
        warning "MongoDB service is not running"
        info "Start with: sudo systemctl start mongod"
    fi
    
    # Test connection
    if mongosh --eval "db.runCommand('ping')" --quiet 2>/dev/null; then
        success "MongoDB connection successful"
    else
        warning "MongoDB connection failed"
    fi
}

# Check CUPS and printer
check_printer() {
    log "Checking printer system..."
    
    if command -v lp &> /dev/null; then
        success "CUPS is installed"
    else
        error "CUPS not found"
        return 1
    fi
    
    # Check CUPS service
    if systemctl is-active --quiet cups; then
        success "CUPS service is running"
    else
        warning "CUPS service is not running"
        info "Start with: sudo systemctl start cups"
    fi
    
    # Check printer
    if lpstat -p XP58 2>/dev/null; then
        success "Printer XP58 is configured"
        
        # Test printer
        if echo "Printer test from Dringo Lite - $(date)" | lp -d XP58 2>/dev/null; then
            success "Printer test successful"
        else
            warning "Printer test failed"
        fi
    else
        warning "Printer XP58 not configured"
        info "Configure with: sudo lpadmin -p XP58 -E -v usb://XP-58 -m raw"
    fi
}

# Check project dependencies
check_project() {
    log "Checking project dependencies..."
    
    if [ -f "package.json" ]; then
        success "package.json found"
    else
        error "package.json not found"
        return 1
    fi
    
    if [ -d "node_modules" ]; then
        success "node_modules directory exists"
        
        # Check key dependencies
        if [ -d "node_modules/express" ]; then
            success "Express.js installed"
        else
            warning "Express.js not found"
        fi
        
        if [ -d "node_modules/mongoose" ]; then
            success "Mongoose installed"
        else
            warning "Mongoose not found"
        fi
        
        if [ -d "node_modules/node-telegram-bot-api" ]; then
            success "Telegram Bot API installed"
        else
            warning "Telegram Bot API not found"
        fi
        
        if [ -d "node_modules/node-thermal-printer" ]; then
            success "Thermal Printer library installed"
        else
            warning "Thermal Printer library not found"
        fi
    else
        warning "node_modules not found"
        info "Install with: npm install"
    fi
}

# Check environment
check_environment() {
    log "Checking environment configuration..."
    
    if [ -f ".env" ]; then
        success ".env file exists"
        
        # Check for bot token
        if grep -q "CUSTOMER_BOT_TOKEN=" .env && ! grep -q "your_telegram_bot_token_here" .env; then
            success "Bot token is configured"
        else
            warning "Bot token not configured in .env"
        fi
        
        # Check for port
        if grep -q "PORT=" .env; then
            PORT=$(grep "PORT=" .env | cut -d'=' -f2)
            success "Port configured: $PORT"
        else
            info "Using default port 3000"
        fi
    else
        warning ".env file not found"
        info "Create with: cp .env.example .env (if available)"
    fi
}

# Check system resources
check_resources() {
    log "Checking system resources..."
    
    # Memory
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    USED_MEM=$(free -m | awk 'NR==2{printf "%.0f", $3}')
    MEM_PERCENT=$((USED_MEM * 100 / TOTAL_MEM))
    
    if [ "$TOTAL_MEM" -lt 512 ]; then
        warning "Low memory: ${TOTAL_MEM}MB (recommended: 512MB+)"
    else
        success "Memory: ${TOTAL_MEM}MB total, ${USED_MEM}MB used (${MEM_PERCENT}%)"
    fi
    
    # Disk space
    DISK_USAGE=$(df -h . | awk 'NR==2{print $5}' | sed 's/%//')
    DISK_AVAILABLE=$(df -h . | awk 'NR==2{print $4}')
    
    if [ "$DISK_USAGE" -gt 90 ]; then
        warning "Low disk space: ${DISK_USAGE}% used"
    else
        success "Disk space: ${DISK_USAGE}% used, ${DISK_AVAILABLE} available"
    fi
    
    # CPU
    CPU_CORES=$(nproc)
    CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    success "CPU: ${CPU_CORES} cores, load: ${CPU_LOAD}"
}

# Check network
check_network() {
    log "Checking network connectivity..."
    
    # Check internet connection
    if ping -c 1 8.8.8.8 &> /dev/null; then
        success "Internet connection working"
    else
        warning "No internet connection"
    fi
    
    # Check Telegram API
    if curl -s https://api.telegram.org &> /dev/null; then
        success "Telegram API accessible"
    else
        warning "Cannot reach Telegram API"
    fi
}

# Check processes
check_processes() {
    log "Checking running processes..."
    
    # Check if bot is running
    if pgrep -f "node.*index.js" &> /dev/null; then
        success "Bot process is running"
        BOT_PID=$(pgrep -f "node.*index.js")
        info "Bot PID: $BOT_PID"
    else
        info "Bot process not running"
    fi
    
    # Check MongoDB process
    if pgrep mongod &> /dev/null; then
        success "MongoDB process is running"
    else
        warning "MongoDB process not running"
    fi
    
    # Check CUPS process
    if pgrep cupsd &> /dev/null; then
        success "CUPS process is running"
    else
        warning "CUPS process not running"
    fi
}

# Check logs
check_logs() {
    log "Checking system logs..."
    
    # Check MongoDB logs
    if [ -f "/var/log/mongodb/mongod.log" ]; then
        RECENT_ERRORS=$(tail -n 50 /var/log/mongodb/mongod.log | grep -i error | wc -l)
        if [ "$RECENT_ERRORS" -gt 0 ]; then
            warning "MongoDB has $RECENT_ERRORS recent errors"
        else
            success "MongoDB logs look clean"
        fi
    fi
    
    # Check CUPS logs
    if [ -f "/var/log/cups/error_log" ]; then
        RECENT_ERRORS=$(tail -n 50 /var/log/cups/error_log | grep -i error | wc -l)
        if [ "$RECENT_ERRORS" -gt 0 ]; then
            warning "CUPS has $RECENT_ERRORS recent errors"
        else
            success "CUPS logs look clean"
        fi
    fi
}

# Generate report
generate_report() {
    log "Generating system report..."
    
    REPORT_FILE="system_check_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "Dringo Lite - System Check Report"
        echo "Generated: $(date)"
        echo "=================================="
        echo ""
        
        echo "System Information:"
        echo "OS: $(uname -a)"
        echo "Uptime: $(uptime)"
        echo ""
        
        echo "Node.js: $(node --version 2>/dev/null || echo 'Not found')"
        echo "npm: $(npm --version 2>/dev/null || echo 'Not found')"
        echo "MongoDB: $(mongod --version 2>/dev/null | head -n1 || echo 'Not found')"
        echo ""
        
        echo "Memory:"
        free -h
        echo ""
        
        echo "Disk Usage:"
        df -h .
        echo ""
        
        echo "Running Processes:"
        ps aux | grep -E "(node|mongod|cupsd)" | grep -v grep
        echo ""
        
        echo "Network:"
        netstat -tlnp | grep -E ":(3000|27017|631)"
        echo ""
        
    } > "$REPORT_FILE"
    
    success "Report saved to: $REPORT_FILE"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "    Dringo Lite - System Check"
    echo "=========================================="
    echo -e "${NC}"
    
    local exit_code=0
    
    check_nodejs || exit_code=1
    check_mongodb || exit_code=1
    check_printer || exit_code=1
    check_project || exit_code=1
    check_environment || exit_code=1
    check_resources
    check_network
    check_processes
    check_logs
    generate_report
    
    echo -e "${BLUE}"
    echo "=========================================="
    echo "    System Check Complete"
    echo "=========================================="
    echo -e "${NC}"
    
    if [ $exit_code -eq 0 ]; then
        success "All critical components are working!"
        echo -e "${GREEN}Your system is ready to run Dringo Lite bot.${NC}"
    else
        error "Some critical components have issues."
        echo -e "${YELLOW}Please fix the issues above before running the bot.${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}Useful commands:${NC}"
    echo "  Start bot: npm start"
    echo "  Check logs: tail -f logs/app.log (if using PM2)"
    echo "  Restart services: sudo systemctl restart mongod cups"
    echo "  Test printer: echo 'Test' | lp -d XP58"
    echo ""
    
    exit $exit_code
}

# Run main function
main "$@"


