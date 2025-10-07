# 🚀 **Dringo Bot Deployment Guide**

## **Automatic Menu Initialization**

The bot now includes **automatic menu initialization** that ensures the latest menu configuration is always applied when deploying to a new server or fresh MongoDB database.

### **How It Works**

1. **On Bot Startup**: When the bot connects to MongoDB, it automatically checks if the menu needs initialization
2. **Smart Detection**: If the database is empty or has fewer than 10 products, it initializes with the latest menu
3. **Latest Configuration**: Always uses the most up-to-date menu with all the latest features:
   - 19 products with correct pricing
   - New add-on layout (Sugar👇, Syrup👇, Add-ons👇)
   - 10 syrup options in 4×3 grid layout
   - Special configuration for Black Tea and Green Tea (Lemon only)
   - All add-ons priced at 5000 UZS (except sugar which is free)

### **Deployment Steps**

#### **1. Transfer Project to Server**
```bash
# Create archive (exclude node_modules and logs)
tar -czf dringo-bot.tar.gz --exclude='node_modules' --exclude='logs' --exclude='latest\ db' --exclude='.git' "Dringo_2.2 (launched)"

# Transfer to server
scp dringo-bot.tar.gz username@server-ip:/opt/dringo/
```

#### **2. Server Setup**
```bash
# SSH into server
ssh username@server-ip

# Extract and setup
cd /opt/dringo
tar -xzf dringo-bot.tar.gz
cd "Dringo_2.2 (launched)"

# Install dependencies
npm install
npm install -g pm2
pip3 install -r requirements.txt

# Setup environment
echo "CUSTOMER_BOT_TOKEN=your_actual_bot_token" > .env
```

#### **3. Database Setup**
```bash
# Install and start MongoDB
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

#### **4. Start Bot**
```bash
# Start with PM2 (recommended)
python3 bot.py

# OR start directly
pm2 start index.js --name "dringo-bot"
```

### **What Happens on First Run**

When you start the bot for the first time on a fresh server:

1. **MongoDB Connection**: Bot connects to MongoDB
2. **Menu Check**: Checks if products exist in database
3. **Auto-Initialization**: If database is empty, automatically creates:
   - 19 products with latest configuration
   - All localizations (titles and descriptions in 3 languages)
   - Correct add-on configurations
4. **Ready to Use**: Bot is immediately ready with the latest menu

### **Console Output Example**

```
MongoDB Connected
🔄 Checking if menu needs initialization...
📊 Found 0 products and 0 localizations in database
🚀 Initializing menu with latest products...
🧹 Cleared all existing products and localizations
✅ Successfully created 19 products with latest menu configuration
✅ Menu initialization completed successfully!
```

### **Testing Menu Initialization**

To test the menu initialization on your current system:

```bash
# Run the test script
node test_menu_init.js
```

This will:
- Clear existing data
- Run menu initialization
- Verify 19 products and 38+ localizations are created
- Show sample products

### **Manual Menu Update**

If you need to force update the menu on an existing system:

```bash
# Use the API endpoint
curl -X POST http://localhost:3000/replaceMenu -H "Content-Type: application/json"

# OR use the helper script
node replace_menu.js
```

### **Verification Commands**

After deployment, verify everything is working:

```bash
# Check PM2 status
pm2 status

# Check bot logs
pm2 logs dringo-bot

# Test API
curl http://localhost:3000/replaceMenu -X POST -H "Content-Type: application/json"

# Check MongoDB
mongo --eval "db.products.count()"
```

### **Key Benefits**

✅ **Zero Configuration**: No manual menu setup required  
✅ **Always Latest**: Automatically uses the most recent menu configuration  
✅ **Fresh Deployments**: Works perfectly on new servers  
✅ **Consistent**: Same menu across all deployments  
✅ **Error Safe**: Handles initialization errors gracefully  

### **Files Involved**

- `utils/menuInitializer.js` - Core initialization logic
- `index.js` - Integration into startup sequence
- `api/addProduct.js` - Contains the menu data
- `test_menu_init.js` - Testing script

### **Troubleshooting**

**Problem**: Menu not initializing
**Solution**: Check MongoDB connection and bot token in `.env`

**Problem**: Old menu still showing
**Solution**: Clear MongoDB and restart bot, or use `/replaceMenu` API

**Problem**: Add-ons not working correctly
**Solution**: Ensure you're using the latest version with `menuInitializer.js`

---

## **🎯 Summary**

With this automatic menu initialization system, you can now:

1. **Copy the entire project** to any server
2. **Install dependencies** (`npm install`, `pip3 install -r requirements.txt`)
3. **Set bot token** in `.env` file
4. **Start the bot** (`python3 bot.py` or `pm2 start`)

The bot will **automatically** initialize with the latest menu configuration, ensuring consistent deployment across all servers! 🚀
