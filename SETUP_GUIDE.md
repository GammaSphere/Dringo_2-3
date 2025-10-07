# Dringo Lite - Linux Setup Guide
## Complete Installation and Configuration Guide

### Overview
This guide provides step-by-step instructions for setting up the Dringo Lite coffee ordering bot on a Linux system. The setup includes all necessary components: Node.js, MongoDB, CUPS printer system, and the bot itself.

---

## 🚀 Quick Start

### 1. Download and Prepare
```bash
# Navigate to your project directory
cd /path/to/dringo-lite

# Make scripts executable
chmod +x setup_linux.sh
chmod +x check_system.sh
chmod +x install_printer.sh
chmod +x start_bot.sh
```

### 2. Run Complete Setup
```bash
# Run the main setup script
./setup_linux.sh
```

### 3. Configure Environment
```bash
# Edit the .env file with your bot token
nano .env
```

### 4. Start the Bot
```bash
# Start the bot
./start_bot.sh
```

---

## 📋 Detailed Setup Instructions

### Prerequisites
- Linux system (Ubuntu/Debian recommended)
- Internet connection
- USB thermal printer (XP58 or compatible)
- Telegram bot token

### Step 1: System Setup
The `setup_linux.sh` script will:
- ✅ Check Linux distribution
- ✅ Update package lists
- ✅ Install Node.js 18.x
- ✅ Install MongoDB
- ✅ Install CUPS and printer drivers
- ✅ Configure system dependencies
- ✅ Set up printer
- ✅ Install project dependencies
- ✅ Create environment file

**Run:**
```bash
./setup_linux.sh
```

### Step 2: Printer Configuration
The `install_printer.sh` script will:
- ✅ Detect connected printers
- ✅ Install thermal printer drivers
- ✅ Configure XP58 printer
- ✅ Test printer functionality
- ✅ Set up permissions

**Run:**
```bash
sudo ./install_printer.sh
```

### Step 3: Environment Configuration
Edit the `.env` file:
```bash
nano .env
```

**Required settings:**
```env
CUSTOMER_BOT_TOKEN=your_actual_bot_token_here
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/dringo-lite
NODE_ENV=production
```

### Step 4: System Check
Verify everything is working:
```bash
./check_system.sh
```

### Step 5: Start the Bot
```bash
./start_bot.sh
```

---

## 🔧 Individual Scripts

### 1. `setup_linux.sh` - Main Setup
**Purpose:** Complete system setup and installation
**Usage:** `./setup_linux.sh`
**Requirements:** Internet connection, sudo access

**What it does:**
- Installs Node.js, MongoDB, CUPS
- Configures system dependencies
- Sets up printer drivers
- Creates environment file
- Performs system checks

### 2. `check_system.sh` - System Verification
**Purpose:** Verify all components are working
**Usage:** `./check_system.sh`
**Requirements:** None

**What it checks:**
- Node.js and npm versions
- MongoDB service and connection
- CUPS and printer status
- Project dependencies
- Environment configuration
- System resources
- Network connectivity

### 3. `install_printer.sh` - Printer Setup
**Purpose:** Configure thermal printer specifically
**Usage:** `sudo ./install_printer.sh`
**Requirements:** Root access, connected printer

**What it does:**
- Detects connected printers
- Installs thermal printer drivers
- Configures XP58 printer
- Tests printer functionality
- Sets up permissions

### 4. `start_bot.sh` - Bot Management
**Purpose:** Start and manage the bot process
**Usage:** `./start_bot.sh`
**Requirements:** Completed setup

**What it does:**
- Checks prerequisites
- Starts bot with PM2 or directly
- Monitors bot status
- Provides management commands

---

## 🖨️ Printer Setup

### Supported Printers
- **XP58** (recommended)
- **EPSON TM-T20** (compatible)
- **Generic thermal printers** (USB)

### Manual Printer Configuration
If automatic setup fails:

1. **Check connected devices:**
```bash
lsusb
ls -la /dev/usb/lp*
```

2. **Configure printer manually:**
```bash
sudo lpadmin -p XP58 -E -v usb://XP-58 -m raw
```

3. **Test printer:**
```bash
echo "Test print" | lp -d XP58
```

