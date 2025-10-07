import mongoose from "mongoose";
import Product from "./schemas/product.js";
import Localization from "./schemas/localization.js";

/**
 * Quick verification script to check menu status
 */
async function verifyMenu() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/dringo-lite");
        
        const productCount = await Product.countDocuments();
        const localizationCount = await Localization.countDocuments();
        
        console.log(`📊 Menu Status:`);
        console.log(`   - Products: ${productCount}`);
        console.log(`   - Localizations: ${localizationCount}`);
        
        if (productCount === 19) {
            console.log('✅ Menu is up-to-date with 19 products');
        } else if (productCount === 0) {
            console.log('⚠️  No products found - menu needs initialization');
        } else {
            console.log(`⚠️  Found ${productCount} products - may need update`);
        }
        
        // Show first few products
        const products = await Product.find().populate('title').limit(5);
        console.log('\n📋 First 5 products:');
        for (const [index, product] of products.entries()) {
            const title = product.title?.translations?.en || 'Unknown';
            console.log(`   ${index + 1}. ${title}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

verifyMenu();
