const jwt = require('jsonwebtoken');
const cookie = require('cookie-parser');
require('dotenv').config();

exports.auth = async(req,res,next) => {
    try {
        let token = req.cookies?.token || req.header('Authorization')?.replace("Bearer ", "") || req.body.token
        if(!token) {
            return res.json({
                success:false,
                message:"token missing"
            })
        }
        let decode = jwt.verify(token, process.env.JWT_SECRET);
        console.log("token decode", decode);

        req.user = decode;

        next()

    } catch(err) {
        console.log("error occured while auth", err);
        res.json({
            success:false,
            message: "error occured"
        })
    }
}

exports.isAdmin = async(req,res,next) => {
    try {
        if(req.user.role !== "admin") {
            return res.json({
                success:false,
                message:"This is a protected route for Admin"
            })
        }
        // return res.status(200).json({
        //     success:true,
        //     message:"Welcome to protected route for Admin"
        // })
        next()
    } catch(err) {
            return res.status(401).json({
                success:false,
                message: "Error occured while verifiing admin token!"
            })
    }
}

exports.isUser = async(req,res,next) => {
    try {
        if(req.user.role !== "user") {
            return res.json({
                success:false,
                message:"This is a protected route for User"
            })
        }
        // return res.status(200).json({
        //     success:true,
        //     message:"Welcome to protected route for User"
        // })
        next()
    } catch(err) {
            return res.status(401).json({
                success:false,
                message: "Error occured while verifiing user token!"
            })
    }
}