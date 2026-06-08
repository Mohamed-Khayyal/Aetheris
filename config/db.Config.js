const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, 
    });

    console.log("MongoDB Connected To Atlas");
  } catch (error) {
    console.error("MongoDB connection failed ❌");
    console.error(error.message || error);
    process.exit(1);
  }
};

module.exports = connectDB;