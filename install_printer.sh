#!/bin/bash

# Dringo Lite - Printer Installation Script
# This script specifically handles thermal printer setup and configuration
# Author: Printer Setup
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

# Check if running as root for printer setup
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root for printer configuration"
        info "Run with: sudo $0"
        exit 1
    fi
}

# Detect connected printers
detect_printers() {
    log "Detecting connected printers..."
    
    # Check USB devices
    if command -v lsusb &> /dev/null; then
        info "USB devices:"
        lsusb | grep -i "printer\|thermal\|pos" || info "No printer-like USB devices found"
    fi
    
    # Check parallel port devices
    if [ -d "/dev/lp*" ]; then
        info "Parallel port devices:"
        ls -la /dev/lp* 2>/dev/null || info "No parallel port devices found"
    fi
    
    # Check for thermal printer specific devices
    if [ -e "/dev/usb/lp0" ]; then
        success "Found thermal printer at /dev/usb/lp0"
        PRINTER_DEVICE="/dev/usb/lp0"
    elif [ -e "/dev/usb/lp1" ]; then
        success "Found thermal printer at /dev/usb/lp1"
        PRINTER_DEVICE="/dev/usb/lp1"
    else
        warning "No thermal printer device found"
        PRINTER_DEVICE=""
    fi
}

# Install CUPS if not present
install_cups() {
    log "Installing CUPS..."
    
    if command -v lp &> /dev/null; then
        success "CUPS already installed"
    else
        if command -v apt-get &> /dev/null; then
            apt-get update
            apt-get install -y cups cups-client cups-bsd
        elif command -v yum &> /dev/null; then
            yum install -y cups cups-client
        else
            error "Cannot install CUPS on this system"
            exit 1
        fi
        success "CUPS installed"
    fi
    
    # Start and enable CUPS
    systemctl start cups
    systemctl enable cups
    success "CUPS service started and enabled"
}

# Install thermal printer drivers
install_thermal_drivers() {
    log "Installing thermal printer drivers..."
    
    if command -v apt-get &> /dev/null; then
        # Install common thermal printer packages
        apt-get install -y \
            printer-driver-all \
            hplip \
            gutenprint \
            cups-filters \
            cups-filters-core-drivers
        
        # Install specific thermal printer support
        apt-get install -y \
            printer-driver-ptouch \
            printer-driver-splix \
            printer-driver-c2esp \
            printer-driver-foo2zjs
        
        success "Thermal printer drivers installed"
    elif command -v yum &> /dev/null; then
        yum install -y \
            hplip \
            gutenprint \
            cups-filters
        
        success "Thermal printer drivers installed"
    else
        warning "Cannot install thermal printer drivers automatically"
    fi
}

# Configure XP58 printer
configure_xp58() {
    log "Configuring XP58 thermal printer..."
    
    # Remove existing XP58 printer if it exists
    lpadmin -x XP58 2>/dev/null || true
    
    # Try different configuration methods
    local configured=false
    
    # Method 1: Generic thermal printer
    if lpadmin -p XP58 -E -v "usb://Generic/Thermal" -m "raw" 2>/dev/null; then
        success "XP58 configured as generic thermal printer"
        configured=true
    fi
    
    # Method 2: Direct USB device
    if [ -n "$PRINTER_DEVICE" ] && [ "$configured" = false ]; then
        if lpadmin -p XP58 -E -v "$PRINTER_DEVICE" -m "raw" 2>/dev/null; then
            success "XP58 configured with direct USB device"
            configured=true
        fi
    fi
    
    # Method 3: EPSON compatible
    if [ "$configured" = false ]; then
        if lpadmin -p XP58 -E -v "usb://EPSON/TM-T20" -m "epson-escpos" 2>/dev/null; then
            success "XP58 configured as EPSON compatible"
            configured=true
        fi
    fi
    
    # Method 4: Manual configuration
    if [ "$configured" = false ]; then
        warning "Automatic configuration failed"
        info "Manual configuration required:"
        info "1. Connect your thermal printer via USB"
        info "2. Run: lpinfo -v to see available devices"
        info "3. Run: lpadmin -p XP58 -E -v DEVICE_URI -m raw"
        return 1
    fi
    
    # Set as default printer
    lpadmin -d XP58 2>/dev/null || true
    success "XP58 set as default printer"
}

# Test printer functionality
test_printer() {
    log "Testing printer functionality..."
    
    # Create test file
    cat > /tmp/xp58_test.txt << 'EOF'
================================
    XP58 PRINTER TEST
================================

This is a test print from Dringo Lite
Date: $(date)
System: $(uname -a)

If you can see this text clearly,
the printer is working correctly!

================================
EOF
    
    # Test print
    if lp -d XP58 /tmp/xp58_test.txt; then
        success "Printer test successful"
        info "Check your printer for the test output"
    else
        error "Printer test failed"
        return 1
    fi
    
    # Clean up
    rm -f /tmp/xp58_test.txt
}

