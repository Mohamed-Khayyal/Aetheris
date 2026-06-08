const Comment = require("../models/comment.model");
const Topic   = require("../models/topic.model");
const { ADMIN_CATEGORIES } = require("../models/topic.model");
const catchAsync = require("../utilts/catch.Async");
const AppError   = require("../utilts/app.Error");
const { sendSuccess } = require("../utilts/response");
const STATUS_CODES   = require("../utilts/response.Codes");

/* -----------------------------------------------------------------------
 * POST /api/topics/:topicId/comments
 * Each user may only post ONE comment per topic.
 * --------------------------------------------------------------------- */
exports.createComment = catchAsync(async (req, res, next) => {
  const { topicId } = req.params;
  const { body }    = req.body;

  if (!body || !body.trim()) {
    return next(new AppError("Comment body is required", 400));
  }

  const topic = await Topic.findById(topicId).populate("author");
  if (!topic) return next(new AppError("Topic not found", 404));

  const isAdminCategory = ADMIN_CATEGORIES.includes(topic.category);
  const isAdminAuthor = topic.author && topic.author.role === "admin";
  if ((isAdminCategory || isAdminAuthor) && req.user.role !== "admin") {
    return next(new AppError("Comments are disabled for official administrator topics. You can only like them.", 403));
  }

  const image   = req.body.image || null;

  const comment = await Comment.create({
    body: body.trim(),
    topic: topicId,
    author: req.user._id,
    image,
  });

  await comment.populate("author", "name email photo role");

  return sendSuccess(res, { comment }, "Comment posted successfully", STATUS_CODES.CREATED);
});

/* -----------------------------------------------------------------------
 * GET /api/topics/:topicId/comments  (paginated)
 * --------------------------------------------------------------------- */
exports.getComments = catchAsync(async (req, res, next) => {
  const { topicId } = req.params;

  const topic = await Topic.findById(topicId);
  if (!topic) return next(new AppError("Topic not found", 404));

  const page  = Math.max(parseInt(req.query.page)  || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const skip  = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    Comment.find({ topic: topicId })
      .populate("author", "name email photo role")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),
    Comment.countDocuments({ topic: topicId }),
  ]);

  return sendSuccess(res, {
    comments,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
});

/* -----------------------------------------------------------------------
 * PATCH /api/comments/:id
 * Author or admin can update.
 * --------------------------------------------------------------------- */
exports.updateComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new AppError("Comment not found", 404));

  const isOwner = comment.author.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    return next(new AppError("You are not allowed to update this comment", 403));
  }

  if (req.body.body && req.body.body.trim()) comment.body = req.body.body.trim();
  if (req.body.image !== undefined) comment.image = req.body.image;

  await comment.save();
  await comment.populate("author", "name email photo role");

  return sendSuccess(res, { comment }, "Comment updated successfully");
});

/* -----------------------------------------------------------------------
 * DELETE /api/comments/:id
 * Author or admin can delete.
 * --------------------------------------------------------------------- */
exports.deleteComment = catchAsync(async (req, res, next) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return next(new AppError("Comment not found", 404));

  const isOwner = comment.author.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    return next(new AppError("You are not allowed to delete this comment", 403));
  }

  await Comment.findByIdAndDelete(req.params.id);
  return sendSuccess(res, {}, "Comment deleted successfully");
});
