const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Define the storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderPath = path.join(__dirname, "../../../src/public");
        
        fs.readdir(folderPath, (err, files) => {
            if (err) {
                console.error("Could not list the directory.", err);
            } else {
                files.forEach((file) => {
                    if (file.endsWith(".jpg") || file.endsWith(".png") || file.endsWith(".jpeg")) {
                        fs.unlink(path.join(folderPath, file), (err) => {
                            if (err) console.error("Error deleting file:", file, err);
                        });
                    }
                });
            }
            cb(null, folderPath);
        });
    },
    filename: (req, file, cb) => {
        cb(null, "img" + path.extname(file.originalname));
    }
});

const upload = multer({ storage });
module.exports = upload;
