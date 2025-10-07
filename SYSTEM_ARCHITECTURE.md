# Dringo Lite - System Architecture Documentation
## Initial Version - Complete System Analysis

### Project Overview
Dringo Lite is a sophisticated Telegram bot for coffee ordering with multi-language support, advanced add-ons system, cart management, and thermal printer integration. The system is built with Node.js, Express, MongoDB, and Telegram Bot API.

---

## 🏗️ System Architecture

### Core Components Structure
```
Dringo_2/
├── index.js                    # Main application entry point
├── package.json               # Dependencies and scripts
├── printer.js                 # Thermal printer test utility
├── api/                       # REST API endpoints
│   ├── addProduct.js          # Product management
│   ├── getOrders.js           # Order retrieval
│   └── orderNotification.js   # Order notifications + printer
├── customer_bot/              # Bot conversation logic
│   ├── journey/               # State-based conversation flow
│   │   ├── customerJourney.js # State definitions
│   │   ├── fns.js            # Shared functions
│   │   ├── actions/          # State action handlers
│   │   └── validators/       # State validation logic
│   ├── resolvers/            # State resolution
│   └── updates/              # Update handlers
├── schemas/                   # MongoDB data models
│   ├── customer.js           # Customer schema
│   ├── product.js            # Product schema
│   ├── order.js              # Order schema
│   └── localization.js       # Multi-language support
└── utils/                    # Utility functions
    ├── localizedString.js    # Language localization
    ├── bootTime.js           # Stale update filtering
    └── saveWithRetry.js      # Database retry logic
```

---

## 🔄 Customer Journey Flow

### State-Based Conversation Management
The bot uses a sophisticated state machine with 15 distinct states:

#### Registration Flow (Linear)
```
fresh-start → accepting-terms → choosing-language → giving-phone-number → giving-full-name → none
```

#### Shopping Flow (Non-linear)
```
none (main menu)
├── explore-products → product-details → product-details-addons → review-cart
├── support → none
├── settings → changing-language → none
└── review-cart → select-pickup-time → paying-for-order → waiting-for-order
```

### State Definitions
Each state contains:
- **state**: Unique identifier
- **navItem**: Navigation context
- **back**: Whether back navigation is allowed
- **_validation()**: Input validation logic
- **action()**: State-specific action handler
- **_updateCustomerData()**: State transition logic

---

## 📊 Database Schema

### Customer Schema
```javascript
{
  telegramId: Number (unique, indexed),
  agreedToTerms: Boolean,
  preferredLanguage: String,
  phoneNumber: String,
  fullName: String,
  cart: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    sizeOption: { size: String, price: Number },
    addOns: [{ forItem: Number, kind: String, option: String, price: Number }],
    currentItem: Number,
    totalPrice: Number
  }],
  state: String (enum: 15 states),
  stateDetails: String,
  lastSeenMessageId: Number
}
```

### Product Schema
```javascript
{
  title: ObjectId (ref: Localization),
  description: ObjectId (ref: Localization),
  sizeOptions: [{ size: String, price: Number }],
  defaultAddOns: [{ kind: String, option: String, price: Number }],
  possibleAddOns: [{ kind: String, option: String, price: Number }],
  status: String (active/paused)
}
```

### Order Schema
```javascript
{
  customer: ObjectId (ref: Customer),
  selectedProducts: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    sizeOption: { size: String, price: Number },
    addOns: [{ forItem: Number, kind: String, option: String, price: Number }],
    totalPrice: Number
  }],
  pickupTime: String,
  status: String (waiting-for-receipt/ready)
}
```

### Localization Schema
```javascript
{
  key: String (indexed),
  translations: Map { en: String, ru: String, uz: String },
  status: String (needs-review/approved)
}
```

---

## 🛠️ Technical Implementation

### Update Handling Flow
```
Telegram Update → updateHandler → messageHandler/callbackQueryHandler → privateHandler → stateResolver → journeyPath[state].action()
```

### Message Processing
1. **Stale Update Filtering**: Ignores updates from before bot startup
2. **Customer Resolution**: Finds or creates customer record
3. **State Resolution**: Determines current state and executes action
4. **Response Generation**: Sends appropriate response based on state

