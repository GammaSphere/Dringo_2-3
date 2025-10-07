// import express from 'express';
// import ThermalPrinter from 'node-thermal-printer';

// const router = express.Router();

// // Configure thermal printer for XP58
// const printer = new ThermalPrinter.printer({
//     type: ThermalPrinter.types.EPSON,  // XP58 uses ESC/POS commands compatible with EPSON
//     interface: 'printer:XP-58',        // Printer name (adjust based on your system)
//     characterSet: ThermalPrinter.characterSet.PC852_LATIN2,
//     removeSpecialCharacters: false,
//     lineCharacter: "-",
//     // breakLine: ThermalPrinter.lineBreak.status(),
//     options: {
//         timeout: 5000,
//     }
// });
import express from "express";

const router = express.Router();

// CUPS printer name
const CUPS_PRINTER_NAME = "XP58";      // exact name from `lpstat -p`

// Function to print order receipt using lp command (CUPS)
async function printOrderReceipt(orderData) {
    try {
        console.log('🖨️  Starting receipt print for order:', orderData.orderNumber || orderData._id);
        
        // Build receipt text
        let receiptText = '';
        
        // Header
        receiptText += '================================\n';
        receiptText += '           NEW ORDER\n';
        receiptText += '================================\n\n';
        
        // Order info
        receiptText += `Order ID: ${orderData.orderNumber || orderData._id}\n`;
        receiptText += `Customer: ${orderData.customer?.fullName || 'N/A'}\n`;
        receiptText += `Phone: ${orderData.customer?.phoneNumber || 'N/A'}\n\n`;
        
        // PICKUP TIME - Most Important
        receiptText += '================================\n';
        receiptText += '           PICKUP TIME\n';
        receiptText += `        ${orderData.pickupTime || 'ASAP'}\n`;
        receiptText += '================================\n\n';
        
        // ORDER DETAILS
        receiptText += 'ORDER DETAILS:\n';
        receiptText += '--------------------------------\n';
        
        // Product details
        if (orderData.selectedProducts && orderData.selectedProducts.length > 0) {
            orderData.selectedProducts.forEach((item, index) => {
                // Get product name
                let productName = 'Unknown Product';
                if (item.product?.title?.translations) {
                    const translations = item.product.title.translations;
                    if (typeof translations.get === 'function') {
                        productName = translations.get('en') || 'Unknown Product';
                    } else {
                        productName = translations.en || translations['en'] || 'Unknown Product';
                    }
                }
                
                const size = item.sizeOption?.size || 'N/A';
                const quantity = item.quantity || 1;
                const totalPrice = item.totalPrice || 0;
                
                // If quantity is 1, show simple format
                if (quantity === 1) {
                    receiptText += `${index + 1}. ${productName} (${size})\n`;
                    receiptText += `   Price: ${totalPrice.toLocaleString('en-US')} UZS\n`;
                    
                    // Add-ons for single item
                    if (item.addOns && item.addOns.length > 0) {
                        receiptText += `   Add-ons:\n`;
                        item.addOns.forEach((addon) => {
                            // Remove emoji from kind for receipt printing
                            const cleanKind = addon.kind.replace(/👇/g, '');
                            receiptText += `     - ${cleanKind}: ${addon.option}`;
                            if (addon.price > 0) {
                                receiptText += ` (+${addon.price} UZS)`;
                            }
                            receiptText += '\n';
                        });
                    }
                } else {
                    // Multiple quantities - show detailed breakdown
                    receiptText += `${index + 1}. ${productName} (${size}) x${quantity}\n`;
                    receiptText += `   Base Price: ${(item.sizeOption?.price || 0).toLocaleString('en-US')} UZS each\n`;
                    
                    // Group add-ons by item
                    if (item.addOns && item.addOns.length > 0) {
                        const addonsByItem = {};
                        item.addOns.forEach((addon) => {
                            const itemIndex = addon.forItem || 0;
                            if (!addonsByItem[itemIndex]) {
                                addonsByItem[itemIndex] = [];
                            }
                            addonsByItem[itemIndex].push(addon);
                        });
                        
                        // Show each individual item with its add-ons
                        for (let i = 0; i < quantity; i++) {
                            receiptText += `\n   Item ${i + 1} add-ons:\n`;
                            
                            if (addonsByItem[i] && addonsByItem[i].length > 0) {
                                addonsByItem[i].forEach((addon) => {
                                    // Remove emoji from kind for receipt printing
                                    const cleanKind = addon.kind.replace(/👇/g, '');
                                    receiptText += `     - ${cleanKind}: ${addon.option}`;
                                    if (addon.price > 0) {
                                        receiptText += ` (+${addon.price} UZS)`;
                                    }
                                    receiptText += '\n';
                                });
                            } else {
                                receiptText += `     - No add-ons\n`;
                            }
                            
                            // Calculate item total
                            const itemBasePrice = item.sizeOption?.price || 0;
                            const itemAddonPrice = addonsByItem[i] ? 
                                addonsByItem[i].reduce((sum, addon) => sum + (addon.price || 0), 0) : 0;
                            const itemTotal = itemBasePrice + itemAddonPrice;
                            
                            receiptText += `     Total: ${itemTotal.toLocaleString('en-US')} UZS\n`;
                        }
                    } else {
                        // No add-ons for any items
                        receiptText += `\n   All ${quantity} items: No add-ons\n`;
                        receiptText += `   Each: ${(item.sizeOption?.price || 0).toLocaleString('en-US')} UZS\n`;
                    }
                    
                    receiptText += `   Subtotal: ${totalPrice.toLocaleString('en-US')} UZS\n`;
                }
                
                receiptText += '\n';
            });
        }
        
        // Total
        const totalOrderValue = orderData.selectedProducts?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;
        receiptText += '================================\n';
        receiptText += '             TOTAL\n';
        receiptText += `        ${totalOrderValue.toLocaleString('en-US')} UZS\n`;
        receiptText += '================================\n\n';
        
        // Footer
        receiptText += '           Thank you!\n';
        receiptText += `    ${new Date().toLocaleString()}\n\n\n\n`;
        
        // Print using lp command
        const { spawn } = await import('child_process');
        const fs = await import('fs');
        
        const tmpFile = '/tmp/receipt.txt';
        fs.writeFileSync(tmpFile, receiptText);
        console.log('📁 Receipt saved to temp file:', tmpFile);
        
        await new Promise((resolve, reject) => {
            console.log(`🖨️  Sending to printer: ${CUPS_PRINTER_NAME}`);
            const lp = spawn('lp', ['-d', CUPS_PRINTER_NAME, tmpFile]);
            
            lp.stdout.on('data', (data) => {
                console.log('lp stdout:', data.toString().trim());
            });
            
            lp.stderr.on('data', (data) => {
                console.log('lp stderr:', data.toString().trim());
            });
            
            lp.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Receipt printed successfully via CUPS');
                    resolve();
                } else {
                    console.error(`❌ lp command failed with code ${code}`);
                    reject(new Error(`lp command failed with code ${code}`));
                }
            });
            lp.on('error', (err) => {
                console.error('❌ lp spawn error:', err);
                reject(err);
            });
        });
        
        // Clean up temp file
        fs.unlinkSync(tmpFile);
        console.log('🗑️  Temp file cleaned up');
        
    } catch (error) {
        console.error('❌ Error printing receipt:', error.message || error);
        console.error('❌ Error details:', error);
        // Don't throw error to prevent API failure
    }
}

