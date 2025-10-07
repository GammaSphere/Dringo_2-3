#!/bin/bash

# Dringo Lite - Linux Setup Script
# This script checks and installs all necessary components for the coffee bot
# Author: System Setup
# Version: 1.0

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
        exit 1
    fi
}

# Check system requirements
check_system_requirements() {
    log "Checking system requirements..."
    
    # Check if running on supported Ubuntu version
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        if [[ "$ID" == "ubuntu" ]]; then
            case "$VERSION_ID" in
                "22.04"|"24.04"|"20.04"|"18.04")
                    success "Ubuntu $VERSION_ID is supported"
                    ;;
                *)
                    warning "Ubuntu $VERSION_ID may not be fully supported, but continuing..."
                    ;;
            esac
        else
            warning "Non-Ubuntu system detected: $ID"
        fi
    fi
    
    # Check available memory
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [ "$TOTAL_MEM" -lt 512 ]; then
        warning "Low memory detected: ${TOTAL_MEM}MB (recommended: 512MB+)"
    else
        success "Memory: ${TOTAL_MEM}MB"
    fi
    
    # Check disk space
    DISK_SPACE=$(df -h . | awk 'NR==2{print $4}')
    success "Available disk space: $DISK_SPACE"
    
    # Check internet connectivity
    if ping -c 1 google.com &> /dev/null; then
        success "Internet connectivity verified"
    else
        warning "Internet connectivity issues detected"
    fi
}

# Check Linux distribution
check_distro() {
    log "Checking Linux distribution..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$ID
        VERSION=$VERSION_ID
        success "Detected: $PRETTY_NAME"
    else
        error "Cannot detect Linux distribution"
        exit 1
    fi
    
    # Check if supported
    case $DISTRO in
        ubuntu|debian)
            success "Supported distribution: $DISTRO"
            ;;
        *)
            warning "Distribution $DISTRO may not be fully supported, but continuing..."
            ;;
    esac
}

# Update package lists
update_packages() {
    log "Updating package lists..."
    
    if command -v apt-get &> /dev/null; then
        sudo apt-get update -y
        success "Package lists updated"
    elif command -v yum &> /dev/null; then
        sudo yum update -y
        success "Package lists updated"
    else
        warning "Package manager not found, skipping update"
    fi
}

# Install Node.js
install_nodejs() {
    log "Checking Node.js installation..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        success "Node.js already installed: $NODE_VERSION"
        
        # Check if version is 14 or higher
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -lt 14 ]; then
            warning "Node.js version is too old ($NODE_VERSION), updating..."
            install_nodejs_new
        fi
    else
        log "Node.js not found, installing..."
        install_nodejs_new
    fi
}

install_nodejs_new() {
    log "Installing Node.js 18.x..."
    
    if command -v apt-get &> /dev/null; then
        # Install Node.js 18.x for Ubuntu/Debian
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        # Install Node.js 18.x for CentOS/RHEL
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    else
        error "Cannot install Node.js automatically on this system"
        exit 1
    fi
    
    success "Node.js installed: $(node --version)"
}