### Error Handling
- Global error handlers prevent crashes
- Stale update filtering prevents processing old messages
- Graceful degradation for printer failures
- User-friendly error messages with retry options

---

## 🌐 Multi-Language Support

### Supported Languages
- **English (en)**: Default language
- **Russian (ru)**: Full translation support
- **Uzbek (uz)**: Full translation support

### Localization System
- Dynamic localization via MongoDB
- Fallback to English if translation missing
- Template variable substitution: `{{variableName}}`
- Status tracking for translation review

---

## 🛒 Product & Add-ons System

### Product Structure
- **Multiple Sizes**: Small, Medium, Large with different prices
- **Default Add-ons**: Included by default (e.g., 2 spoons sugar)
- **Possible Add-ons**: Available customization options

### Add-ons Categories
1. **Sugar**: 0, 1, 2, 3 spoons (free)
2. **Syrups**: Vanilla, Caramel, Hazelnut (+3000 UZS each)
3. **Cream**: Whole milk, Almond milk, Oat milk (varying prices)

### Cart Management
- Add multiple products with different configurations
- Edit quantities and add-ons per item
- Remove individual items or clear entire cart
- Real-time price calculation with add-ons

---

## 🖨️ Printer Integration

### XP58 Thermal Printer
- **CUPS Integration**: Uses `lp` command for Linux
- **Fallback Support**: Direct device path `/dev/usb/lp0`
- **Receipt Formatting**: Professional receipt layout
- **Error Handling**: Graceful degradation if printer unavailable

### Receipt Features
- Large header: "NEW ORDER"
- Prominent pickup time display
- Detailed product list with add-ons
- Grouped add-ons by item number
- Total amount calculation
- Timestamp and order ID

---

## 🔌 API Endpoints

### Product Management
- **POST /addProduct**: Add custom products with localization
- **POST /addSampleCoffees**: Create sample coffee products

### Order Management
- **GET /getOrders**: Retrieve pending orders (marks as ready)
- **POST /order**: Order notification with printer integration

---

## 🚀 Key Features

### 1. State-Based Conversation
- 15 distinct conversation states
- Validation and action separation
- Smooth state transitions
- Back navigation support

### 2. Advanced Cart System
- Multiple product configurations
- Per-item add-on customization
- Real-time price calculation
- Quantity management

### 3. Multi-Language Support
- Dynamic localization
- Fallback mechanisms
- Translation status tracking
- Template variable support

### 4. Printer Integration
- Automatic receipt printing
- Professional formatting
- Error handling
- Multiple interface support

### 5. Error Resilience
- Global error handlers
- Stale update filtering
- Graceful degradation
- User-friendly error messages

---

## 🔧 Configuration

### Environment Variables
- `CUSTOMER_BOT_TOKEN`: Telegram bot token
- `PORT`: Express server port

### Database
- MongoDB connection: `mongodb://127.0.0.1:27017/dringo-lite`
- Automatic customer creation
- State persistence

### Printer Setup
- CUPS printer name: "XP58"
- Fallback device: "/dev/usb/lp0"
- Test utility: `printer.js`

---

## 📈 System Strengths

1. **Modular Architecture**: Clear separation of concerns
2. **Robust State Management**: Comprehensive conversation flow
3. **Multi-Language Support**: Dynamic localization system
4. **Flexible Add-ons**: Sophisticated customization options
5. **Printer Integration**: Professional receipt printing
6. **Error Handling**: Comprehensive error management
7. **User Experience**: Intuitive interface with clear navigation

---

## ⚠️ Potential Issues

1. **Printer Connectivity**: Network/USB connection failures
2. **MongoDB Connection**: Database connectivity issues
3. **Telegram API Limits**: Rate limiting considerations
4. **Localization Consistency**: Translation data integrity
5. **State Edge Cases**: Unusual user behavior scenarios

---

## 🎯 Production Readiness

The system is well-structured and production-ready with:
- Comprehensive error handling
- Graceful degradation
- Professional receipt printing
- Multi-language support
- Robust state management
- Clear separation of concerns

This architecture provides a solid foundation for a coffee ordering system with room for future enhancements and scalability.
