// server.js
// Fullstack Assignment 1: User Registration Form
// Express + EJS + Multer (file upload) + express-validator (field validation)

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- View engine & static files ----------
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true })); // parse form fields (non-file)
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Ensure uploads folder exists ----------
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR)); // so <img src="/uploads/xyz.jpg"> works

// ---------- Folder for generated download files (registration data as CSV) ----------
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

// ---------- Multer configuration ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // unique name: fieldname-timestamp-random.ext
    const ext = path.extname(file.originalname);
    const unique = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB per file

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Reject silently here; we surface a friendly error manually below via req.fileValidationErrors
    if (!req.fileValidationErrors) req.fileValidationErrors = [];
    req.fileValidationErrors.push(
      `${file.fieldname}: "${file.originalname}" is not a supported image type (jpg, jpeg, png, gif, webp only).`
    );
    cb(null, false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
}).fields([
  { name: 'profilePic', maxCount: 1 },
  { name: 'otherPics', maxCount: 5 }
]);

// Wrap multer in a promise-friendly middleware so we can catch its errors
// (size limit, unexpected field, etc.) alongside our own validation errors.
function handleUpload(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (!req.fileValidationErrors) req.fileValidationErrors = [];
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.fileValidationErrors.push(`File too large. Max allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB per file.`);
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        req.fileValidationErrors.push('Too many files uploaded, or wrong field name used for upload.');
      } else {
        req.fileValidationErrors.push(err.message);
      }
      return next();
    } else if (err) {
      return next(err); // unknown error -> pass to error handler
    }
    next();
  });
}

// ---------- Helper: delete files that were saved to disk (used for cleanup on error) ----------
function cleanupUploadedFiles(files) {
  if (!files) return;
  Object.values(files).flat().forEach((file) => {
    fs.unlink(file.path, (err) => {
      if (err) console.error('Failed to delete temp file:', file.path, err.message);
    });
  });
}

const HOBBY_OPTIONS = ['Reading', 'Sports', 'Music', 'Travel', 'Coding'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

// ---------- Field validation rules (express-validator) ----------
const validationRules = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required.')
    .isLength({ min: 4, max: 20 }).withMessage('Username must be 4-20 characters long.')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),

  body('confirmPassword')
    .notEmpty().withMessage('Please confirm your password.')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.'),

  body('gender')
    .notEmpty().withMessage('Please select a gender.')
    .isIn(GENDER_OPTIONS).withMessage('Invalid gender selection.'),

  body('hobbies')
    .custom((value) => value !== undefined && value !== '')
    .withMessage('Please select at least one hobby.')
];

// ---------- Helpers for the downloadable file ----------
// Wrap a value for CSV: quote it and double any inner quotes.
function csvCell(value) {
  return '"' + String(value).replace(/"/g, '""') + '"';
}

// Build the CSV text: same rows as the table shown on the result page.
function buildCsv(user) {
  const rows = [
    ['Field', 'Value'],
    ['Username', user.username],
    ['Email', user.email],
    ['Gender', user.gender],
    ['Hobbies', user.hobbies.join(', ')],
    ['Profile Picture', path.basename(user.profilePic)],
    ['Other Pictures', user.otherPics.map((p) => path.basename(p)).join(', ') || 'None']
  ];
  return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}

// Return the full path only if `name` is a plain file name that exists inside `dir`.
// path.basename() strips any "../" so nobody can download files outside the folder.
function safeFilePath(dir, name) {
  const clean = path.basename(String(name));
  if (clean !== name) return null;
  const full = path.join(dir, clean);
  return fs.existsSync(full) ? full : null;
}

// ---------- Routes ----------

// GET: show empty form
app.get('/', (req, res) => {
  res.render('form', {
    errors: {},
    old: {},
    hobbyOptions: HOBBY_OPTIONS,
    genderOptions: GENDER_OPTIONS
  });
});

// POST: handle registration
app.post('/register', handleUpload, validationRules, (req, res) => {
  const result = validationResult(req);
  const errorsArray = result.array();

  // Normalize hobbies into an array (single checkbox -> string, multiple -> array)
  let hobbies = req.body.hobbies || [];
  if (!Array.isArray(hobbies)) hobbies = [hobbies];

  // Collect field errors into a { fieldName: message } map for easy EJS lookup
  const errors = {};
  errorsArray.forEach((e) => {
    if (!errors[e.path]) errors[e.path] = e.msg;
  });

  // Manual check: profile picture is required
  const hasProfilePic = req.files && req.files.profilePic && req.files.profilePic.length > 0;
  if (!hasProfilePic && !(req.fileValidationErrors || []).some(m => m.includes('profilePic'))) {
    errors.profilePic = 'Profile picture is required.';
  }

  // Merge in multer/file-type/file-size errors
  if (req.fileValidationErrors && req.fileValidationErrors.length > 0) {
    errors.files = req.fileValidationErrors.join(' ');
  }

  const hasErrors = Object.keys(errors).length > 0;

  if (hasErrors) {
    // Clean up any files that DID get saved, since the overall submission is invalid
    cleanupUploadedFiles(req.files);

    return res.status(400).render('form', {
      errors,
      old: {
        username: req.body.username || '',
        email: req.body.email || '',
        gender: req.body.gender || '',
        hobbies
        // Note: password fields are intentionally NOT re-populated, as a security best practice.
      },
      hobbyOptions: HOBBY_OPTIONS,
      genderOptions: GENDER_OPTIONS
    });
  }

  // ---------- All valid: build data to display ----------
  const profilePic = req.files.profilePic[0];
  const otherPics = req.files.otherPics || [];

  const userData = {
    username: req.body.username,
    email: req.body.email,
    gender: req.body.gender,
    hobbies,
    profilePic: `/uploads/${profilePic.filename}`,
    otherPics: otherPics.map(f => `/uploads/${f.filename}`)
  };

  // Save the registration details to a CSV file so the user can download it.
  // (The password is deliberately NOT written to the file.)
  const dataFileName = `registration-${userData.username}-${Date.now()}.csv`;
  fs.writeFileSync(path.join(DOWNLOAD_DIR, dataFileName), buildCsv(userData), 'utf8');
  userData.dataFile = dataFileName;

  res.render('result', { user: userData });
});

// ---------- DOWNLOAD ROUTES ----------
// GET /download/data/:filename  -> downloads the registration details file (CSV)
app.get('/download/data/:filename', (req, res) => {
  const file = safeFilePath(DOWNLOAD_DIR, req.params.filename);
  if (!file) return res.status(404).send('File not found.');
  res.download(file, req.params.filename); // sets Content-Disposition: attachment
});

// GET /download/image/:filename -> downloads one of the uploaded pictures
app.get('/download/image/:filename', (req, res) => {
  const file = safeFilePath(UPLOAD_DIR, req.params.filename);
  if (!file) return res.status(404).send('File not found.');
  res.download(file, req.params.filename);
});

// ---------- Fallback error handler ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Something went wrong: ' + err.message);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
