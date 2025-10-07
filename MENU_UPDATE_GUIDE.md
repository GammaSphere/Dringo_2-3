# 🍵 Menu Update Guide - Dringo 2.2

## 📋 New Menu Overview

The menu has been completely replaced with 19 new products, organized into two categories:

### **Products 1-9: Classic Coffee with Add-ons**
These products support full customization with sugar, syrups, and cream options.

### **Products 10-19: Premium Products without Add-ons**
These are specialty drinks that come as-is without customization options.

## 🎯 Complete Product List

| # | Product Name | Sizes | Prices (UZS) | Add-ons |
|---|--------------|-------|--------------|---------|
| 1 | **Espresso** | 30ml, 60ml | 20,000 / 23,000 | ✅ Yes |
| 2 | **Cappuccino** | 250ml, 350ml | 25,000 / 29,000 | ✅ Yes |
| 3 | **Kakao** | 250ml, 350ml | 25,000 / 29,000 | ✅ Yes |
| 4 | **Americano** | 200ml, 300ml | 22,000 / 25,000 | ✅ Yes |
| 5 | **Latte** | 250ml, 350ml | 25,000 / 29,000 | ✅ Yes |
| 6 | **Hot Chocolate** | 250ml, 350ml | 25,000 / 29,000 | ✅ Yes |
| 7 | **Flat White** | 250ml | 27,000 | ✅ Yes |
| 8 | **Black Tea** | 350ml | 7,000 | ✅ Yes |
| 9 | **Green Tea** | 350ml | 7,000 | ✅ Yes |
| 10 | **Iris-Caramel Latte** | 300ml | 35,000 | ❌ No |
| 11 | **Choco-Mint Cappuccino** | 300ml | 35,000 | ❌ No |
| 12 | **Original Raf** | 300ml | 40,000 | ❌ No |
| 13 | **Raf Baunty** | 300ml | 40,000 | ❌ No |
| 14 | **Mokkachino** | 300ml | 35,000 | ❌ No |
| 15 | **Raf Coffee** | 300ml | 35,000 | ❌ No |
| 16 | **Berry Tea** | 300ml | 25,000 | ❌ No |
| 17 | **Sea Buckthorn Tea** | 300ml | 25,000 | ❌ No |
| 18 | **Moroccan Tea** | 300ml | 25,000 | ❌ No |
| 19 | **Ginger Tea** | 300ml | 25,000 | ❌ No |

## 🍯 Add-ons Configuration

### **Sugar Options** (Free)
- 1 (no default selection)
- 2
- 3

### **Syrup Options** (5,000 UZS each)
- Caramel
- Chocolate
- Coconut
- Vanilla

### **Add-on Options** (5,000 UZS each)
- Marshmallow
- Whipped Cream
- Topping

## 🚀 How to Apply the New Menu

### **Method 1: Using the Replacement Script (Recommended)**

1. **Start the bot server:**
   ```bash
   npm start
   # or
   node index.js
   ```

2. **Run the replacement script:**
   ```bash
   node replace_menu.js
   ```

3. **Verify the update:**
   - Check the console output for success message
   - Test the bot by sending `/start` and exploring products

### **Method 2: Using API Endpoint Directly**

1. **Start the bot server:**
   ```bash
   npm start
   ```

2. **Make API call:**
   ```bash
   curl -X POST http://localhost:3000/replaceMenu
   ```

3. **Check response:**
   ```json
   {
     "message": "Menu replaced successfully with 19 new products",
     "totalProducts": 19,
     "products": [...]
   }
   ```

## ⚠️ Important Notes

### **Data Safety**
- **All existing products and localizations will be deleted**
- **All existing customer carts will be cleared** (products will no longer exist)
- **Order history remains intact**

### **Backup Recommendation**
Before running the replacement, consider backing up your database:
```bash
mongodump --db dringo-lite --out backup_before_menu_update
```

### **Customer Impact**
- Existing customers will need to rebuild their carts
- All product references in existing carts will be invalid
- The bot will handle this gracefully by showing the new menu

## 🔧 Technical Details

### **Files Modified**
- `api/addProduct.js` - Added `/replaceMenu` endpoint
- `replace_menu.js` - Helper script for easy execution

### **Database Changes**
- **Products Collection:** Completely replaced
- **Localizations Collection:** Completely replaced  
- **Customers Collection:** Cart items will be invalidated
- **Orders Collection:** Unchanged (historical data preserved)

### **API Endpoint**
```
POST /replaceMenu
Content-Type: application/json

Response:
{
  "message": "Menu replaced successfully with 19 new products",
  "totalProducts": 19,
  "products": [array of created products]
}
```

## 🧪 Testing the New Menu

After applying the update, test these scenarios:

1. **Main Menu Display**
   - Send `/start` to bot
   - Click "☕️ Explore Products"
   - Verify 19 products are shown

2. **Product Details**
   - Select any product 1-9
   - Verify size options and prices
   - Check add-ons availability

3. **Premium Products**
   - Select any product 10-19
   - Verify no "Edit Details" button appears
   - Confirm single size option

4. **Add-ons Functionality**
   - Select a product with add-ons (1-9)
   - Click "Edit Details"
   - Verify all add-on options are available
   - Check prices (5,000 UZS for syrups/cream)

5. **Cart Functionality**
   - Add products to cart
   - Verify price calculations
   - Test quantity changes
   - Complete order flow

## 🎨 Multi-language Support

All products support three languages:
- **English (en)** - Primary language
- **Russian (ru)** - Cyrillic translations
- **Uzbek (uz)** - Latin script translations

## 📞 Support

If you encounter any issues:

1. **Check server logs** for error messages
2. **Verify MongoDB connection** is active
3. **Ensure bot server** is running on port 3000
4. **Test API endpoint** directly with curl/Postman

## 🔄 Rollback Plan

If you need to revert to the previous menu:

1. **Restore from backup:**
   ```bash
   mongorestore --db dringo-lite backup_before_menu_update/dringo-lite
   ```

2. **Restart the bot server**

---

**✅ Menu Update Complete!** Your bot now has the new 19-product menu with updated prices and add-on configurations.
