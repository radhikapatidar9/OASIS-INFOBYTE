const { trusted } = require('mongoose');
const Ingredient =  require('../models/Ingredients') 
const PizzaVariety = require('../models/PizzaVariety')
const User = require('../models/User');
const {uploadImageToCloudinary} = require('../utils/imageUploader')
require('dotenv').config()

exports.createIngredient = async(req, res) => {
    try {

        const {name, type, price, stock, threshold} = req.body;
        if(!req.files || !req.files.image) {
            return res.status(400).json({
                success:false,
                message:"Image is required"
            })
        }
        const image = req.files.image

        const userId = req.user.id;
        const adminDetail = await User.findById(userId)
        console.log("Admin details:", adminDetail);
        
        // if admin not found
        if(!adminDetail) {
            return res.status(404).json({
                success : false,
                message: "adminn not found"
            })
        }
        if(adminDetail.role !== "admin"){
            return res.status(403).json({
                success:false,
                message:"Only admin can create pizza ingredients"
            })
        }

        if(!name || !type || price === undefined || stock === undefined ) {
            return res.status(409).json({
                success:false,
                message:"All the fields are required"
            })
        }

        const imageUpload = await uploadImageToCloudinary(image, process.env.FOLDER_NAME)
        const newIngredient = await Ingredient.create({
            name, type, image:imageUpload.secure_url, stock, price, threshold})


        return res.status(200).json({
            success:true,
            message:"Ingredient added successfully",
            newIngredient
        })

    } catch(err) {
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

exports.updateIngredient = async(req,res) => {
    try {

        const {name, type, price, stock, threshold, id} = req.body;

        const existIngredient = await Ingredient.findById(id);
        if(!existIngredient) {
            return res.status(404).json({
                success:false,
                message:"Ingredient never exists before"
            })
        }
        let imageUrl = existIngredient.image;

        if(req.files && req.files.image){
            const imageUpload = await uploadImageToCloudinary(
                req.files.image,
                process.env.FOLDER_NAME
            );

            imageUrl = imageUpload.secure_url;
        }
        const userId = req.user.id
        const adminDetail = await User.findById(userId);
        console.log("Admin details:", adminDetail);
        
        // if admin not found
        if(!adminDetail) {
            return res.status(404).json({
                success : false,
                message: "adminn not found"
            })
        }
        if(adminDetail.role !== "admin") {
            return res.status(403).json({
                success:false,
                message:"Only admin can update pizza ingredients"
            })
        }

        if(!name || !type || price === undefined || stock === undefined ) {
            return res.status(400).json({
                success:false,
                message:"All the fields are required"
            })
        }

        const updatedIngredient = await Ingredient.findByIdAndUpdate(id, {
            name, type, image:imageUrl, stock, price, threshold}, {new:true})


        return res.status(200).json({
            success:true,
            message:"Ingredient updated successfully",
            updatedIngredient
        })

    } catch(err) {
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

exports.getIngredient = async(req,res) => {
    try {
        const {type} = req.params;
        const allIngredients = await Ingredient.find({type})
        if(allIngredients === 0) {
            return res.status(404).json({
                success:false,
                message:"error occured while fetching all ingredients by type"
            })
        }
        return res.status(200).json({
            success:true,
            message:"all ingredients fetched successfully",
            allIngredients
        })

    } catch(err) {
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}

exports.deleteIngredient = async(req,res) => {
    try {

        const {id} = req.body;
        const ingredient = await Ingredient.findById(id);
        if(!ingredient) {
            return res.status(404).json({
                success:false,
                message:"ingredien with givn id not found"
            })
        }
        await Ingredient.findByIdAndDelete(id);
        return res.status(200).json({
            success:true,
            message:"ingredient deleted successfully"
        })

    } catch(err) {
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}
exports.getAllIngredient = async(req,res) => {
    try {

        const allIngredient = await Ingredient.find();
        if(allIngredient.length === 0) {
            return res.status(404).json({
                success:false,
                message:"error occured while fetching all ingredients"
            })
        }
        return res.status(200).json({
            success:true,
            message:"all ingredients fetched successfully",
            allIngredient
        })

    } catch(err) {
        return res.status(500).json({
            success:false,
            message:err.message
        })
    }
}