### Printer Troubleshooting
- **Printer not detected:** Check USB connection
- **Permission denied:** Add user to lpadmin group
- **Print quality issues:** Check paper and print head
- **CUPS errors:** Check `/var/log/cups/error_log`

---

## 🔍 System Monitoring

### Check Bot Status
```bash
# If using PM2
pm2 status
pm2 logs dringo-lite

# If running directly
ps aux | grep node
tail -f logs/bot.log
```

### Check Services
```bash
# MongoDB
sudo systemctl status mongod

# CUPS
sudo systemctl status cups

# Check printer
lpstat -p XP58
```

### View Logs
```bash
# Bot logs
tail -f logs/bot.log

# System logs
sudo journalctl -u mongod
sudo journalctl -u cups
```

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. Bot Token Error
**Error:** `EFATAL: Telegram Bot Token not provided!`
**Solution:** Edit `.env` file and add your bot token

#### 2. MongoDB Connection Failed
**Error:** `MongoDB connection error`
**Solution:** 
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 3. Printer Not Working
**Error:** `Printer test failed`
**Solution:**
```bash
sudo ./install_printer.sh
# Or manually configure
sudo lpadmin -p XP58 -E -v usb://XP-58 -m raw
```

#### 4. Permission Denied
**Error:** `Permission denied for printer`
**Solution:**
```bash
sudo usermod -a -G lpadmin $USER
# Log out and back in
```

#### 5. Port Already in Use
**Error:** `Port 3000 already in use`
**Solution:**
```bash
# Change port in .env file
PORT=3001
# Or kill existing process
sudo lsof -ti:3000 | xargs kill
```

### Advanced Troubleshooting

#### Check System Resources
```bash
# Memory usage
free -h

# Disk space
df -h

# CPU usage
top
```

#### Network Issues
```bash
# Test internet connection
ping 8.8.8.8

# Test Telegram API
curl https://api.telegram.org
```

#### Database Issues
```bash
# Connect to MongoDB
mongosh dringo-lite

# Check collections
show collections

# View customers
db.customers.find().limit(5)
```

---

## 📊 Performance Optimization

### System Requirements
- **Minimum:** 512MB RAM, 1GB disk space
- **Recommended:** 1GB RAM, 2GB disk space
- **CPU:** 1 core (2+ recommended)

### Optimization Tips
1. **Use PM2 for process management**
2. **Enable MongoDB journaling**
3. **Monitor system resources**
4. **Regular log cleanup**
5. **Backup database regularly**

### Monitoring Commands
```bash
# System resources
htop
iotop
netstat -tlnp

# Bot performance
pm2 monit
pm2 logs --lines 100
```

---

## 🔒 Security Considerations

### File Permissions
```bash
# Secure .env file
chmod 600 .env

# Secure logs directory
chmod 755 logs
```

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 3000
sudo ufw allow 631  # CUPS
```

### Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade

# Update Node.js dependencies
npm update
```

---

## 📚 Additional Resources

### Useful Commands
```bash
# Bot management
./start_bot.sh          # Start bot
pm2 stop dringo-lite    # Stop bot
pm2 restart dringo-lite # Restart bot

# System checks
./check_system.sh       # Full system check
test_xp58.sh           # Test printer
lpstat -p              # Check printers

# Logs and monitoring
pm2 logs               # View bot logs
sudo journalctl -f     # View system logs
```

### Configuration Files
- `.env` - Environment variables
- `package.json` - Node.js dependencies
- `/etc/cups/cupsd.conf` - CUPS configuration
- `/etc/mongod.conf` - MongoDB configuration

### Support
- Check logs for error messages
- Run system check script
- Verify all services are running
- Test printer functionality
- Check network connectivity

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Node.js 14+ installed
- [ ] MongoDB running and accessible
- [ ] CUPS service running
- [ ] XP58 printer configured and tested
- [ ] Bot token configured in .env
- [ ] Bot starts without errors
- [ ] Printer test successful
- [ ] Telegram bot responds to /start
- [ ] Order flow works end-to-end
- [ ] Receipt prints correctly

---

*This setup guide ensures your Dringo Lite coffee bot runs smoothly on Linux with all necessary components properly configured.*
