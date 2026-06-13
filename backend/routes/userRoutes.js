const express = require('express');
const router = express.Router();

const {sendOTP,userLogin, userSignup, forgotPasswordOTP, resetPassword, verifyEmail} = require('../controllers/auth')

router.post("/login", userLogin);
router.post("/signup", userSignup);
router.post("/sendotp", sendOTP);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password-otp", forgotPasswordOTP);
router.post("/reset-password", resetPassword);

module.exports = router