const express = require("express");
const router = express.Router();

const commentController = require("../controllers/comment.controller");
const { protect } = require("../middlewares/auth");
const { uploadSingle, uploadToCloudinary } = require("../middlewares/upload.Cloudinary");

// PATCH  /api/comments/:id   – update own comment (or admin)
// DELETE /api/comments/:id   – delete own comment (or admin)
router
  .route("/:id")
  .patch(
    protect,
    uploadSingle("image"),
    uploadToCloudinary,
    commentController.updateComment
  )
  .delete(protect, commentController.deleteComment);

module.exports = router;
