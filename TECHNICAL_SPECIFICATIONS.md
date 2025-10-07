# Dringo Lite - Technical Specifications
## Detailed Technical Implementation Guide

### System Requirements

#### Runtime Environment
- **Node.js**: v14+ (ES6 modules support)
- **MongoDB**: v4.4+ (local instance)
- **Operating System**: Linux (Ubuntu/Debian recommended)
- **Memory**: Minimum 512MB RAM
- **Storage**: 1GB free space

#### Dependencies
```json
{
  "cors": "^2.8.5",
  "dayjs": "^1.11.18",
  "dotenv": "^17.2.2",
  "express": "^5.1.0",
  "mongoose": "^8.18.1",
  "node-telegram-bot-api": "^0.66.0",
  "node-thermal-printer": "^4.5.0"
}
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Required
CUSTOMER_BOT_TOKEN=your_telegram_bot_token_here
PORT=3000

# Optional
NODE_ENV=production
MONGODB_URI=mongodb://127.0.0.1:27017/dringo-lite
```

### Database Configuration
```javascript
// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/dringo-lite")
```

### Printer Configuration
```javascript
// CUPS Printer Name
const CUPS_PRINTER_NAME = "XP58";

// Fallback Device Path
const DEV_PATH = "/dev/usb/lp0";
```

---

## 🏗️ Architecture Patterns

### 1. State Machine Pattern
```javascript
// State Definition Structure
{
    state: "state-name",
    navItem: "navigation-context",
    back: boolean,
    _validation(ctx) { /* validation logic */ },
    action(ctx) { /* action logic */ },
    async _updateCustomerData(ctx) { /* state transition */ }
}
```

### 2. Middleware Pattern
```javascript
// Update Handler Chain
Telegram Update → updateHandler → messageHandler/callbackQueryHandler → privateHandler → stateResolver
```

### 3. Repository Pattern
```javascript
// Data Access Layer
Customer.findOne({ telegramId: msg.chat.id })
Product.find({ status: "active" })
Order.findByIdAndUpdate({ _id: order._id }, { status: "ready" })
```

### 4. Factory Pattern
```javascript
// Localization Factory
const loc = new Localization({
    key: title.en,
    translations: { en: title.en, ru: title.ru, uz: title.uz }
});
```

---

## 📊 Data Models

### Customer Schema Details
```javascript
const customerSchema = new Schema({
    // Primary Key
    telegramId: { type: Number, required: true, unique: true, index: true },
    
    // Registration Data
    agreedToTerms: { type: Boolean, required: true, default: false },
    preferredLanguage: { type: String },
    phoneNumber: { type: String },
    fullName: { type: String },
    
    // Location Data
    lastSavedLocation: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    
    // Shopping Cart
    cart: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true, default: 1 },
        sizeOption: {
            size: { type: String, required: true },
            price: { type: Number, required: true }
        },
        addOns: [{
            forItem: { type: Number, required: true, default: 0 },
            kind: { type: String, required: true },
            option: { type: String, required: true },
            price: { type: Number, required: true, default: 0 }
        }],
        currentItem: { type: Number, default: 0 },
        totalPrice: { type: Number, required: true, default: 0 }
    }],
    
    // Session Management
    lastSeenMessageId: { type: Number },
    state: { type: String, required: true, enum: [...], default: "fresh-start" },
    stateDetails: { type: String, required: true, default: "none" }
}, { timestamps: true });
```

### Product Schema Details
```javascript
const productSchema = new Schema({
    // Localized Content
    title: { type: Schema.Types.ObjectId, ref: "Localization" },
    description: { type: Schema.Types.ObjectId, ref: "Localization" },
    
    // Size Options
    sizeOptions: [{
        size: { type: String, required: true },
        price: { type: Number, required: true }
    }],
    
    // Add-ons Configuration
    defaultAddOns: [{
        kind: { type: String, required: true },
        option: { type: String, required: true },
        price: { type: Number, required: true, default: 0 }
    }],
    possibleAddOns: [{
        kind: { type: String, required: true },
        option: { type: String, required: true },
        price: { type: Number, required: true, default: 0 }
    }],
    
    // Status
    status: { type: String, required: true, default: "active" }
}, { timestamps: true });
```

