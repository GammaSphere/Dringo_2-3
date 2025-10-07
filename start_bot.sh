#!/bin/bash

# Dringo Lite - Bot Startup Script
# This script starts the bot with proper process management
# Author: Bot Management
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

# Check if bot is already running
check_running() {
    if pgrep -f "node.*index.js" &> /dev/null; then
        BOT_PID=$(pgrep -f "node.*index.js")
        warning "Bot is already running with PID: $BOT_PID"
        echo "Do you want to restart it? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            log "Stopping existing bot process..."
            kill "$BOT_PID" 2>/dev/null || true
            sleep 2
        else
            info "Exiting without changes"
            exit 0
        fi
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js not found. Please run setup_linux.sh first"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm not found. Please run setup_linux.sh first"
        exit 1
    fi
    
    # Check MongoDB
    if ! command -v mongod &> /dev/null; then
        error "MongoDB not found. Please run setup_linux.sh first"
        exit 1
    fi
    
    # Check if MongoDB is running
    if ! systemctl is-active --quiet mongod; then
        warning "MongoDB service not running, starting it..."
        sudo systemctl start mongod
    fi
    
    # Check CUPS
    if ! command -v lp &> /dev/null; then
        error "CUPS not found. Please run setup_linux.sh first"
        exit 1
    fi
    
    # Check if CUPS is running
    if ! systemctl is-active --quiet cups; then
        warning "CUPS service not running, starting it..."
        sudo systemctl start cups
    fi
    
    success "All prerequisites are available"
}

# Check project files
check_project() {
    log "Checking project files..."
    
    if [ ! -f "package.json" ]; then
        error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
    
    if [ ! -f "index.js" ]; then
        error "index.js not found. Are you in the correct directory?"
        exit 1
    fi
    
    if [ ! -d "node_modules" ]; then
        warning "node_modules not found, installing dependencies..."
        npm install
    fi
    
    success "Project files are ready"
}

# Check environment
check_environment() {
    log "Checking environment configuration..."
    
    if [ ! -f ".env" ]; then
        error ".env file not found"
        info "Please create .env file with your bot token:"
        echo "CUSTOMER_BOT_TOKEN=your_bot_token_here"
        echo "PORT=3000"
        exit 1
    fi
    
    # Check if bot token is configured
    if grep -q "your_telegram_bot_token_here" .env; then
        error "Bot token not configured in .env file"
        info "Please edit .env file and add your actual bot token"
        exit 1
    fi
    
    success "Environment configuration is valid"
}

# Install PM2 if not present
install_pm2() {
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2 process manager..."
        npm install -g pm2
        success "PM2 installed"
    else
        success "PM2 already installed"
    fi
}

# Start bot with PM2
start_with_pm2() {
    log "Starting bot with PM2..."
    
    # Stop existing PM2 process if running
    pm2 stop dringo-lite 2>/dev/null || true
    pm2 delete dringo-lite 2>/dev/null || true
    
    # Start bot
    pm2 start index.js --name "dringo-lite" --watch
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null || true
    
    success "Bot started with PM2"
    
    # Show status
    pm2 status
}

# Start bot directly
start_direct() {
    log "Starting bot directly..."
    
    # Create logs directory
    mkdir -p logs
    
    # Start bot and redirect output to log file
    nohup node index.js > logs/bot.log 2>&1 &
    BOT_PID=$!
    
    # Save PID
    echo "$BOT_PID" > bot.pid
    
    success "Bot started with PID: $BOT_PID"
    info "Logs are being written to: logs/bot.log"
}

# Test bot functionality
test_bot() {
    log "Testing bot functionality..."
    
    # Wait a moment for bot to start
    sleep 3
    
    # Check if process is still running
    if kill -0 "$BOT_PID" 2>/dev/null; then
        success "Bot process is running"
    else
        error "Bot process stopped unexpectedly"
        if [ -f "logs/bot.log" ]; then
            echo "Last 10 lines of log:"
            tail -n 10 logs/bot.log
        fi
        exit 1
    fi
    
    # Check if port is listening
    if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
        success "Bot is listening on port 3000"
    else
        warning "Bot may not be listening on port 3000"
    fi
}

# Show bot information
show_info() {
    echo ""
    echo -e "${BLUE}=========================================="
    echo "    Dringo Lite Bot Information"
    echo "==========================================${NC}"
    echo ""
    
    if command -v pm2 &> /dev/null && pm2 list | grep -q "dringo-lite"; then
        echo -e "${YELLOW}Process Manager:${NC} PM2"
        echo -e "${YELLOW}Status:${NC} $(pm2 jlist | jq -r '.[] | select(.name=="dringo-lite") | .pm2_env.status')"
        echo -e "${YELLOW}PID:${NC} $(pm2 jlist | jq -r '.[] | select(.name=="dringo-lite") | .pid')"
        echo -e "${YELLOW}Uptime:${NC} $(pm2 jlist | jq -r '.[] | select(.name=="dringo-lite") | .pm2_env.pm_uptime')"
    else
        if [ -f "bot.pid" ]; then
            BOT_PID=$(cat bot.pid)
            echo -e "${YELLOW}Process Manager:${NC} Direct"
            echo -e "${YELLOW}PID:${NC} $BOT_PID"
            echo -e "${YELLOW}Status:${NC} $(kill -0 "$BOT_PID" 2>/dev/null && echo "Running" || echo "Stopped")"
        fi
    fi
    
    echo ""
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo "  View logs: tail -f logs/bot.log"
    echo "  Stop bot: pm2 stop dringo-lite (if using PM2)"
    echo "  Restart bot: pm2 restart dringo-lite (if using PM2)"
    echo "  Check status: pm2 status (if using PM2)"
    echo "  Test printer: test_xp58.sh"
    echo ""
    
    echo -e "${YELLOW}Bot Endpoints:${NC}"
    echo "  Health check: http://localhost:3000/health"
    echo "  Add products: http://localhost:3000/addSampleCoffees"
    echo "  Get orders: http://localhost:3000/getOrders"
    echo ""
    
    echo -e "${GREEN}Bot is ready to receive Telegram messages!${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "    Dringo Lite - Bot Startup"
    echo "=========================================="
    echo -e "${NC}"
    
    check_running
    check_prerequisites
    check_project
    check_environment
    
    # Ask user for startup method
    echo "Choose startup method:"
    echo "1) PM2 (recommended for production)"
    echo "2) Direct (simple, for testing)"
    read -p "Enter choice (1 or 2): " choice
    
    case $choice in
        1)
            install_pm2
            start_with_pm2
            ;;
        2)
            start_direct
            test_bot
            ;;
        *)
            error "Invalid choice"
            exit 1
            ;;
    esac
    
    show_info
}

# Run main function
main "$@"


