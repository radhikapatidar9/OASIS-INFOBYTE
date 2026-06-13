# Pizza Builder Application

A full-stack Pizza Builder web application that allows users to customize pizzas by selecting different ingredients and place orders online. The application includes authentication, admin management, inventory tracking, and order management.

---

## Features

### User Features

* User Registration and Login
* OTP Verification
* Secure JWT Authentication
* Browse Pizza Varieties
* Customize Pizza
* Select:

  * Pizza Base
  * Sauce
  * Cheese
  * Vegetables
  * Meat Toppings
* View Order Summary
* Place Orders
* View Previous Orders

---

### Admin Features

* Admin Login
* Add New Pizza Varieties
* Add Ingredients
* Update Ingredients
* Delete Ingredients
* Upload Ingredient Images
* Manage Inventory Stock
* Track Available Ingredients
* View Customer Orders

---

## Tech Stack

### Frontend

* React.js
* React Router DOM
* Axios
* CSS
* Vite

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose

### Authentication

* JWT
* OTP Verification
* Bcrypt Password Hashing

### Additional Services

* Cloudinary (Image Upload)
* Razorpay (Payment Integration)
* Nodemailer (Email Service)

---

## Project Structure

```bash
Pizza-Builder/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── cssFiles/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── config/
│   ├── utils/
│   └── index.js
│
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/radhikapatidar9/OASIS-INFOBYTE

```

---

## Backend Setup

Navigate to backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000

MONGODB_URL=your_mongodb_connection

JWT_SECRET=your_jwt_secret

MAIL_HOST=your_mail_host
MAIL_USER=your_mail_user
MAIL_PASS=your_mail_password

CLOUD_NAME=your_cloudinary_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret

RAZORPAY_KEY=your_razorpay_key
RAZORPAY_SECRET=your_razorpay_secret
```

Start Backend:

```bash
npm run dev
```

---

## Frontend Setup

Navigate to frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run frontend:

```bash
npm run dev
```

Frontend will start on:

```bash
http://localhost:5173
```

---

## API Endpoints

### Authentication

```http
POST /api/v1/signup
POST /api/v1/login
POST /api/v1/sendotp
```

### Pizza Variety

```http
GET  /api/v1/getvariety
POST /api/v1/createvariety
```

### Ingredients

```http
GET    /api/v1/getallingredient
POST   /api/v1/createingredient
PUT    /api/v1/updateingredient
DELETE /api/v1/deleteingredient
```

### Orders

```http
POST /api/v1/createorder
GET  /api/v1/getorders
```

---

## Authentication Flow

1. User enters registration details.
2. OTP is sent to registered email.
3. User verifies OTP.
4. Account is created.
5. User logs in.
6. JWT Token is generated.
7. Protected routes become accessible.

---

## Image Upload

Ingredient images are uploaded using Cloudinary and stored securely for faster access.

---

## Future Improvements

* Payment Gateway Integration
* Order Tracking
* Coupon System
* Admin Analytics Dashboard
* Real-time Inventory Updates
* Pizza Recommendation System
* AI-based Custom Pizza Suggestions

---