---

## 🔄 State Management

### State Enumeration
```javascript
const STATES = [
    "fresh-start",
    "accepting-terms", "choosing-language", "giving-phone-number", "giving-full-name",
    "none",
    "support", "settings", "changing-language",
    "explore-products", "product-details", "product-details-addons",
    "review-cart", "select-pickup-time", "paying-for-order", "waiting-for-order",
    "banned"
];
```

### State Transition Logic
```javascript
// State Resolution
export default function stateResolver(ctx) {
    if (!ctx.user) return console.error("Error getting a user in context");
    const currentPath = journeyPath.find(p => p.state === ctx.user.state);
    return currentPath.action(ctx);
}
```

### Validation Pattern
```javascript
// Validation Function Structure
export default function stateValidation(ctx, path) {
    // Input validation logic
    // Return true if valid, false if invalid
    // Handle error responses
}
```

---

## 🌐 Localization System

### Localization Schema
```javascript
const localizationSchema = new Schema({
    key: { type: String, required: true, index: true },
    translations: {
        type: Map,
        of: String // {en: str, ru: str, uz: str}
    },
    status: {
        type: String,
        required: true,
        enum: ["needs-review", "needs-review-after-changes", "approved"],
        default: "needs-review"
    }
}, { timestamps: true });
```

### Localization Function
```javascript
export default async function localizedString(ctx, key, attributes = {}) {
    let loc = await Localization.findOne({ key }).exec();
    
    if (!loc) {
        loc = new Localization({
            key,
            translations: { en: key }
        });
        await loc.save();
    }
    
    const lang = ctx.user?.preferredLanguage || "en";
    let text = loc.translations.get(lang) || loc.translations.get("en");
    
    // Template variable substitution
    for (const [attrKey, value] of Object.entries(attributes)) {
        text = text.replace(new RegExp(`{{${attrKey}}}`, "g"), value);
    }
    
    return text;
}
```

---

## 🖨️ Printer Integration

### CUPS Integration
```javascript
// Print Function
async function printOrderReceipt(orderData) {
    // Build receipt text
    let receiptText = buildReceiptText(orderData);
    
    // Write to temporary file
    const tmpFile = '/tmp/receipt.txt';
    fs.writeFileSync(tmpFile, receiptText);
    
    // Print via CUPS
    await new Promise((resolve, reject) => {
        const lp = spawn('lp', ['-d', CUPS_PRINTER_NAME, tmpFile]);
        lp.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`lp command failed with code ${code}`));
        });
    });
    
    // Cleanup
    fs.unlinkSync(tmpFile);
}
```

### Receipt Format
```
================================
           NEW ORDER
================================

Order ID: 507f1f77bcf86cd799439011
Customer: John Doe
Phone: +998901234567

================================
           PICKUP TIME
        14:30
================================

ORDER DETAILS:
--------------------------------
1. Espresso
   Size: Medium | Qty: 2
   Price: 36,000 UZS
   Item 1 add-ons:
     - Sugar: 2 spoons
     - Syrup: Vanilla (+3000 UZS)
   Item 2 add-ons:
     - Sugar: 1 spoon

================================
             TOTAL
        39,000 UZS
================================

           Thank you!
    2024-01-15 14:15:30
```

---

## 🔌 API Endpoints

### Product Management
```javascript
// POST /addProduct
router.post("/addProduct", async (req, res) => {
    const { title, description, sizeOptions, possibleAddOns, defaultAddOns } = req.body;
    
    // Create localizations
    const titleLoc = await createLocalization(title);
    const descLoc = await createLocalization(description);
    
    // Create product
    const product = new Product({
        title: titleLoc._id,
        description: descLoc._id,
        sizeOptions,
        possibleAddOns,
        defaultAddOns
    });
    
    await product.save();
    res.status(201).json(product);
});
```

