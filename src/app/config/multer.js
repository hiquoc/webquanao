const multer = require("multer");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      if (!req.firstFileProcessed) {
        req.firstFileProcessed = true;
        cb(null, "main-" + Date.now() + "-" + file.originalname);
      } else {
        cb(null, Date.now() + "-" + file.originalname); 
      }
    },
  });
  const upload = multer({ storage });
module.exports = upload;