# Install MongoDB
install_mongodb() {
    log "Checking MongoDB installation..."
    
    if command -v mongod &> /dev/null; then
        success "MongoDB already installed: $(mongod --version | head -n1)"
    else
        log "MongoDB not found, installing..."
        
        if command -v apt-get &> /dev/null; then
            # Clean up any existing MongoDB configurations
            log "Cleaning up any existing MongoDB configurations..."
            sudo rm -f /etc/apt/sources.list.d/mongodb-org-*.list
            sudo rm -f /usr/share/keyrings/mongodb-server-*.gpg
            
            # Get Ubuntu version
            UBUNTU_VERSION=$(lsb_release -cs)
            log "Detected Ubuntu version: $UBUNTU_VERSION"
            
            # Install MongoDB based on Ubuntu version using official method
            # Note: Using MongoDB 6.0.26 to match current bot compatibility
            case $UBUNTU_VERSION in
                "noble")
                    log "Installing MongoDB 6.0 for Ubuntu Noble (24.04) - Bot Compatible Version..."
                    # Import the MongoDB public GPG key for 6.0
                    curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
                        sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
                    # Create the MongoDB source list file
                    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | \
                        sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
                    ;;
                "jammy")
                    log "Installing MongoDB 6.0 for Ubuntu Jammy (22.04) - Bot Compatible Version..."
                    # Import the MongoDB public GPG key for 6.0
                    curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
                        sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
                    # Create the MongoDB source list file
                    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | \
                        sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
                    ;;
                "focal")
                    log "Installing MongoDB 6.0 for Ubuntu Focal (20.04) - Bot Compatible Version..."
                    # Import the MongoDB public GPG key for 6.0
                    curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
                        sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
                    # Create the MongoDB source list file
                    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | \
                        sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
                    ;;
                "bionic")
                    log "Installing MongoDB 6.0 for Ubuntu Bionic (18.04) - Bot Compatible Version..."
                    # Import the MongoDB public GPG key for 6.0
                    curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
                        sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
                    # Create the MongoDB source list file
                    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/6.0 multiverse" | \
                        sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
                    ;;
                *)
                    warning "Ubuntu version $UBUNTU_VERSION not directly supported, trying MongoDB 6.0 as fallback..."
                    # Try MongoDB 6.0 as fallback
                    curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
                        sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
                    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | \
                        sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
                    ;;
            esac
            
            # Update package database
            log "Updating package database..."
            sudo apt-get update
            
            # Install MongoDB packages (specific version 6.0.26)
            log "Installing MongoDB packages (version 6.0.26)..."
            sudo apt-get install -y mongodb-org=6.0.26 mongodb-org-server=6.0.26 mongodb-org-shell=6.0.26 mongodb-org-mongos=6.0.26 mongodb-org-tools=6.0.26
            
            # Prevent automatic upgrades of MongoDB packages
            log "Preventing automatic upgrades of MongoDB packages..."
            echo "mongodb-org hold" | sudo dpkg --set-selections
            echo "mongodb-org-server hold" | sudo dpkg --set-selections
            echo "mongodb-org-shell hold" | sudo dpkg --set-selections
            echo "mongodb-org-mongos hold" | sudo dpkg --set-selections
            echo "mongodb-org-tools hold" | sudo dpkg --set-selections
            
        elif command -v yum &> /dev/null; then
            # Install MongoDB for CentOS/RHEL
            sudo yum install -y mongodb-org
        else
            error "Cannot install MongoDB automatically on this system"
            exit 1
        fi
        
        success "MongoDB installed"
    fi
    
    # Start and enable MongoDB
    log "Starting MongoDB service..."
    sudo systemctl start mongod
    sudo systemctl enable mongod
    success "MongoDB service started and enabled"
    
    # Verify installation
    log "Verifying MongoDB installation..."
    if mongod --version &> /dev/null; then
        success "MongoDB verification successful: $(mongod --version | head -n1)"
        
        # Test MongoDB connection
        log "Testing MongoDB connection..."
        if command -v mongosh &> /dev/null; then
            if mongosh --eval "db.runCommand('ping')" --quiet &> /dev/null; then
                success "MongoDB connection test successful"
            else
                warning "MongoDB connection test failed, but service is running"
            fi
        else
            log "mongosh not available, skipping connection test"
        fi
        
        # Check service status
        if systemctl is-active --quiet mongod; then
            success "MongoDB service is running"
        else
            warning "MongoDB service is not running, attempting to start..."
            sudo systemctl start mongod
            if systemctl is-active --quiet mongod; then
                success "MongoDB service started successfully"
            else
                error "Failed to start MongoDB service"
            fi
        fi
    else
        error "MongoDB installation verification failed"
        log "Troubleshooting steps:"
        log "1. Check if MongoDB service is running: sudo systemctl status mongod"
        log "2. Check MongoDB logs: sudo journalctl -u mongod"
        log "3. Try manual installation: sudo apt-get install -y mongodb-org"
    fi
}

