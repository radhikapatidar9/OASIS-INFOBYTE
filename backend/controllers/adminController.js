const Order = require('../models/Order');
const Ingredient = require('../models/Ingredients');

exports.getAnalytics = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        
        const orders = await Order.find();
        const revenue = orders.reduce((acc, order) => {
            // Only count revenue for paid/successful orders if payment status exists,
            // but since we updated schema to just have status, let's count all or delivered.
            return acc + (order.amount || 0);
        }, 0);

        const pendingOrders = await Order.countDocuments({ status: { $in: ['Order Received', 'In Kitchen', 'Ready For Delivery', 'Out For Delivery'] } });
        const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });

        const lowStockIngredients = await Ingredient.find({
            $expr: { $lt: ["$stock", "$threshold"] }
        });

        return res.status(200).json({
            success: true,
            analytics: {
                totalOrders,
                revenue,
                pendingOrders,
                deliveredOrders,
                lowStockCount: lowStockIngredients.length,
                lowStockIngredients
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Error fetching analytics"
        });
    }
};
