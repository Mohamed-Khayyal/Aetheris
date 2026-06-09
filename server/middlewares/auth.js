const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { sendFail } = require("../utilts/response");
const STATUS_CODES = require("../utilts/response.Codes");
const catchAsync = require("../utilts/catch.Async");

/* =======================
   Protect
======================= */
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return sendFail(
      res,
      {},
      "You are not logged in",
      STATUS_CODES.UNAUTHORIZED
    );
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return sendFail(
      res,
      {},
      "Invalid or expired token",
      STATUS_CODES.UNAUTHORIZED
    );
  }

  const user = await User.findById(decoded.id).select(
    "name email role photo"
  );

  if (!user) {
    return sendFail(
      res,
      {},
      "User belonging to this token no longer exists",
      STATUS_CODES.UNAUTHORIZED
    );
  }

  req.user = user;
  next();
});

/* =======================
   Restrict To Roles
======================= */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendFail(
        res,
        {},
        "You do not have permission to perform this action",
        STATUS_CODES.FORBIDDEN
      );
    }
    next();
  };
};
