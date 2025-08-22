// We begin by importing the multer library, which is the tool we'll use to handle file uploads.
import multer from "multer";

// --- The Concept of Storage Engines ---
// Multer needs to know *where* and *how* to store the files it receives. This is handled by a "storage engine".
// Multer provides two main storage engines out of the box:
// 1. `diskStorage`: Saves the file to the server's local disk.
// 2. `memoryStorage`: Keeps the file in memory as a Buffer object (a chunk of binary data).

// Here, we are using `diskStorage`. It gives you fine-grained control over the destination and filename.
// However, we are passing an empty object `{}`. Let's see what that means:
// - `destination`: Since we haven't specified a destination folder, multer will save the uploaded files
//   to the default temporary directory of the operating system (e.g., `/tmp` on Linux).
// - `filename`: Since we haven't specified a filename function, multer will assign a random, unique
//   string as the filename, with no file extension.
//
// While this works, it's often not ideal for production. The files are in a temporary location and
// lack their original extensions.
const storage = multer.diskStorage({});


// Finally, we create and export the multer middleware instance.
// This `upload` object is what you'll use in your route definitions. It's configured with our chosen storage engine.
// For example, in `aiRoutes.js`, you would use it like: `router.post('/upload-image', upload.single('imageField'), ...)`
// `.single('imageField')` tells multer to expect one file from the form field named 'imageField'.
export const upload = multer({ storage });