# Configure MongoDB database
configure_mongodb() {
    log "Configuring MongoDB database for Dringo Lite..."
    
    # Check if MongoDB is running
    if ! systemctl is-active --quiet mongod; then
        warning "MongoDB service is not running, starting it..."
        sudo systemctl start mongod
        sleep 3
    fi
    
    # Check if mongosh is available
    if ! command -v mongosh &> /dev/null; then
        warning "mongosh not available, installing MongoDB shell..."
        sudo apt-get install -y mongodb-mongosh
    fi
    
    # Create database and import data
    log "Creating dringo-lite database..."
    
    # Check if database files exist in latest db directory
    if [ -f "latest db/dringo-lite.localizations.json" ] && [ -f "latest db/dringo-lite.products.json" ]; then
        log "Found database files in 'latest db' directory, importing data..."
        
        # Import localizations
        log "Importing localizations..."
        if mongosh dringo-lite --eval "
            try {
                db.localizations.drop();
                print('Dropped existing localizations collection');
            } catch (e) {
                print('No existing localizations collection to drop');
            }
        " --quiet; then
            success "Localizations collection prepared"
        else
            warning "Failed to prepare localizations collection"
        fi
        
        # Import localizations from JSON file
        if mongoimport --db dringo-lite --collection localizations --file "latest db/dringo-lite.localizations.json" --jsonArray --quiet; then
            success "Localizations imported successfully"
        else
            warning "Failed to import localizations, trying alternative method..."
            # Alternative method using mongosh
            if mongosh dringo-lite --eval "
                const fs = require('fs');
                const data = JSON.parse(fs.readFileSync('latest db/dringo-lite.localizations.json', 'utf8'));
                db.localizations.insertMany(data);
                print('Localizations imported: ' + data.length + ' documents');
            " --quiet; then
                success "Localizations imported using alternative method"
            else
                error "Failed to import localizations"
            fi
        fi
        
        # Import products
        log "Importing products..."
        if mongosh dringo-lite --eval "
            try {
                db.products.drop();
                print('Dropped existing products collection');
            } catch (e) {
                print('No existing products collection to drop');
            }
        " --quiet; then
            success "Products collection prepared"
        else
            warning "Failed to prepare products collection"
        fi
        
        # Import products from JSON file
        if mongoimport --db dringo-lite --collection products --file "latest db/dringo-lite.products.json" --jsonArray --quiet; then
            success "Products imported successfully"
        else
            warning "Failed to import products, trying alternative method..."
            # Alternative method using mongosh
            if mongosh dringo-lite --eval "
                const fs = require('fs');
                const data = JSON.parse(fs.readFileSync('latest db/dringo-lite.products.json', 'utf8'));
                db.products.insertMany(data);
                print('Products imported: ' + data.length + ' documents');
            " --quiet; then
                success "Products imported using alternative method"
            else
                error "Failed to import products"
            fi
        fi
        
        # Import customers if file exists
        if [ -f "latest db/dringo-lite.customers.json" ]; then
            log "Importing customers..."
            if mongosh dringo-lite --eval "
                try {
                    db.customers.drop();
                    print('Dropped existing customers collection');
                } catch (e) {
                    print('No existing customers collection to drop');
                }
            " --quiet; then
                success "Customers collection prepared"
            else
                warning "Failed to prepare customers collection"
            fi
            
            # Import customers from JSON file
            if mongoimport --db dringo-lite --collection customers --file "latest db/dringo-lite.customers.json" --jsonArray --quiet; then
                success "Customers imported successfully"
            else
                warning "Failed to import customers, trying alternative method..."
                # Alternative method using mongosh
                if mongosh dringo-lite --eval "
                    const fs = require('fs');
                    const data = JSON.parse(fs.readFileSync('latest db/dringo-lite.customers.json', 'utf8'));
                    db.customers.insertMany(data);
                    print('Customers imported: ' + data.length + ' documents');
                " --quiet; then
                    success "Customers imported using alternative method"
                else
                    error "Failed to import customers"
                fi
            fi
        else
            log "No customers file found, skipping customer import"
        fi
        
        # Verify data import
        log "Verifying data import..."
        if mongosh dringo-lite --eval "
            const localizationsCount = db.localizations.countDocuments();
            const productsCount = db.products.countDocuments();
            const customersCount = db.customers.countDocuments();
            print('Localizations: ' + localizationsCount + ' documents');
            print('Products: ' + productsCount + ' documents');
            print('Customers: ' + customersCount + ' documents');
            if (localizationsCount > 0 && productsCount > 0) {
                print('Database setup completed successfully');
            } else {
                print('Database setup may have issues');
            }
        " --quiet; then
            success "Database verification completed"
        else
            warning "Database verification failed"
        fi
        
    else
        warning "Database files not found in 'latest db/' directory"
        log "Expected files:"
        log "  - latest db/dringo-lite.localizations.json"
        log "  - latest db/dringo-lite.products.json"
        log "  - latest db/dringo-lite.customers.json (optional)"
        log "Creating empty database structure..."
        
        # Create empty collections
        mongosh dringo-lite --eval "
            db.createCollection('localizations');
            db.createCollection('products');
            db.createCollection('customers');
            db.createCollection('orders');
            print('Empty database structure created');
        " --quiet
        
        success "Empty database structure created"
    fi
    
    # Create indexes for better performance
    log "Creating database indexes..."
    if mongosh dringo-lite --eval "
        // Create indexes for localizations
        db.localizations.createIndex({ 'key': 1 }, { unique: true });
        print('Localizations key index created');
        
        // Create indexes for products
        db.products.createIndex({ 'status': 1 });
        print('Products status index created');
        
        // Create indexes for customers
        db.customers.createIndex({ 'telegramId': 1 }, { unique: true });
        print('Customers telegramId index created');
        
        // Create indexes for orders
        db.orders.createIndex({ 'status': 1 });
        db.orders.createIndex({ 'createdAt': -1 });
        print('Orders indexes created');
        
        print('All indexes created successfully');
    " --quiet; then
        success "Database indexes created"
    else
        warning "Failed to create some indexes"
    fi
    
    success "MongoDB database configuration completed"
}

