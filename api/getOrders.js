import express from 'express';
import Order from "../schemas/order.js";

const router = express.Router();

router.get("/getOrders", async (req, res) => {
    try {
        // Populate all parameters and nested values
        const orders = await Order.find({status: "waiting-for-receipt"})
            .populate({
                path: 'customer',
                select: 'telegramId fullName phoneNumber preferredLanguage agreedToTerms'
            })
            .populate({
                path: 'selectedProducts.product',
                populate: [
                    {
                        path: 'title',
                        select: 'key translations status'
                    },
                    {
                        path: 'description', 
                        select: 'key translations status'
                    }
                ],
                select: 'title description sizeOptions defaultAddOns possibleAddOns status'
            })
            .exec();
            
        // Update order status to "ready"
        for (const order of orders) {
            await Order.findByIdAndUpdate({_id: order._id}, {status: "ready"}).exec();
        }
        
        res.status(200).json({
            success: true,
            count: orders.length,
            orders: orders
        });
    } catch (e) {
        console.error('Error getting orders:', e);
        res.status(500).json({
            success: false,
            error: 'Error getting orders',
            message: e.message
        });
    }
});

export default router;