🏍️ Soydan Motorcycle Rental System

A modern and user-friendly motorcycle rental web application built with React frontend and Node.js/Express backend.

## 📸 Screenshots

### Homepage - Motorcycle List
![Homepage](./images/1.PNG)

### Admin Panel
![Admin Panel](./images/admin.PNG)

### Backend Running Status
![Backend Running](./images/BACKEND.PNG)

### Backend Detailed Log
![Backend Details](./images/BACKEND2.PNG)

### Frontend Development Server
![Frontend Development](./images/FRONTEND.PNG)

### API Test Results
![API Test](./images/api-test.PNG)

### Motorcycle API Data
![Motorcycle API](./images/apimotors.PNG)

### Customer Interface
![Customer Interface](./images/customer.PNG)

### Login Page
![Login Page](./images/login.PNG)

## 🚀 Features

### Frontend (React)
✅ Modern responsive design with glassmorphism UI  
✅ Motorcycle listing and advanced filtering  
✅ User authentication (login/register)  
✅ Reservation management system  
✅ Payment integration (Stripe)  
✅ Admin dashboard with statistics  
✅ Real-time status updates  

### Backend (Node.js/Express)
✅ JWT Authentication & Authorization  
✅ MongoDB database with Mongoose  
✅ Role-based access control (Admin/User)  
✅ Automated email notifications  
✅ Stripe payment processing  
✅ RESTful API architecture  
✅ CORS enabled for cross-origin requests  

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 18 or higher)
- npm or yarn package manager
- MongoDB Atlas account or local MongoDB installation
- Git

## 🛠️ Required Accounts & API Keys

You need to set up these services before running the application:

### 1. MongoDB Atlas (Database)
- Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
- Create a new cluster
- Get your connection string

