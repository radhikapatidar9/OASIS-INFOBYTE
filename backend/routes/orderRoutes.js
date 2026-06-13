const express = require('express');
const router = express.Router();
const { auth, isAdmin, isUser } = require('../middlewares/auth');
const {
    createPaymentOrder,
    verifyAndPlaceOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus
} = require('../controllers/orderController');

router.post('/create-order', auth, createPaymentOrder);
router.post('/verify-payment', auth, verifyAndPlaceOrder);
router.get('/orders/my-orders', auth, getUserOrders);
router.get('/orders/all-orders', auth, isAdmin, getAllOrders);
router.put('/orders/update-status', auth, isAdmin, updateOrderStatus);

module.exports = router;
