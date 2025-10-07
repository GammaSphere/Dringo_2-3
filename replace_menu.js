#!/usr/bin/env node

/**
 * Script to replace the entire menu with new products
 * Run this script to update the menu with the new 19 products
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const API_BASE_URL = 'http://localhost:3000';

async function replaceMenu() {
    try {
        console.log('🔄 Starting menu replacement...');
        
        const { stdout, stderr } = await execAsync(`curl -X POST ${API_BASE_URL}/replaceMenu -H "Content-Type: application/json"`);
        
        if (stderr) {
            throw new Error(`Curl error: ${stderr}`);
        }
        
        const result = JSON.parse(stdout);
        
        console.log('✅ Menu replacement completed successfully!');
        console.log(`📊 Total products created: ${result.totalProducts}`);
        console.log(`📝 Message: ${result.message}`);
        
        // List all products
        console.log('\n📋 New Menu Products:');
        result.products.forEach((product, index) => {
            console.log(`${index + 1}. ${product.title?.key || 'Unknown Product'}`);
        });
        
    } catch (error) {
        console.error('❌ Error replacing menu:', error.message);
        console.error('💡 Make sure the bot server is running on port 3000');
        process.exit(1);
    }
}

// Run the replacement
replaceMenu();
