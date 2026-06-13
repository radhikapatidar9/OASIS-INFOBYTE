const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');

const OtpSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    createdAt: {
        type:Date,
        default: Date.now,
        required: true,
        expires: 5*60
    },
    otp: {
        type: String,
        required: true
    }
})

async function sendVerificationEmail(email,otp) {
    try {
        const mailResponse = await mailSender(email,'Verification Email', otp)
        console.log(mailResponse);

    } catch(err) {
        console.log("Error occured while sending email", err)
    }
}

OtpSchema.pre("save", async function() {
    try {
        if (!this.isNew) return;
        await sendVerificationEmail(this.email, this.otp);
        // next();
    } catch(err) {
        console.log(err)
    }
});

module.exports = mongoose.model("OTP", OtpSchema);