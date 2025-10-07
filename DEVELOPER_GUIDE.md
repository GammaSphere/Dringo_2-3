# Dringo Lite - Developer Guide
## Complete Development and Maintenance Guide

### Quick Start

#### 1. Environment Setup
```bash
# Clone and navigate to project
cd /home/jalolbek/Dringo_2\ beta\ \(printer\ working\)/Dringo_2/Dringo_2

# Install dependencies
npm install

# Create environment file
echo "CUSTOMER_BOT_TOKEN=your_bot_token_here" > .env
echo "PORT=3000" >> .env

# Start MongoDB (if not running)
sudo systemctl start mongod

# Start the application
npm start
```

#### 2. Initial Data Setup
```bash
# Add sample coffee products
curl -X POST http://localhost:3000/addSampleCoffees
```

---

## 🏗️ Architecture Overview

### Core Components
1. **Main Application** (`index.js`) - Entry point and server setup
2. **Customer Bot** (`customer_bot/`) - Conversation logic and state management
3. **API Layer** (`api/`) - REST endpoints for external integration
4. **Data Models** (`schemas/`) - MongoDB schemas and relationships
5. **Utilities** (`utils/`) - Helper functions and shared logic

### Key Design Patterns
- **State Machine**: Conversation flow management
- **Repository Pattern**: Data access abstraction
- **Middleware Pattern**: Request/response processing
- **Factory Pattern**: Object creation (localizations, products)

---

## 🔄 State Management System

### Understanding States
The bot uses 15 distinct states to manage user conversations:

```javascript
// Registration Flow (Linear)
fresh-start → accepting-terms → choosing-language → giving-phone-number → giving-full-name → none

// Shopping Flow (Non-linear)
none → explore-products → product-details → product-details-addons → review-cart → select-pickup-time → paying-for-order → waiting-for-order

// Utility States
none ↔ support
none ↔ settings ↔ changing-language
```

### Adding New States
1. **Define State in Journey** (`customer_bot/journey/customerJourney.js`):
```javascript
{
    state: "new-state",
    navItem: "navigation-context",
    back: true,
    _validation(ctx) { return newStateValidation(ctx, this); },
    action(ctx) { return newStateAction(ctx, this); },
    async _updateCustomerData(ctx) {
        ctx.user.state = "next-state";
        await ctx.user.save();
    }
}
```

2. **Create Validation** (`customer_bot/journey/validators/newStateValidation.js`):
```javascript
export default function newStateValidation(ctx, path) {
    // Validation logic
    // Return true if valid, false if invalid
    // Handle error responses
}
```

3. **Create Action** (`customer_bot/journey/actions/newStateAction.js`):
```javascript
export default async function newStateAction(ctx, path) {
    // Action logic
    // Display UI, handle user input
    // Call path._updateCustomerData(ctx) to transition
}
```

4. **Update State Enum** (`schemas/customer.js`):
```javascript
enum: [
    // ... existing states
    "new-state"
]
```

---

## 🌐 Localization System

### Adding New Languages
1. **Update Language Constants** (`customer_bot/journey/keyboardButtonTextConstants.js`):
```javascript
export const NEW_LANGUAGE_TEXT = "🇳🇪 New Language";
```

2. **Update Language Selection** (`customer_bot/journey/fns.js`):
```javascript
async chooseLanguage(ctx) {
    // Add new language button
    [{text: NEW_LANGUAGE_TEXT}]
}
```

3. **Update Language Validation** (`customer_bot/journey/validators/chooseLanguageValidation.js`):
```javascript
// Add new language case
case NEW_LANGUAGE_TEXT:
    ctx.user.preferredLanguage = "new";
    break;
```

### Adding New Localized Strings
1. **Use in Code**:
```javascript
const text = await localizedString(ctx, "New string key");
```

2. **Auto-creation**: The system automatically creates localization entries
3. **Manual Translation**: Update the `Localization` collection in MongoDB

---

