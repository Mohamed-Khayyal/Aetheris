const Topic = require("../models/topic.model");
const catchAsync = require("../utilts/catch.Async");
const AppError = require("../utilts/app.Error");
const { sendSuccess } = require("../utilts/response");
const STATUS_CODES = require("../utilts/response.Codes");
const { ADMIN_CATEGORIES } = require("../models/topic.model");

/* -----------------------------------------------------------------------
 * POST /api/topics
 * --------------------------------------------------------------------- */
exports.createTopic = catchAsync(async (req, res, next) => {
  const { title, body, category } = req.body;

  if (!title || !body || !category) {
    return next(new AppError("Title, body and category are required", 400));
  }

  if (req.user.role !== "admin" && ADMIN_CATEGORIES.includes(category)) {
    return next(new AppError(`Only admins can post in the "${category}" category`, 403));
  }

  // Collect uploaded image URLs from the upload middleware
  let images = [];
  if (req.body.images) {
    images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
  }

  const topic = await Topic.create({
    title,
    body,
    category,
    author: req.user._id,
    images,
  });

  await topic.populate("author", "name email photo role");

  return sendSuccess(res, { topic }, "Topic created successfully", STATUS_CODES.CREATED);
});

/* -----------------------------------------------------------------------
 * GET /api/topics   (paginated, optional ?category=)
 * --------------------------------------------------------------------- */
exports.getAllTopics = catchAsync(async (req, res) => {
  const page  = Math.max(parseInt(req.query.page)  || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const skip  = (page - 1) * limit;

  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.author) filter.author = req.query.author;

  const [topics, total] = await Promise.all([
    Topic.find(filter)
      .populate("author", "name email photo role")
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-likes"), // don't return full likes array on list
    Topic.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    topics,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

/* -----------------------------------------------------------------------
 * GET /api/topics/categories
 * --------------------------------------------------------------------- */
exports.getCategories = catchAsync(async (req, res) => {
  const { ALL_CATEGORIES, ADMIN_CATEGORIES, USER_CATEGORIES } = require("../models/topic.model");
  return sendSuccess(res, {
    categories: {
      adminOnly:   ADMIN_CATEGORIES,
      userAllowed: USER_CATEGORIES,
      all:         ALL_CATEGORIES,
    },
  });
});

/* -----------------------------------------------------------------------
 * GET /api/topics/:id
 * --------------------------------------------------------------------- */
exports.getTopicById = catchAsync(async (req, res, next) => {
  const topic = await Topic.findById(req.params.id)
    .populate("author", "name email photo role")
    .populate({
      path:    "comments",
      populate: { path: "author", select: "name email photo role" },
      options:  { sort: { createdAt: 1 } },
    });

  if (!topic) return next(new AppError("Topic not found", 404));

  return sendSuccess(res, { topic });
});

/* -----------------------------------------------------------------------
 * PATCH /api/topics/:id
 * --------------------------------------------------------------------- */
exports.updateTopic = catchAsync(async (req, res, next) => {
  const topic = await Topic.findById(req.params.id);
  if (!topic) return next(new AppError("Topic not found", 404));

  const isOwner = topic.author.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    return next(new AppError("You are not allowed to update this topic", 403));
  }

  const allowed = ["title", "body", "category", "images"];
  allowed.forEach((f) => { if (req.body[f] !== undefined) topic[f] = req.body[f]; });

  // isPinned — admin only
  if (req.body.isPinned !== undefined && req.user.role === "admin") {
    topic.isPinned = req.body.isPinned;
  }

  await topic.save();
  await topic.populate("author", "name email photo role");

  return sendSuccess(res, { topic }, "Topic updated successfully");
});

/* -----------------------------------------------------------------------
 * DELETE /api/topics/:id
 * --------------------------------------------------------------------- */
exports.deleteTopic = catchAsync(async (req, res, next) => {
  const topic = await Topic.findById(req.params.id);
  if (!topic) return next(new AppError("Topic not found", 404));

  const isOwner = topic.author.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    return next(new AppError("You are not allowed to delete this topic", 403));
  }

  await Topic.findByIdAndDelete(req.params.id);
  return sendSuccess(res, {}, "Topic deleted successfully");
});

/* -----------------------------------------------------------------------
 * POST /api/topics/:id/like
 * Toggle like — one like per user per topic
 * --------------------------------------------------------------------- */
exports.toggleLike = catchAsync(async (req, res, next) => {
  const topic = await Topic.findById(req.params.id);
  if (!topic) return next(new AppError("Topic not found", 404));

  const userId    = req.user._id.toString();
  const alreadyLiked = topic.likes.some((id) => id.toString() === userId);

  if (alreadyLiked) {
    // Remove like
    topic.likes    = topic.likes.filter((id) => id.toString() !== userId);
    topic.likesCount = Math.max(topic.likesCount - 1, 0);
  } else {
    // Add like
    topic.likes.push(req.user._id);
    topic.likesCount += 1;
  }

  await topic.save();

  return sendSuccess(res, {
    liked:      !alreadyLiked,
    likesCount: topic.likesCount,
  }, alreadyLiked ? "Like removed" : "Topic liked");
});
