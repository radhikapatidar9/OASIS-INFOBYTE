const express = require('express');
const router = express.Router();

const {createIngredient, updateIngredient, getIngredient, deleteIngredient,getAllIngredient}
 = require('../controllers/Ingredients');

const {auth, isAdmin, isUser} = require('../middlewares/auth')

router.post('/createingredient',auth, isAdmin, createIngredient);
router.put('/updateingredient', auth, isAdmin, updateIngredient);
router.get('/getingredient/:type', getIngredient);
router.delete('/deleteingredient', deleteIngredient);
router.get('/getallingredient', getAllIngredient);


module.exports = router;