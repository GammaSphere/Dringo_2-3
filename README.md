# Dringo Lite - Coffee Ordering Telegram Bot

A simple Telegram bot for ordering coffee with customizable add-ons including syrups, creams, and sugar options.

## Features

- **Coffee Menu**: Browse available coffee products (Espresso, Cappuccino, Americano, Latte)
- **Size Options**: Choose from Small, Medium, or Large sizes
- **Add-ons System**: Customize your coffee with:
  - **Sugar**: 0, 1, 2, or 3 spoons (default: 2 spoons)
  - **Syrups**: Vanilla, Caramel, Hazelnut (+3000 UZS each)
  - **Cream**: Whole milk, Almond milk, Oat milk (prices vary)
- **Multi-language Support**: English, Russian, Uzbek
- **Cart Management**: Add multiple items, edit quantities, remove items
- **Order Flow**: Select pickup time and complete payment

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file with:
   ```
   CUSTOMER_BOT_TOKEN=your_telegram_bot_token_here
   PORT=3000
   ```

3. **Start MongoDB**:
   Make sure MongoDB is running on `mongodb://127.0.0.1:27017/dringo-lite`

4. **Add Sample Coffee Products**:
   ```bash
   curl -X POST http://localhost:3000/addSampleCoffees
   ```

5. **Run the Bot**:
   ```bash
   npm start
   ```

## API Endpoints

### Add Sample Coffee Products
```bash
POST /addSampleCoffees
```
Creates 4 sample coffee products with different sizes and add-on options.

### Add Custom Product
```bash
POST /addProduct
Content-Type: application/json

{
  "title": {"en": "Mocha", "ru": "Мокка", "uz": "Mocha"},
  "description": {"en": "Coffee with chocolate", "ru": "Кофе с шоколадом", "uz": "Shokolad bilan qahva"},
  "sizeOptions": [
    {"size": "Small", "price": 25000},
    {"size": "Medium", "price": 30000},
    {"size": "Large", "price": 35000}
  ],
  "defaultAddOns": [
    {"kind": "Sugar", "option": "2 spoons", "price": 0}
  ],
  "possibleAddOns": [
    {"kind": "Sugar", "option": "0 spoons", "price": 0},
    {"kind": "Sugar", "option": "1 spoon", "price": 0},
    {"kind": "Sugar", "option": "2 spoons", "price": 0},
    {"kind": "Sugar", "option": "3 spoons", "price": 0},
    {"kind": "Syrup", "option": "Chocolate", "price": 3000}
  ]
}
```

### Get Orders
```bash
GET /orders
```

## Bot Flow

1. **Registration**: Users agree to terms, choose language, provide phone and name
2. **Main Menu**: Access to products, support, and settings
3. **Browse Products**: View coffee menu with size options
4. **Product Details**: Select quantity and customize add-ons
5. **Cart Review**: Review all items and total price
6. **Pickup Time**: Choose when to collect the order
7. **Payment**: Simple payment flow (mock implementation)
8. **Order Completion**: Wait for order to be ready

## Add-ons System

The add-ons system supports three types:

- **Sugar**: Free option with different spoon counts (0-3 spoons)
- **Syrup**: Premium flavoring options (+3000 UZS each)
- **Cream**: Milk alternatives with varying prices

Each coffee product has:
- `defaultAddOns`: What's included by default (e.g., 2 spoons of sugar)
- `possibleAddOns`: All available customization options

When adding multiple quantities of the same product, each item can have different add-ons customized individually.

## Database Schema

### Product
- Title and description (localized)
- Size options with prices
- Default and possible add-ons

### CartItem
- Product reference
- Quantity and size selection
- Individual add-ons per item
- Total price calculation

### Customer
- Telegram user info
- Language preference
- Current state and cart
- Order history

### Order
- Customer reference
- Selected cart items
- Pickup time and status

## Testing

1. Start the bot and MongoDB
2. Add sample products via API
3. Start a conversation with your Telegram bot
4. Go through the registration flow
5. Browse products and test the add-ons system
6. Complete an order to test the full flow

The bot supports multiple users simultaneously and maintains individual cart states.