# Install CUPS and printer drivers
install_cups() {
    log "Installing CUPS and printer drivers..."
    
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y cups cups-client cups-bsd
        sudo apt-get install -y printer-driver-all
        sudo apt-get install -y hplip  # HP printer support
        sudo apt-get install -y gutenprint  # Generic printer support
    elif command -v yum &> /dev/null; then
        sudo yum install -y cups cups-client
        sudo yum install -y hplip
        sudo yum install -y gutenprint
    else
        error "Cannot install CUPS automatically on this system"
        exit 1
    fi
    
    success "CUPS and printer drivers installed"
    
    # Start and enable CUPS
    sudo systemctl start cups
    sudo systemctl enable cups
    success "CUPS service started and enabled"
}

# Install additional dependencies
install_dependencies() {
    log "Installing additional system dependencies..."
    
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y \
            build-essential \
            curl \
            wget \
            git \
            unzip \
            software-properties-common \
            apt-transport-https \
            ca-certificates \
            gnupg \
            lsb-release \
            usbutils \
            sane-utils
    elif command -v yum &> /dev/null; then
        sudo yum groupinstall -y "Development Tools"
        sudo yum install -y \
            curl \
            wget \
            git \
            unzip \
            ca-certificates \
            usbutils \
            sane-backends
    else
        warning "Cannot install additional dependencies automatically"
    fi
    
    success "Additional dependencies installed"
}

# Check USB devices (for printer detection)
check_usb_devices() {
    log "Checking USB devices..."
    
    if command -v lsusb &> /dev/null; then
        USB_DEVICES=$(lsusb)
        if [ -n "$USB_DEVICES" ]; then
            success "USB devices detected:"
            echo "$USB_DEVICES" | while read line; do
                echo "  $line"
            done
        else
            warning "No USB devices detected"
        fi
    else
        warning "lsusb not available, cannot check USB devices"
    fi
}

# Setup printer
setup_printer() {
    log "Setting up thermal printer..."
    
    # Check if printer is connected
    if lpstat -p XP58 2>/dev/null; then
        success "Printer XP58 already configured"
    else
        log "Configuring XP58 thermal printer..."
        
        # Add printer (adjust interface as needed)
        sudo lpadmin -p XP58 -E -v usb://XP-58 -m drv:///sample.drv/xp58.ppd 2>/dev/null || {
            # Fallback: try generic thermal printer
            sudo lpadmin -p XP58 -E -v usb://Generic/Thermal -m raw 2>/dev/null || {
                warning "Could not auto-configure printer. Manual setup required."
                log "Please connect your thermal printer and run:"
                log "  sudo lpadmin -p XP58 -E -v usb://YOUR_PRINTER -m raw"
            }
        }
    fi
    
    # Test printer
    test_printer
}

