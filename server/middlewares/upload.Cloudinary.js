const multer = require("multer");
const AppError = require("../utilts/app.Error");
const catchAsync = require("../utilts/catch.Async");
const fs = require("fs");
const path = require("path");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Only image files are allowed", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/* -----------------------------------------------------------------------
 * Multer field wrappers
 * --------------------------------------------------------------------- */
exports.uploadSingle = (field) => (req, res, next) => {
  upload.single(field)(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

exports.uploadFields = (fields) => (req, res, next) => {
  upload.fields(fields)(req, res, (err) => {
    if (err) return next(err);
    next();
  });
};

/* -----------------------------------------------------------------------
 * Save buffer directly to server's local public/uploads directory
 * --------------------------------------------------------------------- */
const saveBufferLocally = (file, fieldName) => {
  const localFolderMap = {
    photo:      "users",
    image:      "comments",
    images:     "topics",
    topicImage: "topics",
    banner:     "banners",
  };
  const subfolder = localFolderMap[fieldName] || "others";
  const uploadDir = path.join(__dirname, "../public/uploads", subfolder);
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname) || ".jpg";
  const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
  const filePath = path.join(uploadDir, filename);
  
  fs.writeFileSync(filePath, file.buffer);
  console.log(`[Local Upload] Saved file locally: ${filePath}`);
  return `/api/uploads/${subfolder}/${filename}`;
};

/* -----------------------------------------------------------------------
 * Process uploads and assign local URLs to req.body.
 * We keep the name uploadToCloudinary to avoid refactoring import names in routing files.
 * --------------------------------------------------------------------- */
exports.uploadToCloudinary = catchAsync(async (req, res, next) => {
  console.log("=== Local upload middleware ===");
  console.log("req.file:", req.file ? req.file.originalname : "undefined");
  console.log("req.files:", req.files ? Object.keys(req.files) : "undefined");

  const hasFile  = !!req.file;
  const hasFiles = req.files && Object.keys(req.files).length > 0;

  if (!hasFile && !hasFiles) {
    console.log("No files uploaded.");
    return next();
  }

  // ── Single file ──
  if (hasFile) {
    const field  = req.file.fieldname;
    try {
      const localPath = saveBufferLocally(req.file, field);
      req.body[field] = localPath;
      console.log(`Saved single file locally: ${localPath}`);
    } catch (err) {
      console.error(`Local upload failed: ${err.message}`);
      return next(new AppError(`Local upload failed: ${err.message}`, 400));
    }
  }

  // ── Multiple fields ──
  if (hasFiles) {
    for (const fieldName of Object.keys(req.files)) {
      const files = req.files[fieldName];
      if (!files || !files.length) continue;

      const uploads = [];
      console.log(`Saving ${files.length} files locally for field "${fieldName}"...`);
      for (const file of files) {
        try {
          const localPath = saveBufferLocally(file, fieldName);
          uploads.push(localPath);
          console.log(`Saved file locally: ${localPath}`);
        } catch (err) {
          console.error(`Local upload failed for ${file.originalname}: ${err.message}`);
          return next(new AppError(`Local upload failed for ${file.originalname}: ${err.message}`, 400));
        }
      }

      if (uploads.length > 0) {
        req.body[fieldName] = uploads.length === 1 ? uploads[0] : uploads;
        console.log(`Updated req.body.${fieldName} with:`, req.body[fieldName]);
      }
    }
  }

  next();
});
