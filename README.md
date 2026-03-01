# MeetMyStar

MeetMyStar is a premium web platform designed to connect users with high-profile individuals, celebrities, and global talents. Users can browse a curated roster of icons, request bookings, and interact with the platform through live specialist support or an integrated AI assistant.

## ✨ Features

- **Icon Directory:** Browse, search, and filter a vast collection of celebrities and stars across different categories and countries.
- **Premium UI/UX:** A sleek, fully responsive, mobile-first design built with Tailwind CSS, featuring rich micro-interactions powered by Framer Motion and Lottie React.
- **Booking & Inquiry System:** Users can inquire about star availability and submit booking requests directly from the star's profile.
- **Live Specialist Chat:** Real-time customer support chat powered by Socket.io.
- **Dazzbit AI Assistant:** Intelligent, automated chat support powered by the Gemini AI API to handle user inquiries 24/7.
- **Admin Portal:** 
  - Manage stars and their availability
  - Handle user bookings and inquiries
  - Respond to live user chat sessions
  - View real-time platform analytics (page views, interactions, user locations)

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion, Lottie React
- **Routing:** React Router DOM
- **Data Visualization:** Recharts
- **Live Communication:** Socket.io-client
- **Smooth Scrolling:** Lenis
- **Carousels:** Swiper

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Database ORM:** Prisma
- **Live Communication:** Socket.io
- **AI Integration:** Google Generative AI (Gemini)
- **Security & Utilities:** JWT (Authentication), Express Rate Limit, Multer (File Uploads), Nodemailer (Email), GeoIP-lite & UAParser (Analytics tracking)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/your-username/meetmystar.git
cd meetmystar
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Configure your backend environment variables by creating a `.env` file in the `backend` directory:
```env
PORT=3000
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_jwt_secret_key"
GEMINI_API_KEY="your_google_gemini_api_key"
# Add any other email or third-party API credentials needed
```

Push the database schema (SQLite by default):
```bash
npx prisma db push
```

Start the backend development server:
```bash
npm run dev
```
*(The backend runs on http://localhost:3000 by default)*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

Configure your frontend environment variables by creating a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:3000
```

Start the frontend development server:
```bash
npm run dev
```

## 📱 Usage
- Navigate to the frontend URL provided by Vite (usually `http://localhost:5173`).
- Access the Admin Portal by navigating to `/admin` and logging in with setup credentials.

## 📄 License
This project is proprietary. All rights reserved.