### Order Management
```javascript
// GET /getOrders
router.get("/getOrders", async (req, res) => {
    const orders = await Order.find({ status: "waiting-for-receipt" })
        .populate('customer')
        .populate('selectedProducts.product')
        .exec();
    
    // Mark as ready
    for (const order of orders) {
        await Order.findByIdAndUpdate(order._id, { status: "ready" });
    }
    
    res.json({ success: true, count: orders.length, orders });
});
```

---

## 🛡️ Error Handling

### Global Error Handlers
```javascript
// Unhandled Rejection
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught Exception
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    if (error.name !== 'VersionError') {
        process.exit(1);
    }
});
```

### Update Error Handling
```javascript
// Message Error Handling
customerBot.on(MESSAGE, async (msg) => {
    try {
        await updateHandler(MESSAGE, msg);
    } catch (error) {
        console.error('Error handling message:', error);
        try {
            await customerBot.sendMessage(msg.chat.id, 
                "⚠️ <b>Oops!</b> Something went wrong.\n\nPlease try again in a moment, or tap <b>/start</b> to continue.",
                { parse_mode: 'HTML', disable_web_page_preview: true }
            );
        } catch (sendError) {
            console.error('Error sending error message:', sendError);
        }
    }
});
```

### Stale Update Filtering
```javascript
// Boot Time Tracking
export const BOOT_TIME = Math.floor(Date.now() / 1000);

export function isUpdateStale(updateDateSeconds) {
    if (!updateDateSeconds || typeof updateDateSeconds !== 'number') return false;
    return updateDateSeconds < BOOT_TIME;
}
```

---

## 🚀 Performance Optimizations

### Database Indexing
```javascript
// Customer Schema Indexes
telegramId: { type: Number, required: true, unique: true, index: true }

// Localization Schema Indexes
key: { type: String, required: true, index: true }
```

### Query Optimization
```javascript
// Populate with specific fields
.populate({
    path: 'customer',
    select: 'telegramId fullName phoneNumber preferredLanguage'
})

// Lean queries for read-only operations
const customers = await Customer.find({}, { telegramId: 1 }).lean();
```

### Memory Management
```javascript
// Cleanup temporary files
fs.unlinkSync(tmpFile);

// Rate limiting for broadcasts
await new Promise(r => setTimeout(r, 50));
```

---

## 🔒 Security Considerations

### Input Validation
- All user inputs are validated at state level
- MongoDB injection prevention via Mongoose
- Telegram user ID verification

### Error Information
- No sensitive data in error messages
- Generic error responses to users
- Detailed logging for debugging

### Rate Limiting
- Broadcast message delays (50ms between messages)
- Stale update filtering
- Graceful degradation under load

---

## 📈 Monitoring & Logging

### Logging Strategy
```javascript
// Structured logging
console.log('🔔 New Order Notification Received:');
console.log('📋 Order ID:', orderData._id);
console.log('👤 Customer:', orderData.customer?.fullName || 'N/A');
console.log('📞 Phone:', orderData.customer?.phoneNumber || 'N/A');
```

### Error Tracking
```javascript
// Error logging with context
console.error('Error handling message:', error);
console.error('Error sending error message:', sendError);
console.error('Startup broadcast failed:', e);
```

### Performance Monitoring
```javascript
// Operation timing
console.log(`Startup broadcast sent to ${customers.length} customers`);
console.log(`Break broadcast sent to ${customers.length} customers`);
```

---

## 🧪 Testing Strategy

### Unit Testing
- State validation functions
- Localization functions
- Utility functions

### Integration Testing
- API endpoints
- Database operations
- Printer integration

### End-to-End Testing
- Complete customer journey
- Multi-language flows
- Error scenarios

---

## 📦 Deployment

### Production Setup
1. Install dependencies: `npm install`
2. Configure environment variables
3. Start MongoDB service
4. Configure CUPS printer
5. Start application: `npm start`

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Process Management
```bash
# PM2 configuration
pm2 start index.js --name "dringo-lite"
pm2 save
pm2 startup
```

This technical specification provides a comprehensive guide for understanding, maintaining, and extending the Dringo Lite coffee ordering bot system.
