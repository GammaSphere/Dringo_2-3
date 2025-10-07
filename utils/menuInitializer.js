import Localization from "../schemas/localization.js";
import Product from "../schemas/product.js";

/**
 * Automatically initializes the menu with the latest products and configurations
 * This function is called on bot startup to ensure the menu is always up-to-date
 */
export async function initializeMenu() {
    try {
        console.log('🔄 Checking if menu needs initialization...');
        
        // Check if any products exist in the database
        const existingProductsCount = await Product.countDocuments();
        const existingLocalizationsCount = await Localization.countDocuments();
        
        console.log(`📊 Found ${existingProductsCount} products and ${existingLocalizationsCount} localizations in database`);
        
        // If database is empty or has very few items, initialize with new menu
        if (existingProductsCount === 0 || existingProductsCount < 10) {
            console.log('🚀 Initializing menu with latest products...');
            await replaceMenuWithLatest();
            console.log('✅ Menu initialization completed successfully!');
        } else {
            console.log('ℹ️ Menu already exists, skipping initialization');
        }
        
    } catch (error) {
        console.error('❌ Error during menu initialization:', error);
        throw error;
    }
}

/**
 * Replaces the entire menu with the latest product configuration
 * This is the same logic as the /replaceMenu API endpoint
 */
async function replaceMenuWithLatest() {
    try {
        // First, clear all existing products and localizations
        await Product.deleteMany({});
        await Localization.deleteMany({});
        console.log('🧹 Cleared all existing products and localizations');

        const newMenu = [
            // Products 1-9: Classic Coffee with Add-ons
            {
                title: { en: "Espresso", ru: "Эспрессо", uz: "Espresso" },
                description: { en: "Strong black coffee", ru: "Крепкий черный кофе", uz: "Kuchli qora qahva" },
                sizeOptions: [
                    { size: "30ml", price: 20000 },
                    { size: "60ml", price: 23000 }
                ],
                defaultAddOns: [],
                possibleAddOns: [
                    { kind: "Sugar👇", option: "1", price: 0 },
                    { kind: "Sugar👇", option: "2", price: 0 },
                    { kind: "Sugar👇", option: "3", price: 0 },
                    { kind: "Syrup👇", option: "Caramel", price: 5000 },
                    { kind: "Syrup👇", option: "Salt caramel", price: 5000 },
                    { kind: "Syrup👇", option: "Chocolate", price: 5000 },
                    { kind: "Syrup👇", option: "Vanilla", price: 5000 },
                    { kind: "Syrup👇", option: "Coconut", price: 5000 },
                    { kind: "Syrup👇", option: "Hazelnut", price: 5000 },
                    { kind: "Syrup👇", option: "Burned Hazelnut", price: 5000 },
                    { kind: "Syrup👇", option: "Pistachio", price: 5000 },
                    { kind: "Syrup👇", option: "Strawberry", price: 5000 },
                    { kind: "Syrup👇", option: "Mint", price: 5000 },
                    { kind: "Add-ons👇", option: "Whipped Cream", price: 5000 },
                    { kind: "Add-ons👇", option: "Marshmallow", price: 5000 },
                    { kind: "Add-ons👇", option: "Topping", price: 5000 }
                ]
            },
            {
                title: { en: "Cappuccino", ru: "Капучино", uz: "Kapuchino" },
                description: { en: "Coffee with steamed milk foam", ru: "Кофе с взбитой молочной пеной", uz: "Bug'langan sut ko'pigi bilan qahva" },
                sizeOptions: [
                    { size: "250ml", price: 25000 },
                    { size: "350ml", price: 29000 }
                ],
                defaultAddOns: [],
                possibleAddOns: [
                    { kind: "Sugar👇", option: "1", price: 0 },
                    { kind: "Sugar👇", option: "2", price: 0 },
                    { kind: "Sugar👇", option: "3", price: 0 },
                    { kind: "Syrup👇", option: "Caramel", price: 5000 },
                    { kind: "Syrup👇", option: "Salt caramel", price: 5000 },
                    { kind: "Syrup👇", option: "Chocolate", price: 5000 },
                    { kind: "Syrup👇", option: "Vanilla", price: 5000 },
                    { kind: "Syrup👇", option: "Coconut", price: 5000 },
                    { kind: "Syrup👇", option: "Hazelnut", price: 5000 },
                    { kind: "Syrup👇", option: "Burned Hazelnut", price: 5000 },
                    { kind: "Syrup👇", option: "Pistachio", price: 5000 },
                    { kind: "Syrup👇", option: "Strawberry", price: 5000 },
                    { kind: "Syrup👇", option: "Mint", price: 5000 },
                    { kind: "Add-ons👇", option: "Whipped Cream", price: 5000 },
                    { kind: "Add-ons👇", option: "Marshmallow", price: 5000 },
                    { kind: "Add-ons👇", option: "Topping", price: 5000 }
                ]
            },
            {
                title: { en: "Kakao", ru: "Какао", uz: "Kakao" },
                description: { en: "Rich cocoa drink", ru: "Напиток из какао", uz: "Kakao ichimligi" },
                sizeOptions: [
                    { size: "250ml", price: 25000 },
                    { size: "350ml", price: 29000 }
                ],
                defaultAddOns: [],
                possibleAddOns: [
                    { kind: "Sugar👇", option: "1", price: 0 },
                    { kind: "Sugar👇", option: "2", price: 0 },
                    { kind: "Sugar👇", option: "3", price: 0 },
                    { kind: "Syrup👇", option: "Caramel", price: 5000 },
                    { kind: "Syrup👇", option: "Salt caramel", price: 5000 },
                    { kind: "Syrup👇", option: "Chocolate", price: 5000 },
                    { kind: "Syrup👇", option: "Vanilla", price: 5000 },
                    { kind: "Syrup👇", option: "Coconut", price: 5000 },
                    { kind: "Syrup👇", option: "Hazelnut", price: 5000 },
                    { kind: "Syrup👇", option: "Burned Hazelnut", price: 5000 },
                    { kind: "Syrup👇", option: "Pistachio", price: 5000 },
                    { kind: "Syrup👇", option: "Strawberry", price: 5000 },
                    { kind: "Syrup👇", option: "Mint", price: 5000 },
                    { kind: "Add-ons👇", option: "Whipped Cream", price: 5000 },
                    { kind: "Add-ons👇", option: "Marshmallow", price: 5000 },
                    { kind: "Add-ons👇", option: "Topping", price: 5000 }
                ]
            },
            {
                title: { en: "Americano", ru: "Американо", uz: "Amerikano" },
                description: { en: "Espresso diluted with hot water", ru: "Эспрессо, разбавленный горячей водой", uz: "Issiq suv bilan suyultirilgan espresso" },
                sizeOptions: [
                    { size: "200ml", price: 22000 },
                    { size: "300ml", price: 25000 }
                ],
                defaultAddOns: [],
                possibleAddOns: [
                    { kind: "Sugar👇", option: "1", price: 0 },
                    { kind: "Sugar👇", option: "2", price: 0 },
                    { kind: "Sugar👇", option: "3", price: 0 },
                    { kind: "Syrup👇", option: "Caramel", price: 5000 },
                    { kind: "Syrup👇", option: "Salt caramel", price: 5000 },
                    { kind: "Syrup👇", option: "Chocolate", price: 5000 },
                    { kind: "Syrup👇", option: "Vanilla", price: 5000 },
                    { kind: "Syrup👇", option: "Coconut", price: 5000 },
                    { kind: "Syrup👇", option: "Hazelnut", price: 5000 },
                    { kind: "Syrup👇", option: "Burned Hazelnut", price: 5000 },
                    { kind: "Syrup👇", option: "Pistachio", price: 5000 },
                    { kind: "Syrup👇", option: "Strawberry", price: 5000 },
                    { kind: "Syrup👇", option: "Mint", price: 5000 },
                    { kind: "Add-ons👇", option: "Whipped Cream", price: 5000 },
                    { kind: "Add-ons👇", option: "Marshmallow", price: 5000 },
                    { kind: "Add-ons👇", option: "Topping", price: 5000 }
                ]
            },
            {
                title: { en: "Latte", ru: "Латте", uz: "Latte" },
                description: { en: "Coffee with steamed milk", ru: "Кофе с пареным молоком", uz: "Bug'langan sut bilan qahva" },
                sizeOptions: [
                    { size: "250ml", price: 25000 },
                    { size: "350ml", price: 29000 }
                ],
                defaultAddOns: [],
                possibleAddOns: [
                    { kind: "Sugar👇", option: "1", price: 0 },
                    { kind: "Sugar👇", option: "2", price: 0 },
                    { kind: "Sugar👇", option: "3", price: 0 },
                    { kind: "Syrup👇", option: "Caramel", price: 5000 },
                    { kind: "Syrup👇", option: "Salt caramel", price: 5000 },
                    { kind: "Syrup👇", option: "Chocolate", price: 5000 },
                    { kind: "Syrup👇", option: "Vanilla", price: 5000 },
                    { kind: "Syrup👇", option: "Coconut", price: 5000 },
                    { kind: "Syrup👇", option: "Hazelnut", price: 5000 },
                    { kind: "Syrup👇", option: "Burned Hazelnut", price: 5000 },
                    { kind: "Syrup👇", option: "Pistachio", price: 5000 },
                    { kind: "Syrup👇", option: "Strawberry", price: 5000 },
                    { kind: "Syrup👇", option: "Mint", price: 5000 },
                    { kind: "Add-ons👇", option: "Whipped Cream", price: 5000 },
                    { kind: "Add-ons👇", option: "Marshmallow", price: 5000 },
                    { kind: "Add-ons👇", option: "Topping", price: 5000 }
                ]
            },
            {
                title: { en: "Hot Chocolate", ru: "Горячий шоколад", uz: "Issiq shokolad" },
                description: { en: "Rich hot chocolate drink", ru: "Насыщенный горячий шоколад", uz: "Boy hot shokolad ichimligi" },
                sizeOptions: [
                    { size: "250ml", price: 25000 },
                    { size: "350ml", price: 29000 }
                ],
                defaultAddOns: [],
                possibleAddOns: [
                    { kind: "Sugar👇", option: "1", price: 0 },
                    { kind: "Sugar👇", option: "2", price: 0 },
                    { kind: "Sugar👇", option: "3", price: 0 },
                    { kind: "Syrup👇", option: "Caramel", price: 5000 },
                    { kind: "Syrup👇", option: "Salt caramel", price: 5000 },
                    { kind: "Syrup👇", option: "Chocolate", price: 5000 },
                    { kind: "Syrup👇", option: "Vanilla", price: 5000 },
                    { kind: "Syrup👇", option: "Coconut", price: 5000 },
                    { kind: "Syrup👇", option: "Hazelnut", price: 5000 },
                    { kind: "Syrup👇", option: "Burned Hazelnut", price: 5000 },
                    { kind: "Syrup👇", option: "Pistachio", price: 5000 },
                    { kind: "Syrup👇", option: "Strawberry", price: 5000 },
                    { kind: "Syrup👇", option: "Mint", price: 5000 },
                    { kind: "Add-ons👇", option: "Whipped Cream", price: 5000 },
                    { kind: "Add-ons👇", option: "Marshmallow", price: 5000 },
                    { kind: "Add-ons👇", option: "Topping", price: 5000 }
                ]
            },
            {
                title: { en: "Flat White", ru: "Флэт уайт", uz: "Flat White" },
                description: { en: "Espresso with microfoam milk", ru: "Эспрессо с микропеной", uz: "Mikro ko'pik bilan espresso" },
                sizeOptions: [
                    { size: "250ml", price: 27000 }
                ],
                defaultAddOns: [],
                possibleAddOns: [
                    { kind: "Sugar👇", option: "1", price: 0 },
                    { kind: "Sugar👇", option: "2", price: 0 },
                    { kind: "Sugar👇", option: "3", price: 0 },
                    { kind: "Syrup👇", option: "Caramel", price: 5000 },
                    { kind: "Syrup👇", option: "Salt caramel", price: 5000 },
                    { kind: "Syrup👇", option: "Chocolate", price: 5000 },
                    { kind: "Syrup👇", option: "Vanilla", price: 5000 },
                    { kind: "Syrup👇", option: "Coconut", price: 5000 },
                    { kind: "Syrup👇", option: "Hazelnut", price: 5000 },
                    { kind: "Syrup👇", option: "Burned Hazelnut", price: 5000 },
                    { kind: "Syrup👇", option: "Pistachio", price: 5000 },
                    { kind: "Syrup👇", option: "Strawberry", price: 5000 },
                    { kind: "Syrup👇", option: "Mint", price: 5000 },
                    { kind: "Add-ons👇", option: "Whipped Cream", price: 5000 },
                    { kind: "Add-ons👇", option: "Marshmallow", price: 5000 },
                    { kind: "Add-ons👇", option: "Topping", price: 5000 }
                ]
            },
            {
                title: { en: "Black Tea", ru: "Черный чай", uz: "Qora choy" },
                description: { en: "Classic black tea", ru: "Классический черный чай", uz: "Klassik qora choy" },
                sizeOptions: [
                    { size: "350ml", price: 7000 }
                ],
                defaultAddOns: [],
                possibleAddOns: [
                    { kind: "Sugar👇", option: "1", price: 0 },
                    { kind: "Sugar👇", option: "2", price: 0 },
                    { kind: "Sugar👇", option: "3", price: 0 },
                    { kind: "Add-ons👇", option: "Lemon", price: 5000 }
                ]
            },
            {
                title: { en: "Green Tea", ru: "Зеленый чай", uz: "Yashil choy" },
                description: { en: "Fresh green tea", ru: "Свежий зеленый чай", uz: "Yangi yashil choy" },
                sizeOptions: [
                    { size: "350ml", price: 7000 }
                ],
                defaultAddOns: [],
                possibleAddOns: [
                    { kind: "Sugar👇", option: "1", price: 0 },
                    { kind: "Sugar👇", option: "2", price: 0 },
                    { kind: "Sugar👇", option: "3", price: 0 },
                    { kind: "Add-ons👇", option: "Lemon", price: 5000 }
                ]
            },
            // Products 10-19: Premium Products without Add-ons
            {
                title: { en: "Iris-Caramel Latte", ru: "Ирисово-карамельный латте", uz: "Iris-karamel latte" },
                description: { en: "Premium latte with iris and caramel", ru: "Премиум латте с ирисом и карамелью", uz: "Iris va karamel bilan premium latte" },
                sizeOptions: [
                    { size: "300ml", price: 35000 }
                ],
                defaultAddOns: [],
                possibleAddOns: []
            },
            {
                title: { en: "Choco-Mint Cappuccino", ru: "Шоко-мятный капучино", uz: "Shokolad-nana kapuchino" },
                description: { en: "Chocolate mint cappuccino", ru: "Шоколадно-мятный капучино", uz: "Shokolad-nana kapuchino" },
                sizeOptions: [
                    { size: "300ml", price: 35000 }
                ],
                defaultAddOns: [],
                possibleAddOns: []
            },
            {
                title: { en: "Original Raf", ru: "Оригинальный раф", uz: "Original raf" },
                description: { en: "Original raf coffee", ru: "Оригинальный раф кофе", uz: "Original raf qahva" },
                sizeOptions: [
                    { size: "300ml", price: 40000 }
                ],
                defaultAddOns: [],
                possibleAddOns: []
            },
            {
                title: { en: "Raf Baunty", ru: "Раф Баунти", uz: "Raf Baunty" },
                description: { en: "Raf coffee with bounty flavor", ru: "Раф кофе со вкусом баунти", uz: "Baunty ta'mi bilan raf qahva" },
                sizeOptions: [
                    { size: "300ml", price: 40000 }
                ],
                defaultAddOns: [],
                possibleAddOns: []
            },
            {
                title: { en: "Mokkachino", ru: "Моккачино", uz: "Mokkachino" },
                description: { en: "Chocolate cappuccino", ru: "Шоколадный капучино", uz: "Shokolad kapuchino" },
                sizeOptions: [
                    { size: "300ml", price: 35000 }
                ],
                defaultAddOns: [],
                possibleAddOns: []
            },
            {
                title: { en: "Raf Coffee", ru: "Раф кофе", uz: "Raf qahva" },
                description: { en: "Classic raf coffee", ru: "Классический раф кофе", uz: "Klassik raf qahva" },
                sizeOptions: [
                    { size: "300ml", price: 35000 }
                ],
                defaultAddOns: [],
                possibleAddOns: []
            },
            {
                title: { en: "Berry Tea", ru: "Ягодный чай", uz: "Meva choy" },
                description: { en: "Berry flavored tea", ru: "Ягодный чай", uz: "Meva ta'mi choy" },
                sizeOptions: [
                    { size: "300ml", price: 25000 }
                ],
                defaultAddOns: [],
                possibleAddOns: []
            },
            {
                title: { en: "Sea Buckthorn Tea", ru: "Облепиховый чай", uz: "Dengiz archa choy" },
                description: { en: "Sea buckthorn tea", ru: "Облепиховый чай", uz: "Dengiz archa choy" },
                sizeOptions: [
                    { size: "300ml", price: 25000 }
                ],
                defaultAddOns: [],
                possibleAddOns: []
            },
            {
                title: { en: "Moroccan Tea", ru: "Марокканский чай", uz: "Marokash choy" },
                description: { en: "Traditional Moroccan tea", ru: "Традиционный марокканский чай", uz: "An'anaviy Marokash choy" },
                sizeOptions: [
                    { size: "300ml", price: 25000 }
                ],
                defaultAddOns: [],
                possibleAddOns: []
            },
            {
                title: { en: "Ginger Tea", ru: "Имбирный чай", uz: "Zanjabil choy" },
                description: { en: "Ginger flavored tea", ru: "Имбирный чай", uz: "Zanjabil ta'mi choy" },
                sizeOptions: [
                    { size: "300ml", price: 25000 }
                ],
                defaultAddOns: [],
                possibleAddOns: []
            }
        ];

        const createdProducts = [];
        
        for (const product of newMenu) {
            // Create title localization
            const titleLocalization = new Localization({
                key: product.title.en,
                translations: {
                    en: product.title.en,
                    ru: product.title.ru,
                    uz: product.title.uz
                },
                status: "approved"
            });
            await titleLocalization.save();

            // Create description localization
            const descriptionLocalization = new Localization({
                key: product.description.en,
                translations: {
                    en: product.description.en,
                    ru: product.description.ru,
                    uz: product.description.uz
                },
                status: "approved"
            });
            await descriptionLocalization.save();

            // Create product
            const newProduct = new Product({
                title: titleLocalization._id,
                description: descriptionLocalization._id,
                sizeOptions: product.sizeOptions,
                defaultAddOns: product.defaultAddOns,
                possibleAddOns: product.possibleAddOns
            });
            await newProduct.save();
            createdProducts.push(newProduct);
        }

        console.log(`✅ Successfully created ${createdProducts.length} products with latest menu configuration`);
        return {
            message: "Menu initialized successfully with 19 new products",
            products: createdProducts,
            totalProducts: createdProducts.length
        };
        
    } catch (error) {
        console.error('❌ Error replacing menu:', error);
        throw error;
    }
}

/**
 * Force menu replacement (useful for manual updates)
 */
export async function forceMenuReplacement() {
    console.log('🔄 Force replacing menu with latest configuration...');
    await replaceMenuWithLatest();
    console.log('✅ Force menu replacement completed!');
}
