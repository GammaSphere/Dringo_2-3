# DrinGo Bot - Complete System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [Core Components](#core-components)
5. [State Management](#state-management)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Order Processing Flow](#order-processing-flow)
9. [Error Handling](#error-handling)
10. [Printer Integration](#printer-integration)
11. [Menu Management](#menu-management)
12. [Deployment](#deployment)
13. [Configuration](#configuration)

## System Overview

DrinGo is a Telegram-based coffee ordering bot that allows customers to:
- Browse a menu of 19 coffee and tea products
- Customize orders with add-ons (sugar, syrups, toppings)
- Place orders with pickup time selection
- Receive order confirmations and receipts
- Track order status

### Key Features
- **Multi-language support** (English, Russian, Uzbek)
- **State-based conversation flow** with validation
- **Real-time order processing** with thermal printer integration
- **Robust error handling** and recovery mechanisms
- **Cart management** with add-on customization
- **Order tracking** and status updates

## Architecture

### Technology Stack
- **Runtime**: Node.js with ES6 modules
- **Database**: MongoDB with Mongoose ODM
- **Bot Framework**: node-telegram-bot-api
- **Web Server**: Express.js
- **Process Management**: PM2 (Python wrapper)
- **Printer**: CUPS with XP-58 thermal printer
- **Language**: JavaScript (ES6+)

### Project Structure
```
Dringo_2.2/
├── index.js                 # Main entry point
├── bot.py                   # PM2 process manager
├── customer_bot/            # Bot logic
│   ├── journey/            # State machine
│   ├── updates/            # Message handlers
│   └── resolvers/          # State resolvers
├── api/                    # REST API endpoints
├── schemas/                # MongoDB schemas
├── utils/                  # Utility functions
├── logs/                   # Application logs
└── latest db/              # Database backups
```

## Data Flow

### 1. Bot Initialization
```
index.js → MongoDB Connection → Customer Broadcast → Update Handlers
```

### 2. User Interaction Flow
```
Telegram Message → Update Handler → State Resolver → Action Function → Database Update → Response
```

### 3. Order Processing Flow
```
Cart → Pickup Time → Payment → Order Creation → Notification → Receipt Print
```

## Core Components

### 1. Main Entry Point (`index.js`)
- **Purpose**: Initialize bot, database, and web server
- **Key Functions**:
  - Telegram bot setup with polling
  - MongoDB connection
  - Express server with CORS
  - Startup customer broadcast
  - Global error handlers

### 2. State Machine (`customer_bot/journey/`)
- **Purpose**: Manage user conversation flow
- **Key Files**:
  - `customerJourney.js`: State definitions and transitions
  - `stateResolver.js`: Route messages to appropriate actions
  - `actions/`: Handle specific user actions
  - `validators/`: Validate user input and state transitions

### 3. Update Handlers (`customer_bot/updates/`)
- **Purpose**: Process incoming Telegram updates
- **Key Files**:
  - `updateHandler.js`: Main update router
  - `message/private/privateHandler.js`: Handle private messages
  - `callback_query/callbackQueryHandler.js`: Handle button clicks

### 4. Core Functions (`customer_bot/journey/fns.js`)
- **Purpose**: Centralized UI and business logic
- **Key Functions**:
  - `displayMain()`: Show main menu
  - `displayProductDetails()`: Show product information
  - `displayAvailableProductDetailAddOns()`: Show add-on options
  - `showCart()`: Display cart contents
  - `payForOrder()`: Process payment
  - `waitForOrder()`: Show order confirmation

## State Management

### State Machine Overview
The bot uses a finite state machine with 15+ states:

1. **fresh-start**: New user registration
2. **accepting-terms**: Terms acceptance
3. **choosing-language**: Language selection
4. **giving-phone-number**: Contact sharing
5. **giving-full-name**: Name input
6. **none**: Main menu state
7. **support**: Support menu
8. **settings**: Settings menu
9. **changing-language**: Language change
10. **product-details**: Product information
11. **product-details-addons**: Add-on selection
12. **review-cart**: Cart review
13. **select-pickup-time**: Pickup time selection
14. **paying-for-order**: Payment processing
15. **waiting-for-order**: Order confirmation

### State Transitions
Each state has:
- **Validation function**: Check if transition is valid
- **Action function**: Execute state-specific logic
- **Data update**: Modify user state and details
- **Navigation**: Handle back buttons and flow control

### State Persistence
- User state stored in MongoDB `Customer` collection
- State includes: `state`, `stateDetails`, `cart`, `lastActionTime`
- Automatic state recovery on bot restart
- Safe state reset on errors

## Database Schema

### 1. Customer Schema
```javascript
{
  telegramId: Number,           // Unique Telegram ID
  agreedToTerms: Boolean,       // Terms acceptance
  preferredLanguage: String,    // en/ru/uz
  phoneNumber: String,          // Contact number
  fullName: String,             // Customer name
  cart: [CartItem],             // Shopping cart
  state: String,                // Current state
  stateDetails: String,         // State-specific data
  lastSeenMessageId: Number,    // Last message ID
  lastActionTime: Number        // Button debouncing
}
```

### 2. Product Schema
```javascript
{
  title: ObjectId,              // Reference to Localization
  description: ObjectId,        // Reference to Localization
  sizeOptions: [{
    size: String,               // "30ml", "250ml", etc.
    price: Number               // Price in UZS
  }],
  defaultAddOns: [{
    kind: String,               // "Sugar👇", "Syrup👇", "Add-ons👇"
    option: String,             // "1", "Caramel", "Lemon"
    price: Number               // Add-on price
  }],
  possibleAddOns: [AddOn],      // Available add-ons
  status: String                // "active" | "paused"
}
```

### 3. Order Schema
```javascript
{
  orderNumber: String,          // Human-readable order ID
  customer: ObjectId,           // Reference to Customer
  selectedProducts: [CartItem], // Ordered items
  pickupTime: String,           // Selected pickup time
  status: String,               // Order status
  createdAt: Date,              // Order timestamp
  updatedAt: Date               // Last update
}
```

### 4. Localization Schema
```javascript
{
  key: String,                  // English key
  translations: {
    en: String,                 // English text
    ru: String,                 // Russian text
    uz: String                  // Uzbek text
  },
  status: String                // "approved" | "pending"
}
```

## API Endpoints

### 1. Product Management
- **POST /addProduct**: Add single product
- **POST /replaceMenu**: Replace entire menu (19 products)
- **GET /products**: Get all products

### 2. Order Management
- **POST /order**: Receive order notifications
- **GET /getOrders**: Get pending orders
- **PUT /order/:id/status**: Update order status

### 3. System Health
- **GET /health**: Health check endpoint
- **GET /status**: System status

## Order Processing Flow

### 1. Cart Management
```
Product Selection → Size Selection → Add-on Configuration → Cart Storage
```

### 2. Add-on System
- **Sugar**: 1, 2, 3 options (free)
- **Syrups**: 10 flavors (5000 UZS each)
  - Caramel, Salt caramel, Chocolate, Vanilla, Coconut
  - Hazelnut, Burned Hazelnut, Pistachio, Strawberry, Mint
- **Add-ons**: Whipped Cream, Marshmallow, Topping (5000 UZS each)
- **Special Cases**:
  - Black Tea & Green Tea: Only Lemon add-on
  - Premium products (10-19): No add-ons

### 3. Payment Flow
```
Cart Review → Pickup Time → Payment Confirmation → Order Creation → Notification → Receipt
```

### 4. Order Notification
- HTTP POST to `/order` endpoint
- Console logging with detailed breakdown
- Thermal printer receipt generation
- Order status tracking

## Error Handling

### 1. Retry Mechanisms (`utils/errorRecovery.js`)
- **Database operations**: 3 retries with exponential backoff
- **API calls**: 2 retries with 2s delay
- **Telegram API**: 2 retries with 1s delay
- **Printer operations**: 1 retry with 3s delay

### 2. Error Types
- **Database errors**: Version conflicts, validation errors
- **Telegram errors**: Rate limits, chat not found
- **External service errors**: Printer failures, payment issues
- **Critical errors**: System failures requiring recovery

### 3. Recovery Strategies
- **State reset**: Return to safe state on errors
- **Graceful degradation**: Continue with reduced functionality
- **User notification**: Inform users of temporary issues
- **Automatic retry**: Retry failed operations

### 4. Edge Case Handling (`utils/edgeCaseHandler.js`)
- **Malformed data detection**
- **Invalid state transition prevention**
- **Data corruption recovery**
- **Frequency-based error detection**

## Printer Integration

### 1. Thermal Printer Setup
- **Model**: XP-58 thermal printer
- **Interface**: CUPS (Common Unix Printing System)
- **Commands**: `lp` command for printing

### 2. Receipt Format
```
================================
        DRINGO COFFEE SHOP
================================
Order: DR-20251007-016
Time: 16:21
Customer: [Name]
Phone: [Number]

Items:
• Espresso (60ml) x3
  Base: 23,000 UZS each
  
  Item 1 add-ons:
  · Sugar 3
  · Syrup Chocolate
  · Add-ons Topping
  Total: 33,000 UZS
  
  Subtotal: 89,000 UZS

================================
             TOTAL
        137,000 UZS
================================
```

### 3. Print Process
1. Generate receipt text
2. Save to temporary file
3. Execute `lp -d XP-58 /tmp/receipt.txt`
4. Clean up temporary file
5. Handle print errors gracefully

## Menu Management

### 1. Current Menu (19 Products)

#### Classic Coffee (Products 1-7)
1. **Espresso** (30ml/60ml) - 20,000/23,000 UZS
2. **Cappuccino** (250ml/350ml) - 25,000/29,000 UZS
3. **Kakao** (250ml/350ml) - 25,000/29,000 UZS
4. **Americano** (200ml/300ml) - 22,000/25,000 UZS
5. **Latte** (250ml/350ml) - 25,000/29,000 UZS
6. **Hot Chocolate** (250ml/350ml) - 25,000/29,000 UZS
7. **Flat White** (250ml) - 27,000 UZS

#### Tea Products (Products 8-9)
8. **Black Tea** (350ml) - 7,000 UZS
   - Add-ons: Sugar (1,2,3), Lemon only
9. **Green Tea** (350ml) - 7,000 UZS
   - Add-ons: Sugar (1,2,3), Lemon only

#### Premium Products (Products 10-19)
10. **Iris-Caramel Latte** (300ml) - 35,000 UZS
11. **Choco-Mint Cappuccino** (300ml) - 35,000 UZS
12. **Original Raf** (300ml) - 40,000 UZS
13. **Raf Baunty** (300ml) - 40,000 UZS
14. **Mokkachino** (300ml) - 35,000 UZS
15. **Raf Coffee** (300ml) - 35,000 UZS
16. **Berry Tea** (300ml) - 25,000 UZS
17. **Sea Buckthorn Tea** (300ml) - 25,000 UZS
18. **Moroccan Tea** (300ml) - 25,000 UZS
19. **Ginger Tea** (300ml) - 25,000 UZS

### 2. Add-on Configuration
- **All add-ons cost 5000 UZS** (except sugar)
- **Sugar options**: 1, 2, 3 (no default selection)
- **Syrup options**: 10 flavors in 4×3 grid layout
- **Add-on categories**: Whipped Cream, Marshmallow, Topping
- **Special emoji handling**: 👇 on buttons, removed from receipts

### 3. Menu Update Process
1. Modify `api/addProduct.js` configuration
2. Run `node replace_menu.js` or POST to `/replaceMenu`
3. Server restarts automatically
4. Database cleared and repopulated

## Deployment

### 1. System Requirements
- **OS**: Linux (Ubuntu/Debian recommended)
- **Node.js**: v18+ with ES6 modules
- **MongoDB**: v5.0+
- **Python**: v3.8+ (for PM2 wrapper)
- **CUPS**: For thermal printer support

### 2. Installation Process
```bash
# 1. Clone repository
git clone [repository-url]
cd Dringo_2.2

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with bot token

# 4. Setup database
mongod --dbpath ./data

# 5. Setup printer
sudo ./install_printer.sh

# 6. Start bot
./start_bot.sh
```

### 3. Process Management
- **PM2**: Recommended for production
- **Direct**: For development/testing
- **Auto-restart**: On crashes and updates
- **Log rotation**: Automatic log management

### 4. Monitoring
- **Health checks**: `/health` endpoint
- **Log files**: `logs/` directory
- **Error tracking**: Console and file logging
- **Performance**: Memory and CPU monitoring

## Configuration

### 1. Environment Variables
```bash
CUSTOMER_BOT_TOKEN=your_telegram_bot_token
MONGODB_URI=mongodb://127.0.0.1:27017/dringo-lite
CUPS_PRINTER_NAME=XP-58
NODE_ENV=production
```

### 2. Bot Configuration
- **Polling**: Enabled for real-time updates
- **Parse mode**: HTML for rich formatting
- **Web preview**: Disabled for clean messages
- **Keyboard**: Custom inline keyboards

### 3. Database Configuration
- **Connection**: Local MongoDB instance
- **Collections**: customers, products, orders, localizations
- **Indexes**: telegramId (unique), orderNumber (unique)
- **Backup**: Automatic daily backups

### 4. Printer Configuration
- **Driver**: ESC/POS compatible
- **Interface**: CUPS system
- **Paper width**: 58mm thermal paper
- **Character set**: UTF-8 with Cyrillic support

## Key Features Implementation

### 1. Multi-language Support
- **Localization system**: Centralized text management
- **Language detection**: Based on user preference
- **Dynamic text**: Context-aware translations
- **Fallback**: English as default language

### 2. Cart Management
- **Persistent storage**: MongoDB-based cart
- **Add-on customization**: Per-item configuration
- **Quantity support**: Multiple items with different add-ons
- **Price calculation**: Automatic total computation

### 3. Order Tracking
- **Unique order numbers**: DR-YYYYMMDD-XXX format
- **Status updates**: Real-time order status
- **Pickup time**: Flexible time selection
- **Receipt generation**: Automatic thermal printing

### 4. Error Recovery
- **State management**: Safe state transitions
- **Retry logic**: Automatic operation retries
- **Graceful degradation**: Continue with reduced functionality
- **User feedback**: Clear error messages

## Security Considerations

### 1. Data Protection
- **Input validation**: All user input sanitized
- **SQL injection**: MongoDB ODM prevents injection
- **XSS prevention**: HTML escaping in messages
- **Rate limiting**: Button debouncing and spam prevention

### 2. Access Control
- **Bot token**: Secure environment variable storage
- **Database access**: Local MongoDB instance
- **API endpoints**: Internal network only
- **Printer access**: System-level permissions

### 3. Error Handling
- **Sensitive data**: No sensitive info in logs
- **Error messages**: User-friendly error responses
- **System failures**: Graceful degradation
- **Recovery**: Automatic state reset on errors

## Performance Optimization

### 1. Database Optimization
- **Indexing**: Strategic index placement
- **Population**: Efficient data loading
- **Caching**: Product data caching
- **Connection pooling**: MongoDB connection management

### 2. Memory Management
- **Garbage collection**: Automatic memory cleanup
- **Object pooling**: Reuse of common objects
- **Stream processing**: Efficient data handling
- **Memory monitoring**: Automatic memory tracking

### 3. Response Time
- **Async operations**: Non-blocking I/O
- **Parallel processing**: Concurrent operations
- **Caching**: Frequently accessed data
- **Optimization**: Minimal database queries

## Maintenance and Updates

### 1. Regular Maintenance
- **Log rotation**: Automatic log cleanup
- **Database cleanup**: Remove old orders
- **Performance monitoring**: System health checks
- **Backup verification**: Ensure backup integrity

### 2. Update Process
- **Code updates**: Git-based deployment
- **Database migrations**: Schema versioning
- **Menu updates**: API-based menu replacement
- **Configuration changes**: Environment variable updates

### 3. Troubleshooting
- **Log analysis**: Comprehensive logging
- **Error tracking**: Detailed error information
- **State debugging**: User state inspection
- **Performance profiling**: Bottleneck identification

## Future Enhancements

### 1. Planned Features
- **Payment integration**: Online payment processing
- **Loyalty program**: Customer rewards system
- **Analytics**: Order and customer analytics
- **Mobile app**: Native mobile application

### 2. Technical Improvements
- **Microservices**: Service decomposition
- **Containerization**: Docker deployment
- **Load balancing**: Multi-instance support
- **Real-time updates**: WebSocket integration

### 3. Business Features
- **Inventory management**: Stock tracking
- **Staff management**: Employee accounts
- **Reporting**: Business intelligence
- **Marketing**: Promotional campaigns

---

## Conclusion

The DrinGo bot is a comprehensive coffee ordering system built with modern web technologies and robust error handling. It provides a seamless user experience with multi-language support, flexible ordering options, and reliable order processing. The system is designed for scalability and maintainability, with comprehensive documentation and monitoring capabilities.

For technical support or questions about this documentation, please refer to the development team or check the project's issue tracker.
