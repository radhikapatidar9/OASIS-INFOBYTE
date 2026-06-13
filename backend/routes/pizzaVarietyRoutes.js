const express = require('express');
const router = express.Router();

const {createPizzaVariety, getAllVariety, deletePizzaVariety} = require('../controllers/pizzaVariety')
const {auth, isAdmin, isUser} = require('../middlewares/auth')

router.post("/createvariety",auth, isAdmin, createPizzaVariety);
router.get("/getvariety", getAllVariety);
router.delete("/deletevariety",auth, isAdmin, deletePizzaVariety);

module.exports = router