## 🛒 Product and Add-ons System

### Adding New Products
1. **Via API** (`POST /addProduct`):
```javascript
{
    "title": {
        "en": "New Product",
        "ru": "Новый продукт", 
        "uz": "Yangi mahsulot"
    },
    "description": {
        "en": "Product description",
        "ru": "Описание продукта",
        "uz": "Mahsulot tavsifi"
    },
    "sizeOptions": [
        {"size": "Small", "price": 15000},
        {"size": "Medium", "price": 20000},
        {"size": "Large", "price": 25000}
    ],
    "defaultAddOns": [
        {"kind": "Sugar", "option": "2 spoons", "price": 0}
    ],
    "possibleAddOns": [
        {"kind": "Sugar", "option": "0 spoons", "price": 0},
        {"kind": "Sugar", "option": "1 spoon", "price": 0},
        {"kind": "Sugar", "option": "2 spoons", "price": 0},
        {"kind": "Sugar", "option": "3 spoons", "price": 0},
        {"kind": "Syrup", "option": "New Flavor", "price": 3000}
    ]
}
```

2. **Via Code** (for sample products):
```javascript
// Add to sampleCoffees array in addProduct.js
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
        // ... add-on options
    ]
}
```

### Adding New Add-on Types
1. **Update Product Schema** (if needed):
```javascript
// Add new add-on kind to products
{"kind": "NewAddOn", "option": "Option1", "price": 1000}
```

2. **Update Display Logic** (`customer_bot/journey/fns.js`):
```javascript
// The system automatically groups add-ons by kind
// No code changes needed for new kinds
```

---

## 🖨️ Printer Integration

### Printer Setup
1. **Install CUPS** (Linux):
```bash
sudo apt-get install cups
sudo systemctl start cups
```

2. **Add Printer**:
```bash
# List available printers
lpstat -p

# Add XP58 printer (adjust for your system)
sudo lpadmin -p XP58 -E -v usb://XP-58 -m drv:///sample.drv/xp58.ppd
```

3. **Test Printer**:
```bash
# Test print
echo "Test print" | lp -d XP58

# Or use the test utility
node printer.js
```

### Customizing Receipt Format
Edit `api/orderNotification.js` - `printOrderReceipt()` function:

```javascript
// Modify receipt text building
receiptText += '================================\n';
receiptText += '           NEW ORDER\n';
receiptText += '================================\n\n';

// Add custom sections
receiptText += 'CUSTOM SECTION:\n';
receiptText += 'Your custom content here\n\n';
```

### Adding New Printer Interfaces
```javascript
// Add new interface in printer.js
async function tryNewInterface(interfaceStr) {
    const p = new ThermalPrinter({
        type: types.EPSON,
        interface: interfaceStr,
        // ... other options
    });
    // ... test logic
}

// Call in main function
if (await tryNewInterface('tcp://192.168.1.100')) return;
```

---

## 🔌 API Development

### Adding New Endpoints
1. **Create Route File** (`api/newEndpoint.js`):
```javascript
import express from 'express';
import YourModel from "../schemas/yourModel.js";

const router = express.Router();

router.get("/newEndpoint", async (req, res) => {
    try {
        // Your logic here
        const data = await YourModel.find();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
```

2. **Register Route** (`index.js`):
```javascript
import newEndpoint from "./api/newEndpoint.js";

// Add to Express app
app.use(newEndpoint);
```

### API Response Format
```javascript
// Success Response
{
    "success": true,
    "data": { /* your data */ },
    "count": 5,
    "timestamp": "2024-01-15T10:30:00.000Z"
}

// Error Response
{
    "success": false,
    "error": "Error message",
    "message": "Detailed error description"
}
```

---

## 🛡️ Error Handling

### Adding Custom Error Handling
1. **State-Level Errors**:
```javascript
// In validation function
export default function stateValidation(ctx, path) {
    try {
        // Validation logic
        if (invalidInput) {
            await ctx.reply("Invalid input. Please try again.");
            return false;
        }
        return true;
    } catch (error) {
        console.error('Validation error:', error);
        await ctx.reply("Something went wrong. Please try again.");
        return false;
    }
}
```

