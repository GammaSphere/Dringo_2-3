# XP58 Thermal Printer Setup Guide

## Prerequisites

1. **Install XP58 Printer Driver**
   - Download the XP58 driver for your operating system
   - Install and configure the printer

2. **Printer Connection**
   - Connect XP58 via USB or network
   - Ensure printer is recognized by the system

## Configuration

### Windows
- Printer name should be: `XP-58` (or update in `api/orderNotification.js`)
- Check printer name in Control Panel > Devices and Printers

### macOS
- Printer name should be: `XP-58` (or update in `api/orderNotification.js`)
- Check printer name in System Preferences > Printers & Scanners

### Linux
- Printer name should be: `XP-58` (or update in `api/orderNotification.js`)
- Use `lpstat -p` to list available printers

## Troubleshooting

1. **Printer Not Found Error**
   ```javascript
   // Update the interface in api/orderNotification.js
   interface: 'printer:YOUR_ACTUAL_PRINTER_NAME'
   ```

2. **Test Printer Connection**
   ```bash
   # Windows
   echo "Test print" > PRN

   # macOS/Linux
   echo "Test print" | lpr -P XP-58
   ```

3. **Alternative Interfaces**
   - USB: `interface: '/dev/usb/lp0'` (Linux)
   - Serial: `interface: '/dev/ttyUSB0'` (Linux)
   - Network: `interface: 'tcp://192.168.1.100'`

## Receipt Format Features

- **Large Header**: "NEW ORDER" in double-height, double-width
- **Bold Pickup Time**: Most prominent information
- **Bold Product Names**: Easy to read
- **Organized Add-ons**: Grouped by item number
- **Large Total**: Double-height total amount
- **Auto-cut**: Paper cuts automatically after printing

## Testing

Create a test order through the Telegram bot to verify:
1. Receipt prints automatically
2. Pickup time is clearly visible
3. Order details are properly formatted
4. Add-ons are grouped correctly by item
