const multer = require("multer");
const cloudinary = require("../config/cloudinary");
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
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* -----------------------------------------------------------------------
 * Wrap multer to work with Express 5 + multer v2
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
 * Upload a buffer to Cloudinary using upload_stream
 * --------------------------------------------------------------------- */
const uploadBufferToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(file.buffer);
  });
};

/* -----------------------------------------------------------------------
 * Local storage fallback when Cloudinary fails
 * --------------------------------------------------------------------- */
const saveBufferLocally = (file, fieldName) => {
  const localFolderMap = {
    photo:  "users",
    image:  "comments",
    images: "topics",
    banner: "banners",
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
  console.log(`[Local Fallback] Saved file locally: ${filePath}`);
  return `/api/uploads/${subfolder}/${filename}`;
};

/* -----------------------------------------------------------------------
 * Process uploaded files → push secure URLs into req.body.
 * Falls back to local server storage if Cloudinary fails.
 * --------------------------------------------------------------------- */
const folderMap = {
  photo:  "aetheris/users",
  image:  "aetheris/comments",
  images: "aetheris/topics",
  banner: "aetheris/banners",
};

exports.uploadToCloudinary = catchAsync(async (req, res, next) => {
  console.log("=== uploadToCloudinary middleware ===");
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
    const folder = folderMap[field] || "aetheris/others";
    try {
      console.log(`Uploading single file ${req.file.originalname} to Cloudinary...`);
      const result = await uploadBufferToCloudinary(req.file, folder);
      req.body[field] = result.secure_url;
      console.log(`Cloudinary upload success: ${result.secure_url}`);
    } catch (err) {
      console.error(`Cloudinary upload failed: ${err.message}`);
      return next(new AppError(`Cloudinary upload failed: ${err.message}`, 400));
    }
  }

  // ── Multiple fields ──
  if (hasFiles) {
    for (const fieldName of Object.keys(req.files)) {
      const files = req.files[fieldName];
      if (!files || !files.length) continue;

      const folder  = folderMap[fieldName] || "aetheris/others";
      const uploads = [];

      console.log(`Uploading ${files.length} files for field "${fieldName}"...`);
      for (const file of files) {
        try {
          console.log(`Uploading ${file.originalname} to Cloudinary...`);
          const result = await uploadBufferToCloudinary(file, folder);
          uploads.push(result.secure_url);
          console.log(`Cloudinary upload success: ${result.secure_url}`);
        } catch (err) {
          console.error(`Cloudinary upload failed for ${file.originalname}: ${err.message}`);
          return next(new AppError(`Cloudinary upload failed for ${file.originalname}: ${err.message}`, 400));
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
