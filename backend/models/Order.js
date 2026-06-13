const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    pizzaVariety: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PizzaVariety'
    },
    ingredients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient'
    }],
    quantity: {
        type: Number,
        default: 1
    }
});

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [OrderItemSchema],
    amount: {
        type: Number,
        required: true
    },
    paymentId: {
        type: String
    },
    orderId: {
        type: String
    },
    signature: {
        type: String
    },
    status: {
        type: String,
        enum: ['Order Received', 'In Kitchen', 'Ready For Delivery', 'Out For Delivery', 'Delivered'],
        default: 'Order Received'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Order", OrderSchema);
