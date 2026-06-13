const express = require('express');
const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 5000

const dbConnect = require('./config/database')
const userRoutes = require('./routes/userRoutes')
const varietyRoutes = require('./routes/pizzaVarietyRoutes')
const ingredientRoutes = require('./routes/ingedientRoutes')
const orderRoutes = require('./routes/orderRoutes')
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fileUpload = require("express-fileupload");
const {cloudinaryConnect} = require('./config/cloudinary');

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/"
    })
);

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
}));
app.use('/api/v1', userRoutes);
app.use('/api/v1', varietyRoutes)
app.use('/api/v1', ingredientRoutes)
app.use('/api/v1', orderRoutes)
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/v1', adminRoutes);

dbConnect();
cloudinaryConnect();

const startStockScheduler = require('./utils/stockScheduler');
startStockScheduler();

// activate server
app.listen(PORT, () => {
    console.log(`App listen at port ${PORT} successfully`)
})

