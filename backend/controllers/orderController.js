const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Ingredient = require('../models/Ingredients');
const User = require('../models/User');
const mailSender = require('../utils/mailSender');
require('dotenv').config();

let razorpayInstance = null;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_SECRET) {
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_SECRET,
        });
    }
} catch (error) {
    console.error("Razorpay initialization error:", error);
}

// 1. Create Payment Order
exports.createPaymentOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount) {
            return res.status(400).json({
                success: false,
                message: "Amount is required"
            });
        }

        const options = {
            amount: Math.round(amount * 100), // amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        if (razorpayInstance) {
            try {
                const order = await razorpayInstance.orders.create(options);
                return res.status(200).json({
                    success: true,
                    orderId: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    isMock: false,
                    keyId: process.env.RAZORPAY_KEY_ID
                });
            } catch (rzpErr) {
                console.error("Razorpay API error, falling back to mock:", rzpErr);
            }
        }
        
        const mockOrderId = `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        return res.status(200).json({
            success: true,
            orderId: mockOrderId,
            amount: options.amount,
            currency: options.currency,
            isMock: true,
            keyId: 'rzp_test_dummy'
        });
    } catch (err) {
        console.error("Error creating payment order:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to initiate payment: " + err.message
        });
    }
};

// 2. Verify Payment and Place Order
exports.verifyAndPlaceOrder = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            amount,
            items,
            isMock
        } = req.body;

        const userId = req.user.id;

        if (!amount || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Order details are incomplete"
            });
        }

        // Check stock before verifying payment
        for (const item of items) {
            if (item.ingredients && item.ingredients.length > 0) {
                for (const ingredientId of item.ingredients) {
                    const ingredient = await Ingredient.findById(ingredientId);
                    if (!ingredient || ingredient.stock < (item.quantity || 1)) {
                        return res.status(400).json({
                            success: false,
                            message: `Out of Stock: ${ingredient ? ingredient.name : 'Unknown ingredient'}`
                        });
                    }
                }
            }
        }

        if (!isMock && razorpayInstance && razorpay_signature && razorpay_signature !== 'mock_signature') {
            const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
            shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
            const digest = shasum.digest("hex");

            if (digest !== razorpay_signature) {
                return res.status(400).json({
                    success: false,
                    message: "Payment signature verification failed"
                });
            }
        }

        // Clean items to remove null pizzaVariety
        const cleanedItems = items.map(item => {
            const cleanItem = { ...item };
            if (!cleanItem.pizzaVariety) {
                delete cleanItem.pizzaVariety;
            }
            return cleanItem;
        });

        const newOrder = await Order.create({
            user: userId,
            items: cleanedItems,
            amount,
            paymentId: razorpay_payment_id || `pay_mock_${Date.now()}`,
            orderId: razorpay_order_id,
            signature: razorpay_signature || 'mock_signature',
            status: 'Order Received'
        });

        // Decrement ingredient stocks
        for (const item of items) {
            if (item.ingredients && item.ingredients.length > 0) {
                for (const ingredientId of item.ingredients) {
                    const ingredient = await Ingredient.findById(ingredientId);
                    if (ingredient) {
                        ingredient.stock = Math.max(0, ingredient.stock - (item.quantity || 1));
                        await ingredient.save();
                    }
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "Order placed successfully!",
            order: newOrder
        });

    } catch (err) {
        console.error("Error confirming order:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to confirm order: " + err.message
        });
    }
};

// 3. Get User Orders
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({ user: userId })
            .populate('items.pizzaVariety')
            .populate('items.ingredients')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            orders
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders: " + err.message
        });
    }
};

// 4. Get All Orders (Admin only)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email')
            .populate('items.pizzaVariety')
            .populate('items.ingredients')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            orders
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch all orders: " + err.message
        });
    }
};

// 5. Update Order Status (Admin only)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        if (!orderId || !status) {
            return res.status(400).json({
                success: false,
                message: "Order ID and status are required"
            });
        }

        const validStatuses = ['Order Received', 'In Kitchen', 'Ready For Delivery', 'Out For Delivery', 'Delivered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        ).populate('user', 'name email')
         .populate('items.pizzaVariety')
         .populate('items.ingredients');

        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: `Order status updated to '${status}' successfully!`,
            order: updatedOrder
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Failed to update order status: " + err.message
        });
    }
};
