const mongoose = require('mongoose');

const PizzaVarieties = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    basePrice:{
        type:Number,
        required:true
    }


})
module.exports = mongoose.model("PizzaVariety", PizzaVarieties);