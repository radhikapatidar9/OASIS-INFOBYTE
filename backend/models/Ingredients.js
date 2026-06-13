const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    type:{
        type:String,
        enum:[
            "BASE",
            "SAUCE",
            "CHEESE",
            "VEGGIE",
            "MEAT"
        ],
        required:true
    },
    image:{
        type:String
    },
    price:{
        type:Number,
        required:true
    },
    stock:{
        type:Number,
        default:0
    },
    threshold:{
        type:Number,
        default:10
    }
});

module.exports = mongoose.model("Ingredient", IngredientSchema);