const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: [true, "Comment body is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [2000, "Comment must be less than 2000 characters"],
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// After saving a comment, increment the topic's commentsCount
commentSchema.post("save", async function () {
  await mongoose
    .model("Topic")
    .findByIdAndUpdate(this.topic, { $inc: { commentsCount: 1 } });
});

// After deleting a comment, decrement the topic's commentsCount
commentSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await mongoose
      .model("Topic")
      .findByIdAndUpdate(doc.topic, { $inc: { commentsCount: -1 } });
  }
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
