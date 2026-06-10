const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const catchAsync = require("../utilts/catch.Async");
const AppError = require("../utilts/app.Error");
const { sendSuccess } = require("../utilts/response");
const STATUS_CODES = require("../utilts/response.Codes");

/* -----------------------------------------------------------------------
 * Helper – sign JWT and set it as an httpOnly cookie
 * --------------------------------------------------------------------- */
const signTokenAndSetCookie = (user, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  return token;
};

/* -----------------------------------------------------------------------
 * POST /api/auth/register
 * Public — role is ALWAYS "user". No one can self-assign admin.
 * --------------------------------------------------------------------- */
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError("Name, email and password are required", 400));
  }

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) {
    return next(new AppError("Email already in use. Please use another email.", 400));
  }

  const user = await User.create({
    name:     name.trim(),
    email:    email.toLowerCase().trim(),
    password,
    role:     "user", // hard-coded — no body field can override this
    photo:    req.body.photo || null,
  });

  signTokenAndSetCookie(user, res);

  return sendSuccess(
    res,
    {
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        photo: user.photo,
      },
    },
    "Registered successfully",
    STATUS_CODES.CREATED
  );
});

/* -----------------------------------------------------------------------
 * POST /api/auth/admin/create
 * ADMIN ONLY — create another admin account.
 * Protected by protect + restrictTo("admin") in the route.
 * --------------------------------------------------------------------- */
exports.createAdmin = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError("Name, email and password are required", 400));
  }

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) {
    return next(new AppError("Email already in use.", 400));
  }

  const admin = await User.create({
    name:     name.trim(),
    email:    email.toLowerCase().trim(),
    password,
    role:     "admin",
    photo:    req.body.photo || null,
  });

  return sendSuccess(
    res,
    {
      user: {
        id:    admin._id,
        name:  admin.name,
        email: admin.email,
        role:  admin.role,
        photo: admin.photo,
      },
    },
    "Admin account created successfully",
    STATUS_CODES.CREATED
  );
});

/* -----------------------------------------------------------------------
 * POST /api/auth/login
 * --------------------------------------------------------------------- */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select("+password");

  if (!user || !(await user.correctPassword(password))) {
    return next(new AppError("Invalid email or password", 401));
  }

  signTokenAndSetCookie(user, res);

  return sendSuccess(
    res,
    {
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        photo: user.photo,
      },
    },
    "Logged in successfully"
  );
});

/* -----------------------------------------------------------------------
 * POST /api/auth/logout
 * --------------------------------------------------------------------- */
exports.logout = (req, res) => {
  res.cookie("accessToken", "", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge:   0,
  });

  return sendSuccess(res, {}, "Logged out successfully");
};

/* -----------------------------------------------------------------------
 * GET /api/auth/me   (protected)
 * --------------------------------------------------------------------- */
exports.getMe = catchAsync(async (req, res) => {
  return sendSuccess(
    res,
    {
      user: {
        id:    req.user._id,
        name:  req.user.name,
        email: req.user.email,
        role:  req.user.role,
        photo: req.user.photo,
      },
    },
    "Current user fetched"
  );
});

/* -----------------------------------------------------------------------
 * GET /api/auth/users  (Admin only - get all users)
 * --------------------------------------------------------------------- */
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find().select("name email role photo createdAt");
  return sendSuccess(res, { users }, "Users fetched successfully");
});

/* -----------------------------------------------------------------------
 * DELETE /api/auth/users/:id  (Admin only - delete a user)
 * --------------------------------------------------------------------- */
exports.deleteUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id;
  
  if (userId.toString() === req.user._id.toString()) {
    return next(new AppError("You cannot delete your own admin account", 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  await User.findByIdAndDelete(userId);
  return sendSuccess(res, {}, "User deleted successfully");
});

/* -----------------------------------------------------------------------
 * PATCH /api/auth/update-profile   (protected)
 * --------------------------------------------------------------------- */
exports.updateProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const { name } = req.body;

  if (name !== undefined) {
    user.name = name.trim();
  }

  // req.body.photo is set by uploadToCloudinary middleware
  if (req.body.photo !== undefined) {
    user.photo = req.body.photo;
  }

  await user.save();

  return sendSuccess(
    res,
    {
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        photo: user.photo,
      },
    },
    "Profile updated successfully"
  );
});

/* -----------------------------------------------------------------------
 * PATCH /api/auth/update-password   (protected)
 * --------------------------------------------------------------------- */
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError("Current password and new password are required", 400));
  }

  if (newPassword.length < 6) {
    return next(new AppError("New password must be at least 6 characters long", 400));
  }

  // 1) Get user from collection and select password explicitly
  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // 2) Check if current password is correct
  if (!(await user.correctPassword(currentPassword))) {
    return next(new AppError("Your current password is incorrect", 401));
  }

  // 3) Update password
  user.password = newPassword;
  await user.save();

  // 4) Log user in with new token (send JWT cookie)
  signTokenAndSetCookie(user, res);

  return sendSuccess(
    res,
    {
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        photo: user.photo,
      },
    },
    "Password updated successfully"
  );
});