2. **Global Error Handling**:
```javascript
// Add to index.js
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Add custom logging, notifications, etc.
});
```

### Error Recovery
```javascript
// Graceful degradation example
try {
    await printReceipt(orderData);
} catch (error) {
    console.error('Printer error:', error);
    // Continue processing without failing the entire order
    // Log for manual printing later
}
```

---

## 🧪 Testing

### Unit Testing
```javascript
// Example test for localization
import localizedString from '../utils/localizedString.js';

describe('localizedString', () => {
    it('should return English text for English user', async () => {
        const ctx = { user: { preferredLanguage: 'en' } };
        const result = await localizedString(ctx, 'Welcome');
        expect(result).toBe('Welcome');
    });
});
```

### Integration Testing
```javascript
// Example API test
import request from 'supertest';
import app from '../index.js';

describe('API Endpoints', () => {
    it('should add product', async () => {
        const response = await request(app)
            .post('/addProduct')
            .send({
                title: { en: 'Test Product' },
                // ... other fields
            });
        expect(response.status).toBe(201);
    });
});
```

### Manual Testing
1. **Test Bot Flow**:
   - Start conversation with bot
   - Go through registration
   - Test product selection
   - Test add-ons customization
   - Complete order flow

2. **Test Printer**:
   - Place test order
   - Verify receipt prints correctly
   - Check receipt format

---

## 🚀 Deployment

### Production Setup
1. **Environment Configuration**:
```bash
# Production environment variables
NODE_ENV=production
CUSTOMER_BOT_TOKEN=your_production_token
PORT=3000
MONGODB_URI=mongodb://localhost:27017/dringo-lite-prod
```

2. **Process Management** (PM2):
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start index.js --name "dringo-lite"

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

3. **MongoDB Backup**:
```bash
# Create backup
mongodump --db dringo-lite --out /backup/$(date +%Y%m%d)

# Restore backup
mongorestore --db dringo-lite /backup/20240115/dringo-lite
```

### Monitoring
```bash
# PM2 monitoring
pm2 monit

# Log monitoring
pm2 logs dringo-lite

# System monitoring
htop
df -h
```

---

## 🔧 Maintenance

### Regular Tasks
1. **Database Maintenance**:
   - Monitor MongoDB performance
   - Clean up old orders (if needed)
   - Backup localization data

2. **Log Management**:
   - Rotate log files
   - Monitor error rates
   - Check printer connectivity

3. **Performance Monitoring**:
   - Monitor response times
   - Check memory usage
   - Monitor Telegram API limits

### Troubleshooting
1. **Bot Not Responding**:
   - Check bot token
   - Verify MongoDB connection
   - Check for error logs

2. **Printer Issues**:
   - Test printer connectivity
   - Check CUPS status
   - Verify printer name

3. **Database Issues**:
   - Check MongoDB status
   - Verify connection string
   - Check disk space

---

## 📚 Additional Resources

### Documentation Files
- `SYSTEM_ARCHITECTURE.md` - Complete system overview
- `FLOW_DIAGRAM.md` - Visual flow representation
- `TECHNICAL_SPECIFICATIONS.md` - Detailed technical specs
- `README.md` - Basic setup and usage
- `PRINTER_SETUP.md` - Printer configuration guide

### Key Files to Understand
- `index.js` - Main application entry
- `customer_bot/journey/customerJourney.js` - State definitions
- `customer_bot/journey/fns.js` - Shared functions
- `schemas/customer.js` - Customer data model
- `api/orderNotification.js` - Printer integration

### External Dependencies
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [CUPS Documentation](https://www.cups.org/doc/man-lp.html)

This developer guide provides everything needed to understand, maintain, and extend the Dringo Lite coffee ordering bot system.
