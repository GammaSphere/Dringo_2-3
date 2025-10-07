# Dringo Lite - Quick Reference Guide
## Essential Information for Developers and Beginners

### 🚀 Quick Start Commands
```bash
# Start the application
npm start

# Add sample products
curl -X POST http://localhost:3000/addSampleCoffees

# Test printer
node printer.js

# Check MongoDB connection
mongosh dringo-lite
```

---

## 📁 Key Files and Their Purpose

### Core Application
- **`index.js`** - Main entry point, server setup, bot initialization
- **`package.json`** - Dependencies and project configuration
- **`printer.js`** - Thermal printer test utility

### Bot Logic
- **`customer_bot/journey/customerJourney.js`** - State definitions and flow
- **`customer_bot/journey/fns.js`** - Shared functions and UI logic
- **`customer_bot/resolvers/stateResolver.js`** - State resolution logic
- **`customer_bot/updates/updateHandler.js`** - Update routing

### Data Models
- **`schemas/customer.js`** - Customer data structure
- **`schemas/product.js`** - Product data structure
- **`schemas/order.js`** - Order data structure
- **`schemas/localization.js`** - Multi-language support

### API Endpoints
- **`api/addProduct.js`** - Product management
- **`api/getOrders.js`** - Order retrieval
- **`api/orderNotification.js`** - Order notifications + printer

### Utilities
- **`utils/localizedString.js`** - Language localization
- **`utils/bootTime.js`** - Stale update filtering
- **`utils/saveWithRetry.js`** - Database retry logic

---

## 🔄 Customer Journey States

### Registration Flow (Linear)
```
fresh-start → accepting-terms → choosing-language → giving-phone-number → giving-full-name → none
```

### Shopping Flow (Non-linear)
```
none → explore-products → product-details → product-details-addons → review-cart → select-pickup-time → paying-for-order → waiting-for-order
```

### Utility States
```
none ↔ support
none ↔ settings ↔ changing-language
```

---

## 🛒 Product System

### Default Products
- **Espresso**: Small(15000), Medium(18000), Large(22000) UZS
- **Cappuccino**: Small(20000), Medium(25000), Large(30000) UZS
- **Americano**: Small(12000), Medium(15000), Large(18000) UZS
- **Latte**: Small(22000), Medium(27000), Large(32000) UZS

### Add-ons System
- **Sugar**: 0, 1, 2, 3 spoons (free)
- **Syrups**: Vanilla, Caramel, Hazelnut (+3000 UZS each)
- **Cream**: Whole milk, Almond milk, Oat milk (varying prices)

---

## 🌐 Multi-Language Support

### Supported Languages
- **English (en)** - Default language
- **Russian (ru)** - Full translation support
- **Uzbek (uz)** - Full translation support

### Language Codes
- `en` - English
- `ru` - Russian
- `uz` - Uzbek

---

## 🖨️ Printer Configuration

### CUPS Printer Name
```
XP58
```

### Fallback Device Path
```
/dev/usb/lp0
```

### Test Commands
```bash
# Test print via CUPS
echo "Test print" | lp -d XP58

# List available printers
lpstat -p

# Check printer status
lpstat -t
```

---

## 🔌 API Endpoints

### Product Management
```bash
# Add custom product
POST /addProduct
Content-Type: application/json

# Add sample coffees
POST /addSampleCoffees
```

### Order Management
```bash
# Get pending orders
GET /getOrders

# Order notification
POST /order
```

---

## 📊 Database Collections

### Customer Collection
```javascript
{
  telegramId: Number,
  agreedToTerms: Boolean,
  preferredLanguage: String,
  phoneNumber: String,
  fullName: String,
  cart: Array,
  state: String,
  stateDetails: String
}
```

### Product Collection
```javascript
{
  title: ObjectId (ref: Localization),
  description: ObjectId (ref: Localization),
  sizeOptions: Array,
  defaultAddOns: Array,
  possibleAddOns: Array,
  status: String
}
```

### Order Collection
```javascript
{
  customer: ObjectId (ref: Customer),
  selectedProducts: Array,
  pickupTime: String,
  status: String
}
```

### Localization Collection
```javascript
{
  key: String,
  translations: Map,
  status: String
}
```

---

## 🛠️ Common Development Tasks

### Adding a New Product
1. **Via API**:
```bash
curl -X POST http://localhost:3000/addProduct \
  -H "Content-Type: application/json" \
  -d '{
    "title": {"en": "New Product", "ru": "Новый продукт", "uz": "Yangi mahsulot"},
    "description": {"en": "Description", "ru": "Описание", "uz": "Tavsif"},
    "sizeOptions": [{"size": "Small", "price": 15000}],
    "defaultAddOns": [{"kind": "Sugar", "option": "2 spoons", "price": 0}],
    "possibleAddOns": [{"kind": "Sugar", "option": "0 spoons", "price": 0}]
  }'
```