### 2. Stripe (Payments)
- Create account at [Stripe](https://stripe.com)
- Get your test secret key and publishable key from the dashboard

### 3. Gmail (Email Service)
- Enable 2-factor authentication on your Gmail account
- Generate an App Password for the application

### 4. Environment Variables
Create a `.env` file in the backend directory with the following variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
PORT=5000
JWT_SECRET=your_secure_jwt_secret_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
ADMIN_EMAIL=admin@yourapp.com
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
📦 Installation & Setup
Step 1: Clone the Repository
bash
git clone https://github.com/yourusername/soydan-motorcycle-rental.git
cd soydan-motorcycle-rental
Step 2: Backend Setup
bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit the .env file with your actual credentials
Step 3: Frontend Setup
bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
🎯 Running the Application
Development Mode (Recommended)
Terminal 1 - Backend:

bash
cd backend
npm run dev
Backend will run on: http://localhost:5000

Terminal 2 - Frontend:

bash
cd frontend
npm run dev
Frontend will run on: http://localhost:5173

Production Build
bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run build
# Then serve the dist folder with your preferred server
🔐 Default Test Users
The application automatically creates these users on first run:

👑 Admin Account
Email: admin@soydan.com

Password: admin123

Access: Full admin privileges, can manage motorcycles and reservations

👤 Test User Account
Email: test@soydan.com

Password: test123

Access: Standard user privileges, can make reservations

💳 Payment Testing
Test Credit Cards (Stripe Test Mode)
Use these test cards for payment processing:

Card Number	Expiry	CVC	ZIP	Description
4242 4242 4242 4242	12/34	123	12345	Successful payment
4000 0000 0000 0002	12/34	123	12345	Payment declined
5555 5555 5555 4444	12/34	123	12345	Mastercard test
🗂️ Project Structure
text
soydan-motorcycle-rental/
├── 📁 images/                   # Screenshots and assets
│   ├── 📄 1.png                # Main application screenshot
│   ├── 📄 admin.png            # Admin panel screenshot
│   ├── 📄 BACKEND.png          # Backend running screenshot
│   ├── 📄 BACKEND2.png         # Backend detailed log
│   ├── 📄 FRONTEND.png         # Frontend development server
│   ├── 📄 api-test.png         # API test results
│   ├── 📄 apimotors.png        # Motor API data
│   ├── 📄 customer.png         # Customer interface
│   └── 📄 login.png            # Login page
├── 📁 frontend/                 # React application
│   ├── 📁 src/
│   │   ├── 📄 App.jsx          # Main application component
│   │   ├── 📄 main.jsx         # React entry point
│   │   └── 📄 App.css          # Styles and glassmorphism design
│   ├── 📄 package.json
│   ├── 📄 vite.config.js       # Vite configuration
│   └── 📄 index.html
├── 📁 backend/                  # Node.js/Express server
│   ├── 📁 models/              # MongoDB models
│   │   ├── 📄 User.js          # User model
│   │   ├── 📄 Motor.js         # Motorcycle model
│   │   ├── 📄 Rezervasyon.js   # Reservation model
│   │   └── 📄 Odeme.js         # Payment model
│   ├── 📁 routes/              # API routes
│   │   ├── 📄 auth.js          # Authentication routes
│   │   ├── 📄 motorlar.js      # Motorcycle routes
│   │   ├── 📄 rezervasyonlar.js # Reservation routes
│   │   └── 📄 odemeler.js      # Payment routes
│   ├── 📁 middleware/          # Custom middleware
│   │   └── 📄 auth.js          # JWT authentication
│   ├── 📄 server.js            # Main server file
│   └── 📄 package.json
└── 📄 README.md
🌐 API Endpoints
Authentication
POST /api/auth/register - User registration

POST /api/auth/login - User login

Motorcycles
GET /api/motorlar - Get all motorcycles (public)

POST /api/motorlar - Add new motorcycle (Admin only)

PUT /api/motorlar/:id - Update motorcycle (Admin only)

DELETE /api/motorlar/:id - Delete motorcycle (Admin only)

Reservations
GET /api/rezervasyonlar - Get all reservations (Admin only)

GET /api/rezervasyonlar/benim-rezervasyonlarim - Get user's reservations

POST /api/rezervasyonlar - Create new reservation

PUT /api/rezervasyonlar/:id/durum - Update reservation status (Admin only)

DELETE /api/rezervasyonlar/:id - Delete reservation

Payments
POST /api/odemeler/create-payment-intent - Create Stripe payment intent

POST /api/odemeler/test-odeme - Test payment endpoint

POST /api/odemeler/confirm-payment - Confirm payment

GET /api/odemeler/gecmis - Payment history

📧 Email System
The application sends automated emails for:
✅ Reservation confirmations
✅ New reservation notifications to admin
✅ Reservation status updates
✅ Payment confirmations

Setup Requirements:

Gmail account with 2FA enabled

App password generated for the application

🛠️ Technologies Used
Frontend
React 18 - UI framework

Vite - Build tool and dev server

CSS3 - Modern styling with glassmorphism effects

Context API - State management

Backend
Node.js - Runtime environment

Express.js - Web framework

MongoDB - Database

Mongoose - ODM for MongoDB

JWT - Authentication tokens

Stripe - Payment processing

Nodemailer - Email service

bcryptjs - Password hashing

CORS - Cross-origin resource sharing

🐛 Troubleshooting
Common Issues & Solutions
CORS Errors

bash
# Check backend CORS configuration in server.js
# Ensure frontend URL is in allowed origins
MongoDB Connection Issues

bash
# Verify MONGODB_URI in .env file
# Check network access in MongoDB Atlas
# Ensure IP is whitelisted in MongoDB Atlas
Authentication Problems

bash
# Verify JWT_SECRET in .env file
# Check token expiration
# Ensure proper headers in API calls
Email Not Sending

bash
# Verify Gmail app password
# Check EMAIL_USER and EMAIL_PASS in .env
# Ensure 2FA is enabled on Gmail account
Checking Logs

bash
# Backend logs
cd backend && npm run dev

# Frontend logs
cd frontend && npm run dev

# Check browser console for frontend errors
🚀 Deployment
Backend Deployment (Heroku/Railway)
Set environment variables in your hosting platform

Deploy the backend directory

Ensure CORS settings include your frontend URL

Frontend Deployment (Vercel/Netlify)
Build the project: npm run build

Deploy the dist folder

Update API URLs in production

👨‍💻 Developer
Name: [Your Name]
Email: [Your Email]
GitHub: [Your GitHub Profile]
Portfolio: [Your Portfolio URL]

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🤝 Contributing
Fork the project

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

📞 Support
If you encounter any problems or have questions:

Check the troubleshooting section above

Open an issue on GitHub

Contact the developer