# Test advanced printer features
test_advanced_features() {
    log "Testing advanced printer features..."
    
    # Test different print options
    cat > /tmp/advanced_test.txt << 'EOF'
================================
   ADVANCED FEATURES TEST
================================

Testing different print options:

1. Normal text
2. **Bold text** (if supported)
3. Different font sizes
4. Special characters: !@#$%^&*()
5. Unicode: café, naïve, résumé

================================
EOF
    
    # Test with different options
    if lp -d XP58 -o media=A4 -o copies=1 /tmp/advanced_test.txt; then
        success "Advanced features test successful"
    else
        warning "Advanced features test failed, but basic printing works"
    fi
    
    rm -f /tmp/advanced_test.txt
}

# Configure printer permissions
configure_permissions() {
    log "Configuring printer permissions..."
    
    # Add current user to lpadmin group
    if [ -n "$SUDO_USER" ]; then
        usermod -a -G lpadmin "$SUDO_USER"
        success "Added $SUDO_USER to lpadmin group"
    fi
    
    # Configure CUPS to allow local administration
    if [ -f "/etc/cups/cupsd.conf" ]; then
        # Backup original config
        cp /etc/cups/cupsd.conf /etc/cups/cupsd.conf.backup
        
        # Allow local administration
        sed -i 's/Listen localhost:631/Listen 0.0.0.0:631/' /etc/cups/cupsd.conf
        sed -i 's/Allow @LOCAL/Allow @LOCAL\n  Allow all/' /etc/cups/cupsd.conf
        
        # Restart CUPS
        systemctl restart cups
        success "CUPS permissions configured"
    fi
}

# Show printer status
show_printer_status() {
    log "Printer status information..."
    
    echo ""
    info "Printer Configuration:"
    lpstat -p XP58 2>/dev/null || warning "XP58 printer not found"
    
    echo ""
    info "Available Printers:"
    lpstat -p 2>/dev/null || warning "No printers configured"
    
    echo ""
    info "Print Queue:"
    lpstat -o 2>/dev/null || info "Print queue is empty"
    
    echo ""
    info "CUPS Service Status:"
    systemctl status cups --no-pager -l
}

# Create printer test script
create_test_script() {
    log "Creating printer test script..."
    
    cat > /usr/local/bin/test_xp58.sh << 'EOF'
#!/bin/bash
# XP58 Printer Test Script

echo "Testing XP58 thermal printer..."

# Create test content
cat > /tmp/test_print.txt << 'TEST_EOF'
================================
    DRINGO LITE TEST PRINT
================================

Order ID: TEST-001
Customer: Test Customer
Date: $(date)
Time: $(date +%H:%M:%S)

Items:
• Espresso (Medium) x1 - 18,000 UZS
• Latte (Large) x1 - 32,000 UZS

Total: 50,000 UZS

Thank you for your order!
================================
TEST_EOF

# Print test
if lp -d XP58 /tmp/test_print.txt; then
    echo "✅ Test print sent successfully"
    echo "Check your printer for output"
else
    echo "❌ Test print failed"
    echo "Check printer connection and configuration"
fi

# Clean up
rm -f /tmp/test_print.txt
EOF
    
    chmod +x /usr/local/bin/test_xp58.sh
    success "Printer test script created: /usr/local/bin/test_xp58.sh"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "    Dringo Lite - Printer Setup"
    echo "=========================================="
    echo -e "${NC}"
    
    check_root
    detect_printers
    install_cups
    install_thermal_drivers
    configure_xp58
    test_printer
    test_advanced_features
    configure_permissions
    show_printer_status
    create_test_script
    
    echo -e "${GREEN}"
    echo "=========================================="
    echo "    Printer Setup Complete!"
    echo "=========================================="
    echo -e "${NC}"
    
    echo -e "${YELLOW}Printer Information:${NC}"
    echo "  Name: XP58"
    echo "  Device: $PRINTER_DEVICE"
    echo "  Status: $(lpstat -p XP58 2>/dev/null && echo 'Configured' || echo 'Not configured')"
    echo ""
    
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo "  Test printer: test_xp58.sh"
    echo "  Check status: lpstat -p XP58"
    echo "  Print test: echo 'Test' | lp -d XP58"
    echo "  View queue: lpstat -o"
    echo "  Cancel jobs: cancel -a"
    echo ""
    
    echo -e "${YELLOW}Web Interface:${NC}"
    echo "  CUPS Admin: http://localhost:631"
    echo "  (Use your system username/password)"
    echo ""
    
    success "XP58 thermal printer is ready for Dringo Lite!"
}

# Run main function
main "$@"