2. **Via Code** (add to `api/addProduct.js`):
```javascript
// Add to sampleCoffees array
{
  title: { en: "New Coffee", ru: "Новый кофе", uz: "Yangi qahva" },
  description: { en: "Description", ru: "Описание", uz: "Tavsif" },
  sizeOptions: [
    { size: "Small", price: 15000 },
    { size: "Medium", price: 20000 },
    { size: "Large", price: 25000 }
  ],
  defaultAddOns: [
    { kind: "Sugar", option: "2 spoons", price: 0 }
  ],
  possibleAddOns: [
    { kind: "Sugar", option: "0 spoons", price: 0 },
    { kind: "Sugar", option: "1 spoon", price: 0 },
    { kind: "Sugar", option: "2 spoons", price: 0 },
    { kind: "Sugar", option: "3 spoons", price: 0 }
  ]
}
```

### Adding a New State
1. **Add to journey** (`customer_bot/journey/customerJourney.js`):
```javascript
{
  state: "new-state",
  navItem: "navigation-context",
  back: true,
  _validation(ctx) { return newStateValidation(ctx, this); },
  action(ctx) { return newStateAction(ctx, this); }
}
```

2. **Create validation** (`customer_bot/journey/validators/newStateValidation.js`):
```javascript
export default function newStateValidation(ctx, path) {
  // Validation logic
  return true; // or false
}
```

3. **Create action** (`customer_bot/journey/actions/newStateAction.js`):
```javascript
export default async function newStateAction(ctx, path) {
  // Action logic
  // Display UI, handle input
}
```

4. **Update state enum** (`schemas/customer.js`):
```javascript
enum: [
  // ... existing states
  "new-state"
]
```

### Adding a New Language
1. **Update constants** (`customer_bot/journey/keyboardButtonTextConstants.js`):
```javascript
export const NEW_LANGUAGE_TEXT = "🇳🇪 New Language";
```

2. **Update language selection** (`customer_bot/journey/fns.js`):
```javascript
// Add to keyboard
[{text: NEW_LANGUAGE_TEXT}]
```

3. **Update validation** (`customer_bot/journey/validators/chooseLanguageValidation.js`):
```javascript
case NEW_LANGUAGE_TEXT:
  ctx.user.preferredLanguage = "new";
  break;
```

---

## 🐛 Common Issues and Solutions

### Bot Not Responding
```bash
# Check bot token
echo $CUSTOMER_BOT_TOKEN

# Check MongoDB connection
mongosh dringo-lite

# Check for errors
pm2 logs dringo-lite
```

### Printer Not Working
```bash
# Check printer status
lpstat -p

# Test printer
echo "Test" | lp -d XP58

# Check CUPS
sudo systemctl status cups
```

### Database Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check disk space
df -h

# Check logs
tail -f /var/log/mongodb/mongod.log
```

---

## 📋 Environment Variables

### Required
```bash
CUSTOMER_BOT_TOKEN=your_telegram_bot_token_here
PORT=3000
```

### Optional
```bash
NODE_ENV=production
MONGODB_URI=mongodb://127.0.0.1:27017/dringo-lite
```

---

## 🔧 Development Commands

### Package Management
```bash
# Install dependencies
npm install

# Update dependencies
npm update

# Check for vulnerabilities
npm audit
```

### Process Management
```bash
# Start with PM2
pm2 start index.js --name "dringo-lite"

# Monitor
pm2 monit

# View logs
pm2 logs dringo-lite

# Restart
pm2 restart dringo-lite
```

### Database Operations
```bash
# Connect to MongoDB
mongosh dringo-lite

# Backup database
mongodump --db dringo-lite --out /backup/$(date +%Y%m%d)

# Restore database
mongorestore --db dringo-lite /backup/20240115/dringo-lite
```

---

## 📚 Documentation Files

### System Documentation
- **`SYSTEM_ARCHITECTURE.md`** - Complete system overview
- **`TECHNICAL_SPECIFICATIONS.md`** - Technical implementation details
- **`DEVELOPER_GUIDE.md`** - Development and maintenance guide

### Flow Documentation
- **`FLOW_DIAGRAM.md`** - Visual flow representation
- **`CHANGELOG.md`** - Change tracking
- **`CHANGE_TRACKING_GUIDE.md`** - How to document changes

### Setup Documentation
- **`README.md`** - Basic setup and usage
- **`PRINTER_SETUP.md`** - Printer configuration guide
- **`QUICK_REFERENCE.md`** - This file

---

## 🎯 Key Concepts for Beginners

### State Machine
The bot uses states to track where users are in the conversation. Each state has validation, action, and transition logic.

### Localization
Text is stored in the database with translations for multiple languages. The system automatically selects the user's preferred language.

### Add-ons System
Products can have default add-ons (included) and possible add-ons (customizable). Each add-on has a kind, option, and price.

### Cart Management
Users can add multiple products with different configurations. Each cart item tracks quantity, size, and per-item add-ons.

### Printer Integration
Orders are automatically printed to a thermal printer via CUPS. The system handles printer failures gracefully.

---

## 🚨 Important Notes

### Security
- Never commit bot tokens to version control
- Use environment variables for sensitive data
- Validate all user inputs
- Handle errors gracefully

### Performance
- Use database indexes for frequently queried fields
- Implement rate limiting for API endpoints
- Monitor memory usage and database connections
- Clean up temporary files

### Maintenance
- Regularly backup the database
- Monitor error logs
- Update dependencies regularly
- Test changes thoroughly before deployment

---

*This quick reference provides essential information for working with the Dringo Lite coffee ordering bot system. Keep it handy for quick lookups and common tasks.*
