# 💍 Düğün Bütçem (Wedding Tracker)

A comprehensive wedding budget and expense tracking application featuring a responsive web dashboard, a mobile application, and a robust backend API.

## 🚀 Project Architecture

This repository is a Monorepo containing three main components:

### 1. 🖥️ Web Client (Root)
Located in the root directory.
- **Tech Stack:** React, Vite, TailwindCSS, Chart.js.
- **Features:**
  - Comprehensive Dashboard with charts (Expenses vs Budget).
  - Detailed Expense, Asset, and Vendor management.
  - "Smart List" (Sihirli Liste) for automated suggestions.
  - Installment tracking calendar.

### 2. 📱 Mobile App (`/mobile`)
Located in the `mobile` folder.
- **Tech Stack:** React Native, Expo.
- **Features:**
  - Native mobile experience (iOS & Android).
  - Quick expense entry with Bottom Sheet UI.
  - Push notifications.
  - Synchronization with the web dashboard.

### 3. 🔌 Backend Server (`/server`)
Located in the `server` folder.
- **Tech Stack:** Node.js, Express.js, PostgreSQL.
- **Features:**
  - RESTful API endpoints for data persistence.
  - Image upload with `multer` and `sharp` optimization.
  - Authentication middleware.
  - Database management via `db.js`.

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Expo Go (for mobile testing)

### 1. Web Client Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 2. Mobile App Setup
```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server with Tunnel
npx expo start --tunnel
```

### 3. Backend Server Setup
```bash
cd server

# Install dependencies
npm install

# Setup Environment Variables (.env)
# Create a .env file in /server with your DB credentials:
# DB_USER=your_user
# DB_HOST=localhost
# DB_NAME=wedding_db
# DB_PASSWORD=your_password
# DB_PORT=5432

# Start the server
node server.js
# OR with PM2
pm2 start server.js --name wedding-tracker-server
```

---

## 🔄 Git Workflow

This repository tracks all three components.
- **Main Branch:** `main`
- **Updates:**
  - Frontend edits -> Root `src/`
  - Mobile edits -> `mobile/`
  - Backend edits -> `server/`

## 📱 Features Highlight

- **Consistent UI:** Both Web and Mobile use a shared design language (Gold/Dark themes).
- **Real-time Sync:** Changes on mobile reflect instantly on the web dashboard.
- **User-Friendly:** "Add Expense" and "Edit Expense" flows are optimized for quick entry without blocking navigation.

---

*(c) 2026 Düğün Bütçem Team*