# Test printer functionality
test_printer() {
    log "Testing printer functionality..."
    
    # Create test file
    cat > /tmp/printer_test.txt << EOF
================================
        PRINTER TEST
================================

This is a test print from Dringo Lite
Date: $(date)
System: $(uname -a)

If you can see this, the printer is working!

================================
EOF
    
    # Try to print
    if lp -d XP58 /tmp/printer_test.txt 2>/dev/null; then
        success "Printer test successful"
        rm -f /tmp/printer_test.txt
    else
        warning "Printer test failed. Check printer connection and configuration."
        log "Manual test command: lp -d XP58 /tmp/printer_test.txt"
    fi
}

# Check Node.js dependencies
check_node_dependencies() {
    log "Checking Node.js project dependencies..."
    
    if [ -f "package.json" ]; then
        if [ -d "node_modules" ]; then
            success "Node.js dependencies already installed"
        else
            log "Installing Node.js dependencies..."
            npm install
            success "Node.js dependencies installed"
        fi
    else
        warning "package.json not found in current directory"
    fi
}

# Create environment file
create_env_file() {
    log "Creating environment configuration..."
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Dringo Lite Environment Configuration
# Replace with your actual values

# Telegram Bot Token (required)
CUSTOMER_BOT_TOKEN=your_telegram_bot_token_here

# Server Port (optional, defaults to 3000)
PORT=3000

# MongoDB Connection (optional, defaults to local)
MONGODB_URI=mongodb://127.0.0.1:27017/dringo-lite

# Environment (optional)
NODE_ENV=production
EOF
        warning "Created .env file with default values"
        warning "Please edit .env file and add your Telegram bot token"
    else
        success ".env file already exists"
    fi
}

# Check system resources
check_system_resources() {
    log "Checking system resources..."
    
    # Check memory
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
    if [ "$TOTAL_MEM" -lt 512 ]; then
        warning "Low memory detected: ${TOTAL_MEM}MB (recommended: 512MB+)"
    else
        success "Memory: ${TOTAL_MEM}MB"
    fi
    
    # Check disk space
    DISK_SPACE=$(df -h . | awk 'NR==2{print $4}')
    success "Available disk space: $DISK_SPACE"
    
    # Check CPU
    CPU_CORES=$(nproc)
    success "CPU cores: $CPU_CORES"
}

# Final system check
final_check() {
    log "Performing final system check..."
    
    local all_good=true
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js not found"
        all_good=false
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm not found"
        all_good=false
    fi
    
    # Check MongoDB
    if ! command -v mongod &> /dev/null; then
        error "MongoDB not found"
        all_good=false
    fi
    
    # Check CUPS
    if ! command -v lp &> /dev/null; then
        error "CUPS not found"
        all_good=false
    fi
    
    # Check services
    if ! systemctl is-active --quiet mongod; then
        warning "MongoDB service not running"
    fi
    
    if ! systemctl is-active --quiet cups; then
        warning "CUPS service not running"
    fi
    
    if [ "$all_good" = true ]; then
        success "All core components are installed and ready!"
    else
        error "Some components are missing or not working"
        exit 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "    Dringo Lite - Linux Setup Script"
    echo "=========================================="
    echo -e "${NC}"
    
    check_root
    check_system_requirements
    check_distro
    update_packages
    install_dependencies
    install_nodejs
    install_mongodb
    configure_mongodb
    install_cups
    check_usb_devices
    setup_printer
    check_node_dependencies
    create_env_file
    check_system_resources
    final_check
    
    echo -e "${GREEN}"
    echo "=========================================="
    echo "    Setup Complete!"
    echo "=========================================="
    echo -e "${NC}"
    
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Edit .env file and add your Telegram bot token"
    echo "2. Start the bot: npm start"
    echo "3. Test the bot by sending /start to your Telegram bot"
    echo ""
    echo -e "${YELLOW}Useful commands:${NC}"
    echo "  Check printer status: lpstat -p"
    echo "  Test printer: echo 'Test' | lp -d XP58"
    echo "  Check MongoDB: sudo systemctl status mongod"
    echo "  Check CUPS: sudo systemctl status cups"
    echo "  View logs: pm2 logs (if using PM2)"
    echo ""
    echo -e "${GREEN}Setup completed successfully!${NC}"
}

# Run main function
main "$@"


