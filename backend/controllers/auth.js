const User = require('../models/User');
const OTP = require('../models/OTP')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const helper = require('../utils/mailSender');
const generateOtp = require('otp-generator')
require('dotenv').config();

exports.sendOTP = async(req, res) => {
    // This is useful if they need to resend OTP
    try {
        const {email} = req.body;
        if(!email) {
            return res.status(400).json({
                success:false,
                message:"Email is required"
            });
        }
        const user = await User.findOne({email});
        if(!user) {
            return res.json({
                success:false,
                message: "User not found"
            })
        }
        if(user.isVerified) {
            return res.json({
                success:false,
                message: "User is already verified"
            })
        }

        const otp = generateOtp.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });
        await OTP.deleteMany({ email });
        console.log("otp generated",otp);
        await OTP.create({ email,otp });

        return res.json({
            success: true,
            message: "Otp send Successfully!",
        })

    } catch(err) {
        console.log(err);
        res.status(500).json({
            success:false,
            message:"Error Occured while sending otp"
        })
    }
}

exports.userSignup = async(req, res) => {
    try {
        const {name, email, password, role} = req.body;
        if(!name || !email || !password || !role) {
            return res.json({
                success:false,
                message:"Please fill all the fields"
            })
        }
        const user = await User.findOne({email})
        if(user) {
            if (user.isVerified) {
                return res.json({
                    success:false,
                    message:"User is already registered"
                })
            } else {
                // Update password and role, then resend OTP
                const hashedPassword = await bcrypt.hash(password, 10);
                user.password = hashedPassword;
                user.role = role;
                await user.save();

                const otp = generateOtp.generate(6, {
                    upperCaseAlphabets: false,
                    lowerCaseAlphabets: false,
                    specialChars: false
                });
                await OTP.deleteMany({ email });
                await OTP.create({ email, otp });

                return res.json({
                    success:true,
                    message: "Account exists but not verified. New OTP sent! Please verify your email."
                })
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        if(role !== 'user' && role !== 'admin') {
            return res.json({
                success: false,
                message: "Account type not matched!"
            })
        }

        const newUser = await User.create({
            name, 
            email,
            password: hashedPassword,
            role,
            isVerified: false
        });

        // Send OTP automatically after registration
        const otp = generateOtp.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });
        await OTP.deleteMany({ email });
        await OTP.create({ email, otp });

        return res.json({
            success:true,
            message: "User registered successfully! Please verify your email."
        })

    } catch(err) {
        console.log(err);
        res.status(500).json({
            success:false,
            message:"Error Occured while signUp"
        })
    }
}

exports.verifyEmail = async(req, res) => {
    try {
        const {email, otp} = req.body;
        if(!email || !otp) {
            return res.json({
                success:false,
                message: "Please fill all fields"
            });
        }
        
        const recentOTP = await OTP.find({email}).sort({createdAt: -1});
        if(recentOTP.length == 0) {
            return res.status(401).json({
                success:false,
                message: "Otp not found or expired"
            })
        }
        if(otp !== recentOTP[0].otp) {
            return res.status(401).json({
                success:false,
                message: "Invalid OTP"
            })
        }

        const user = await User.findOneAndUpdate(
            {email}, 
            {isVerified: true}, 
            {new: true}
        );

        if(!user) {
            return res.json({success: false, message: "User not found"});
        }

        return res.json({
            success:true,
            message: "Email verified successfully!"
        })
    } catch(err) {
        console.log(err);
        res.status(500).json({
            success:false,
            message:"Error Occured while verifying email"
        })
    }
}

exports.userLogin = async(req,res) => {
    try {
        const {email, password} = req.body
        if(!email || !password) {
            return res.json({
                success:false,
                message:"fill all the fields carefully"
            })
        }
    
        const user = await User.findOne({email: email})
        if(!user) {
            return res.status(404).json({
                success:false,
                message:"User is not registered"
            })
        }

        if(!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email first",
                isUnverified: true
            });
        }

        let isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(401).json({
                success:false,
                message:"Please enter correct password"
            })
        }

        const payload = {
            email:user.email,
            id:user._id,
            role:user.role
        }
        let token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn:"3d"})

        let options = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            httpOnly: true, // no access at client side
        }

        user.password = undefined;

        res.cookie("token", token, options).status(200).json({
            success:true,
            user,
            token,
            message: "User logged in successfully!"
        })

    } catch(err) {
        console.log(err);
        res.status(500).json({
            success:false,
            message:"Error Occured while login"
        })
    }
}

exports.forgotPasswordOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                success: false,
                message: "User not registered with this email"
            });
        }

        const otp = generateOtp.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });
        await OTP.deleteMany({ email });
        console.log("Forgot password OTP generated", otp);
        await OTP.create({ email, otp });

        return res.json({
            success: true,
            message: "Password reset OTP sent successfully!"
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Error occurred while sending password reset OTP"
        });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;
        if (!email || !otp || !password) {
            return res.json({
                success: false,
                message: "Please fill all fields"
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const recentOTP = await OTP.find({ email }).sort({ createdAt: -1 });
        if (recentOTP.length === 0) {
            return res.status(401).json({
                success: false,
                message: "OTP not found or expired"
            });
        }
        if (otp !== recentOTP[0].otp) {
            return res.status(401).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        return res.json({
            success: true,
            message: "Password updated successfully!"
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Error occurred while resetting password"
        });
    }
};