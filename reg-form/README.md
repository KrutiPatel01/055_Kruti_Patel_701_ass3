# User Registration Form — Express + Multer + express-validator

A fullstack Express app implementing a registration form with text inputs,
radio buttons, checkboxes, and single + multiple file uploads, with full
server-side validation and a "sticky form" (old values re-shown) on error.

## Folder structure

```
reg-form/
├── server.js          # all app logic: routes, multer setup, validation
├── package.json
├── views/
│   ├── form.ejs        # the registration form (also re-rendered with errors)
│   └── result.ejs       # success page: table of submitted data + images
├── public/
│   └── style.css
└── uploads/            # uploaded images are saved here (auto-created)
```

## Setup

```bash
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

## What it does

- **Fields:** username (text), password (text), confirm password (text),
  email (text), gender (radio), hobbies (checkboxes), profile picture
  (single file upload), other pictures (multiple file upload).
- **Validation (server-side, via `express-validator` + `multer`):**
  - Username: required, 4–20 chars, letters/numbers/underscore only
  - Password: required, min 6 chars
  - Confirm password: must match password
  - Email: required, valid email format
  - Gender: required, one of Male/Female/Other
  - Hobbies: at least one checkbox must be selected
  - Profile picture: required, must be an image (jpg/png/gif/webp), max 2MB
  - Other pictures: optional, up to 5 files, same type/size rules
- **On invalid submission:** the form re-renders with every error message
  listed, and all previously entered *non-password* field values (username,
  email, gender, hobbies) are pre-filled again. Any files that were saved to
  disk before the validation failure was detected are deleted, so no orphan
  files pile up in `uploads/`. (Password fields are intentionally left blank
  on re-render — this is a standard security practice, not a bug.)
- **On valid submission:** a results page renders a clean HTML table with
  every field's value, plus the uploaded profile picture and a small gallery
  of any "other pictures", read back from the `uploads/` folder.

## Key implementation notes (useful if your professor asks "explain your code")

- `multer.diskStorage` gives each uploaded file a unique name
  (`fieldname-timestamp-random.ext`) so two users' `profile.jpg` never collide.
- `multer`'s `fileFilter` checks MIME type and rejects non-images *before*
  they're written to disk; `limits.fileSize` caps each file at 2MB.
- Because `multer` and `express-validator` are separate error sources
  (multer errors come from the upload middleware itself, e.g. wrong file
  type or too-large file), `server.js` merges both into a single `errors`
  object keyed by field name before deciding whether to re-render the form
  or show the success page.
- `hobbies` can arrive as a single string (one checkbox) or an array
  (multiple checkboxes) depending on the browser — the code normalizes it
  to an array in both the validation step and the "sticky" re-population.
