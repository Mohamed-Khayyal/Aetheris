# 🌌 Aetheris — Dark-Fantasy Community Forum

Aetheris is an immersive, dark-fantasy themed community forum designed for players, modders, and creators. Featuring deep charcoal and gold aesthetics, the application allows users to register profiles, share topics across administrative categories, like posts, and interact securely under customizable permissions.

---

## 🔮 Core Features

- **🔐 Secure Authentication**: Token-based authentication using JWTs transmitted via secure `httpOnly` cookies. Prevents frontend XSS attacks from reading auth tokens.
- **👤 Interactive User Profiles**: Users can update their display names and upload new avatar photos. Profiles showcase a list of all historical topics created by that specific user.
- **📜 Topic Creation & Exploration**: Post topics under official categories (e.g., Announcements, Guides, Mods, Events, Classes). Users can view individual threads, filter topics by category or author, and search by keyword.
- **🛡️ Administrative Controls**: Topics authored by administrators or placed within official lock categories disable regular user commenting (while still permitting users to support/like the topic), ensuring announcements remain clean.
- **💖 Interactive Likes**: Users can react to topics with likes to express support.
- **☁️ Cloudinary Media Uploads**: Integrated profile picture and topic image uploads processed via Multer directly to Cloudinary, with a robust local storage folder fallback.
- **🎨 Premium Theme & Styling**: Styled entirely in custom, responsive Vanilla CSS and CSS Modules with smooth transitions, gold typography highlights, glowing active states, and custom animated SVG Discord integrations.

---

## 🛠️ Technology Stack

### Backend (Server)
- **Node.js & Express**: High-performance REST API routing.
- **MongoDB Atlas & Mongoose**: Flexible, schema-based ODM database architecture.
- **JSON Web Tokens (JWT) & Cookie Parser**: Secure session authentication.
- **Multer & Cloudinary**: Direct memory-buffered cloud media uploads.

### Frontend (Client)
- **React (Vite)**: Rapid hot-module reloading and optimized bundling.
- **Axios**: Promised-based HTTP client configuration featuring global Axios instances and credential-sharing setup.
- **Lucide React & Custom SVGs**: Sleek iconography with interactive hover glow effects.
- **Vanilla CSS Modules**: Fully scoped layouts, fluid responsive viewport heights, and character art hero configurations.

---

## 📂 Project Structure

```text
Aetheris/
├── client/                     # React Frontend App
│   ├── public/                 # Static assets (favicons, SVG sprite sheets)
│   ├── src/
│   │   ├── api/                # API client connection wrappers
│   │   ├── assets/             # Wallpapers, background files, and SVGs
│   │   ├── components/         # Reusable layouts, footers, and navbar
│   │   ├── context/            # AuthContext provider
│   │   └── pages/              # Profile, Dashboard, Authentication, and Threads
│   ├── package.json
│   └── vite.config.js
├── config/                     # Backend Cloudinary & MongoDB database setups
├── controllers/                # Auth, Topic, and Comment request controllers
├── middlewares/                # CORS handlers, JWT validation, and Multer buffers
├── models/                     # Mongoose database schemas (User, Topic, Comment)
├── routes/                     # Express Router API declarations
├── utilts/                     # Error handling wrappers, response formatting helpers
├── server.js                   # Main entry point for the Express API server
├── .gitignore                  # Excludes node_modules, .env, and dist outputs
└── package.json                # Server-side scripts and dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) database cluster
- A [Cloudinary](https://cloudinary.com/) account for avatar/image storage

### Installation
1. Clone the repository and navigate to the directory:
   ```bash
   git clone <your-repository-url>
   cd Aetheris
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   cd ..
   ```

---

## ⚙️ Environment Configuration

To run the application, you need to create environment files locally. These are ignored by Git to prevent exposing credentials.

### 1. Backend Environment (`.env` in the root folder)
Create a `.env` file at the root level (`Aetheris/.env`):

```env
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/aetheris

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS (Comma-separated allowed origins)
ALLOWED_ORIGINS=http://localhost:5173
```

### 2. Frontend Environment (`.env` in the `client/` folder)
Create a `.env` file inside the `client` directory (`Aetheris/client/.env`):

```env
VITE_API_URL=http://localhost:3000/api
```

---

## 🏃 Running the Application

### Start the Backend Server (Root)
From the root directory, run:
```bash
npm start
```
The server will run on `http://localhost:3000` and connect to your MongoDB Atlas database.

### Start the Frontend Dev Server (Client)
In a new terminal window, navigate to the `client` directory and run:
```bash
cd client
npm run dev
```
The frontend will launch on `http://localhost:5173`.

---

## 📦 Production & Deployment

### 1. Build the Frontend
To compile the production-ready React client:
```bash
cd client
npm run build
```
This outputs static HTML, CSS, and JS assets to `client/dist/`.

### 2. Live Environment Settings
When deploying your production instances (e.g., Vercel, Netlify, Render, Railway):
* **Backend variables**: Set `NODE_ENV=production` so that cookies are configured with `secure: true` and `sameSite: "none"` over HTTPS. Set `ALLOWED_ORIGINS` to your production frontend URL.
* **Frontend variables**: Configure `VITE_API_URL` to point to your live backend domain API endpoint (e.g., `https://api.aetheris.com/api`).