// Endpoint to receive order notifications
router.post('/order', async (req, res) => {
    try {
        const orderData = req.body;
        
        // Log the received order for demonstration
        console.log('🔔 New Order Notification Received:');
        console.log('📋 Order ID:', orderData._id);
        console.log('👤 Customer:', orderData.customer?.fullName || 'N/A');
        console.log('📞 Phone:', orderData.customer?.phoneNumber || 'N/A');
        console.log('🕐 Pickup Time:', orderData.pickupTime || 'N/A');
        console.log('📦 Products:', orderData.selectedProducts?.length || 0, 'items');
        
        // Log product details
        if (orderData.selectedProducts && orderData.selectedProducts.length > 0) {
            console.log('📝 Order Details:');
            orderData.selectedProducts.forEach((item, index) => {
                // Handle both Map objects and plain objects for translations
                let productName = 'Unknown Product';
                if (item.product?.title?.translations) {
                    const translations = item.product.title.translations;
                    if (typeof translations.get === 'function') {
                        // It's a Map object
                        productName = translations.get('en') || 'Unknown Product';
                    } else {
                        // It's a plain object (after JSON serialization)
                        productName = translations.en || translations['en'] || 'Unknown Product';
                    }
                }
                
                const size = item.sizeOption?.size || 'N/A';
                const price = item.sizeOption?.price || 0;
                const quantity = item.quantity || 1;
                const totalPrice = item.totalPrice || 0;
                
                if (quantity === 1) {
                    console.log(`   ${index + 1}. ${productName} (${size}) - ${totalPrice} UZS`);
                    
                    // Add-ons for single item
                    if (item.addOns && item.addOns.length > 0) {
                        console.log(`      Add-ons:`);
                        item.addOns.forEach((addon) => {
                            // Remove emoji from kind for console logging
                            const cleanKind = addon.kind.replace(/👇/g, '');
                            console.log(`        - ${cleanKind}: ${addon.option} (+${addon.price} UZS)`);
                        });
                    }
                } else {
                    console.log(`   ${index + 1}. ${productName} (${size}) x${quantity} - ${totalPrice} UZS`);
                    console.log(`      Base Price: ${price} UZS each`);
                    
                    // Group add-ons by forItem
                    if (item.addOns && item.addOns.length > 0) {
                        const addonsByItem = {};
                        item.addOns.forEach((addon) => {
                            const itemIndex = addon.forItem || 0;
                            if (!addonsByItem[itemIndex]) {
                                addonsByItem[itemIndex] = [];
                            }
                            addonsByItem[itemIndex].push(addon);
                        });
                        
                        // Display add-ons for each item
                        for (let i = 0; i < quantity; i++) {
                            console.log(`      Item ${i + 1} add-ons:`);
                            
                            if (addonsByItem[i] && addonsByItem[i].length > 0) {
                                addonsByItem[i].forEach((addon) => {
                                    // Remove emoji from kind for console logging
                                    const cleanKind = addon.kind.replace(/👇/g, '');
                                    console.log(`        - ${cleanKind}: ${addon.option} (+${addon.price} UZS)`);
                                });
                            } else {
                                console.log(`        - No add-ons`);
                            }
                            
                            // Calculate item total
                            const itemBasePrice = item.sizeOption?.price || 0;
                            const itemAddonPrice = addonsByItem[i] ? 
                                addonsByItem[i].reduce((sum, addon) => sum + (addon.price || 0), 0) : 0;
                            const itemTotal = itemBasePrice + itemAddonPrice;
                            
                            console.log(`        Total: ${itemTotal} UZS`);
                        }
                    } else {
                        console.log(`      All ${quantity} items: No add-ons`);
                        console.log(`      Each: ${price} UZS`);
                    }
                    
                    console.log(`      Subtotal: ${totalPrice} UZS`);
                }
            });
        }
        
        // Calculate total order value
        const totalOrderValue = orderData.selectedProducts?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;
        console.log('💰 Total Order Value:', totalOrderValue, 'UZS');
        console.log('📅 Order Status:', orderData.status);
        console.log('⏰ Created At:', orderData.createdAt);
        console.log('-------------------------------------------');
        
        // Print receipt to XP58 thermal printer
        await printOrderReceipt(orderData);
        
        // Here you can add your custom logic:
        // - Send notifications to kitchen staff
        // - Update external systems
        // - Send SMS/email notifications
        // - Integrate with POS systems
        // - etc.
        
        res.status(200).json({
            success: true,
            message: 'Order notification received successfully',
            orderId: orderData._id,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error processing order notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process order notification',
            error: error.message
        });
    }
});

export default router;
