const express = require("express");
const cookieParser = require("cookie-parser");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const connectDB = require("./config/db.Config");
const corsHandler = require("./middlewares/cors.Handler");
const AppError = require("./utilts/app.Error");
const errorHandler = require("./middlewares/error.Handler");

// Routes
const authRoutes = require("./routes/auth.routes");
const topicRoutes = require("./routes/topic.routes");
const commentRoutes = require("./routes/comment.routes");

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

// GLOBAL MIDDLEWARES
app.use(corsHandler);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

const path = require("path");

// Serve static uploaded files locally
app.use("/api/uploads", express.static(path.join(__dirname, "public/uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/comments", commentRoutes);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorHandler);

const startServer = async () => {
  try {
    console.log("Starting server...");
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server failed to start", err);
    process.exit(1);
  }
};

startServer();