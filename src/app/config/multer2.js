const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type;
    const folderPath = path.join(__dirname, "../../../../save", type);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + path.extname(file.originalname);
    cb(null, filename);
  }
});

const upload = multer({ storage });

module.exports = upload;
