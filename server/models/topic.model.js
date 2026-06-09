const mongoose = require("mongoose");

/* ------------------------------------------------------------------ *
 *  ALLOWED CATEGORIES
 *  Admin-only: Announcements, Guides, Mods, Events, Classes
 *  User-allowed: Questions and suggestions, Bug reports, Marketplace
 * ------------------------------------------------------------------ */
const ADMIN_CATEGORIES = ["Announcements", "Guides", "Mods", "Events", "Classes"];
const USER_CATEGORIES = ["Questions and suggestions", "Bug reports", "Marketplace"];
const ALL_CATEGORIES = [...ADMIN_CATEGORIES, ...USER_CATEGORIES];

const topicSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Topic title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [150, "Title must be less than 150 characters"],
    },
    body: {
      type: String,
      required: [true, "Topic body is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ALL_CATEGORIES,
        message: `Category must be one of: ${ALL_CATEGORIES.join(", ")}`,
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    commentsCount: {
      type: Number,
      default: 0,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate comments
topicSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "topic",
  localField: "_id",
});

const Topic = mongoose.model("Topic", topicSchema);

module.exports = Topic;
module.exports.ADMIN_CATEGORIES = ADMIN_CATEGORIES;
module.exports.USER_CATEGORIES = USER_CATEGORIES;
module.exports.ALL_CATEGORIES = ALL_CATEGORIES;
