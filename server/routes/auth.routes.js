const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { protect, restrictTo } = require("../middlewares/auth");
const { uploadSingle, uploadToCloudinary } = require("../middlewares/upload.Cloudinary");

// POST /api/auth/register  — always creates a "user" role account
router.post(
  "/register",
  uploadSingle("photo"),
  uploadToCloudinary,
  authController.register
);

// POST /api/auth/login
router.post("/login", authController.login);

// POST /api/auth/logout
router.post("/logout", authController.logout);

// GET /api/auth/me  (requires login)
router.get("/me", protect, authController.getMe);

// PATCH /api/auth/update-profile  (requires login, allows uploading photo)
router.patch(
  "/update-profile",
  protect,
  uploadSingle("photo"),
  uploadToCloudinary,
  authController.updateProfile
);

// PATCH /api/auth/update-password  (requires login)
router.patch("/update-password", protect, authController.updatePassword);

// POST /api/auth/admin/create  — admin only: create another admin account
router.post(
  "/admin/create",
  protect,
  restrictTo("admin"),
  uploadSingle("photo"),
  uploadToCloudinary,
  authController.createAdmin
);

// GET /api/auth/users — admin only: list all users
router.get("/users", protect, restrictTo("admin"), authController.getAllUsers);

// DELETE /api/auth/users/:id — admin only: delete user
router.delete("/users/:id", protect, restrictTo("admin"), authController.deleteUser);

module.exports = router;
