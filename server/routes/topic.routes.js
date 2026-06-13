const express = require("express");
const router = express.Router();

const topicController = require("../controllers/topic.controller");
const commentController = require("../controllers/comment.controller");
const { protect } = require("../middlewares/auth");
const { uploadFields, uploadSingle, uploadToCloudinary } = require("../middlewares/upload.Cloudinary");

// GET /api/topics/categories  – list available categories (public)
router.get("/categories", topicController.getCategories);

// POST /api/topics/upload-image - Upload an inline image attachment
router.post(
  "/upload-image",
  protect,
  uploadSingle("topicImage"),
  uploadToCloudinary,
  (req, res) => {
    if (!req.body.topicImage) {
      return res.status(400).json({ status: "fail", message: "No image uploaded" });
    }
    res.status(200).json({
      status: "success",
      data: {
        url: req.body.topicImage,
      },
    });
  }
);

// GET  /api/topics          – list all topics (public)
// POST /api/topics          – create a topic (authenticated)
router
  .route("/")
  .get(topicController.getAllTopics)
  .post(
    protect,
    uploadFields([{ name: "images", maxCount: 5 }]),
    uploadToCloudinary,
    topicController.createTopic
  );

// GET    /api/topics/:id    – get single topic (public)
// PATCH  /api/topics/:id    – update topic (authenticated, owner or admin)
// DELETE /api/topics/:id    – delete topic (authenticated, owner or admin)
router
  .route("/:id")
  .get(topicController.getTopicById)
  .patch(
    protect,
    uploadFields([{ name: "images", maxCount: 5 }]),
    uploadToCloudinary,
    topicController.updateTopic
  )
  .delete(protect, topicController.deleteTopic);

// POST /api/topics/:id/like  (toggle like — one per user)
router.post("/:id/like", protect, topicController.toggleLike);

/* -----------------------------------------------------------------------
 * Nested comment routes under a topic
 * GET  /api/topics/:topicId/comments
 * POST /api/topics/:topicId/comments
 * --------------------------------------------------------------------- */
router
  .route("/:topicId/comments")
  .get(commentController.getComments)
  .post(
    protect,
    uploadFields([{ name: "image", maxCount: 1 }]),
    uploadToCloudinary,
    commentController.createComment
  );

module.exports = router;
