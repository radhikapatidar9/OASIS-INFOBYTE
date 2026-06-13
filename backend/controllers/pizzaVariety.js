const Ingredients = require('../models/Ingredients')
const PizzaVariety = require('../models/PizzaVariety')
const User = require('../models/User')
const {uploadImageToCloudinary} = require('../utils/imageUploader.js')
require('dotenv').config()

exports.createPizzaVariety = async(req, res) => {
    try {

        const {name, description, basePrice} = req.body;
        const userId = req.user.id;

        if(!req.files || !req.files.image){
            return res.status(400).json({
                success:false,
                message:"Image is required"
            })
        }
        const image = req.files.image;
        
        const adminDetail = await User.findById(userId)
        console.log("Admin details:", adminDetail);

        // if admin not found
        if(!adminDetail) {
            return res.status(404).json({
                success : false,
                message: "adminn not found"
            })
        }
        if(adminDetail.role !== "Admin"){
            return res.status(403).json({
                success:false,
                message:"Only admin can create pizza varieties"
            })
        }
        
        if(!name || !description || !basePrice || !image ) {
            return res.status(409).json({
                success:false,
                message:"Please fill all the fields"
            })
        }

        const imageUpload = await uploadImageToCloudinary(image, process.env.FOLDER_NAME)

        const newVariety = await PizzaVariety.create({
            name, description, image:imageUpload.secure_url, basePrice
        })

        return res.status(200).json({
            success:true,
            message:"Pizza variety created successfully!",
            newVariety
        })


    } catch(err) {
            console.log(err);

            return res.status(500).json({
                success:false,
                message:err.message
            })
        }
}

exports.getAllVariety = async(req,res) => {
    try {

        const allVariety = await PizzaVariety.find();

        return res.status(200).json({
            success:true,
            message:"All varieties of pizza fetched successfully",
            allVariety
        })

    } catch(err) {
        return res.status(500).json({
            success:false,
            message:"Error occurred while getting all varieties of pizza"
        })
    }
}

exports.deletePizzaVariety = async(req, res) => {
    try {
        const {varietyId} = req.body;
        const findPizza = await PizzaVariety.findOne({varietyId});
        if(!findPizza) {
            return res.status(404).json({
                success:false,
                message:"pizza with given id not found"
            })
        }
        await PizzaVariety.deleteOne({id: findPizza._id});
        return res.status(200).json({
            succss:true,
            message:"pizza variety deleted successfully"
        })


    } catch(err) {
        return res.status(500).json({
            success:false,
            message:"Error occurred while deleting variety of pizza"
        })
    }
}