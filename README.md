# TravelSys — Full Stack Travel Management System

A MERN stack application built with React.js, Node.js, Express.js, MongoDB, and JWT Authentication.

## Tech Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend UI |
| Node.js + Express.js | Backend API |
| MongoDB | Database |
| JWT | Authentication |
| RBAC | Role-Based Access Control |

---

## Prerequisites

Make sure you have installed:
- **Node.js** (v16 or higher) — https://nodejs.org
- **MongoDB** — https://www.mongodb.com/try/download/community (or use MongoDB Atlas)
- **npm** (comes with Node.js)

---

## Setup & Run Instructions

### Step 1 — Start MongoDB

If using local MongoDB:
```bash
mongod
```

Or use **MongoDB Atlas** (free cloud): create a cluster, get your connection string, and paste it in `backend/.env`.

---

### Step 2 — Setup & Run the Backend

Open a terminal and run:

```bash
cd backend
npm install
npm run dev
```

The backend will start on **http://localhost:5000**

---

### Step 3 — Setup & Run the Frontend

Open a **second terminal** and run:

```bash
cd frontend
npm install
npm start
```

The frontend will open in your browser at **http://localhost:3000**

---

## Usage

### 1. Register an Account
- Go to `http://localhost:3000/register`
- Create a new account (default role: traveler)

### 2. Browse & Create Trips
- Go to `Browse Trips` in the navbar
- Click `+ Add Trip` to create a new trip
- Click any trip card to view details, add itinerary, budget items, or join the trip

### 3. Dashboard
- See your personal trip stats (Total, Ongoing, Completed)

### 4. Profile
- View your profile, trips, and activity

### 5. Create Admin User (optional)
To create an admin account, register normally then manually update the role in MongoDB:
```
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```
Admin users get access to the **Admin Panel** where they can manage all users/trips and seed sample data.

---

## Project Structure

```
travelsys/
├── backend/
│   ├── models/         # Mongoose schemas (User, Trip)
│   ├── routes/         # Express routes (auth, trips, users, admin)
│   ├── middleware/     # JWT auth + RBAC middleware
│   ├── server.js       # Express app entry point
│   └── .env            # Environment variables
└── frontend/
    ├── public/
    └── src/
        ├── context/    # React AuthContext
        ├── pages/      # Login, Register, Dashboard, BrowseTrips, TripDetail, Profile, AdminPanel
        ├── components/ # Navbar
        ├── App.js      # Routes
        └── index.css   # Global styles
```
"# Role-based-Travel-Itinerary-and-Budget-Management-System" 
